"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { hashPassword } from "@/lib/auth/password";
import { adminCredentialsSchema } from "@/lib/auth/schema";
import { Prisma } from "@/lib/generated/prisma/client";

export const fetchDataDepartment = async () => {
  await checkAdministrator();
  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isActive: true,
    },
  });
  return departments;
};

export const fetchDataPosition = async () => {
  await checkAdministrator();
  const positions = await prisma.position.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isActive: true,
    },
  });
  return positions;
};

export const fetchDataRole = async () => {
  await checkAdministrator();
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isActive: true,
    },
  });
  return roles;
};
export const fetchPaginationUser = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const count = await prisma.users.count({
    where: {
      OR: [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
        { role: { name: { contains: search } } },
        { department: { name: { contains: search } } },
        { position: { name: { contains: search } } },
      ],
    },
  });

  const totalPages = Math.ceil(count / 10);
  const start = count == 0 ? 0 : offset + 1;
  const end = Math.min(page * 10, count);
  return {
    totalPages: totalPages,
    start: start,
    end: end,
    total: count,
  };
};

export const fetchDataUser = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const users = await prisma.users.findMany({
    select: {
      id: true,
      first_name: true,
      last_name: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      position: {
        select: {
          id: true,
          name: true,
        },
      },
      role: {
        select: {
          id: true,
          name: true,
        },
      },
      isActive: true,
    },
    where: {
      OR: [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
        { role: { name: { contains: search } } },
        { department: { name: { contains: search } } },
        { position: { name: { contains: search } } },
      ],
    },
    skip: offset,
    take: 10,
  });

  return users;
};

export const fetchDataUserById = async (id: number) => {
  await checkAdministrator();
  const user = await prisma.users.findUnique({
    where: { id: id },
    select: {
      id: true,
      username: true,
      email: true,
      cid: true,
      first_name: true,
      last_name: true,
      roleid: true,
      depid: true,
      posid: true,
      isActive: true,
    },
  });
  return user;
};

export const updateUser = async (data: {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  cid: string | null;
  roleid: number;
  depid: number | null;
  posid: number | null;
  isActive: boolean;
}) => {
  const currentUser = await checkAdministrator();
  const schema = z
    .object({
      id: z.number().min(1, "กรุณากรอกรหัสผู้ใช้งาน"),
      first_name: z.string().min(1, "กรุณากรอกชื่อ"),
      last_name: z.string().min(1, "กรุณากรอกนามสกุล"),
      username: z.string().min(1, "กรุณากรอกชื่อผู้ใช้งาน"),
      email: adminCredentialsSchema.shape.email,
      password: adminCredentialsSchema.shape.password,
      passwordConfirm: z.string().max(128, "การยืนยันรหัสผ่านยาวเกินไป"),
      cid: z.string().min(1, "กรุณากรอกรหัสประจำตัวประชาชน"),
      roleid: z.number().min(1, "กรุณาทำการเลือกสิทธิ์การใช้งาน"),
      depid: z.number().min(1, "กรุณาทำการเลือกหน่วยงาน"),
      posid: z.number().min(1, "กรุณาทำการเลือกตำแหน่ง"),
      isActive: z.boolean(),
    })
    .superRefine((value, context) => {
      if (value.password && !value.email) {
        context.addIssue({
          code: "custom",
          path: ["email"],
          message: "กรุณากรอกอีเมลก่อนกำหนดรหัสผ่าน",
        });
      }
      if (value.password !== value.passwordConfirm) {
        context.addIssue({
          code: "custom",
          path: ["passwordConfirm"],
          message: "การยืนยันรหัสผ่านไม่ตรงกัน",
        });
      }
    });

  const validate = schema.safeParse(data);
  if (!validate.success) {
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  // ต้องเหลือผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 คน ไม่เช่นนั้นจะไม่มีใคร
  // เข้าหน้าจัดการผู้ใช้งานได้อีก (ถอดสิทธิ์/ปิดใช้งานคนสุดท้ายไม่ได้)
  const adminRole = await prisma.role.findFirst({
    where: { name: "administrator" },
    select: { id: true },
  });
  if (
    adminRole &&
    (validate.data.roleid !== adminRole.id || !validate.data.isActive)
  ) {
    const remainingAdmins = await prisma.users.count({
      where: {
        roleid: adminRole.id,
        isActive: true,
        id: { not: validate.data.id },
      },
    });
    if (remainingAdmins === 0) {
      return {
        status: false,
        messages:
          "ดำเนินการไม่สำเร็จ ต้องมีผู้ดูแลระบบที่ใช้งานได้อย่างน้อย 1 คน",
      };
    }
  }

  try {
    const now = new Date();

    const passwordData = validate.data.password
      ? {
          passwordHash: await hashPassword(validate.data.password),
          passwordChangedAt: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          // Avoid redirecting the action response if an administrator edits
          // their own credentials. Other users must change an initial password.
          mustChangePassword: Number(currentUser.id) !== validate.data.id,
          failedLoginAttempts: 0,
          lockedUntil: null,
        }
      : {};

    await prisma.users.update({
      where: { id: validate.data.id },
      data: {
        first_name: validate.data.first_name,
        last_name: validate.data.last_name,
        username: validate.data.username,
        email: validate.data.email || null,
        cid: validate.data.cid,
        roleid: validate.data.roleid,
        depid: validate.data.depid,
        posid: validate.data.posid,
        isActive: validate.data.isActive,
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        ...passwordData,
      },
    });

    revalidatePath("/kpi/settings/users");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ แก้ไขผู้ใช้งานเรียบร้อย",
    };
  } catch (err) {
    console.error("Unable to update user credentials", err);

    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return {
        status: false,
        messages: "อีเมลนี้ถูกใช้งานโดยบัญชีอื่นแล้ว",
      };
    }

    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};
