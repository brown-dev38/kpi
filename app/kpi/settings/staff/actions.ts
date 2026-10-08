"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const fetchDataEmployee = async ({
  page,
  search,
}: {
  page: number;
  search: string;
}) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const employees = await prisma.staff.findMany({
    select: {
      id: true,
      isActive: true,
      staffDetail: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          department: {
            select: {
              name: true,
            },
          },
          position: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    where: {
      OR: [
        { staffDetail: { first_name: { contains: search } } },
        { staffDetail: { last_name: { contains: search } } },
        { staffDetail: { department: { name: { contains: search } } } },
        { staffDetail: { position: { name: { contains: search } } } },
      ],
    },
    skip: offset,
    take: 10,
  });

  const count = await prisma.staff.count({
    where: {
      OR: [
        { staffDetail: { first_name: { contains: search } } },
        { staffDetail: { last_name: { contains: search } } },
        { staffDetail: { department: { name: { contains: search } } } },
        { staffDetail: { position: { name: { contains: search } } } },
      ],
    },
  });

  const totalPages = Math.ceil(count / 10);
  const start = count == 0 ? 0 : offset + 1;
  const end = Math.min(page * 10, count);

  return {
    data: employees,
    pagination: { totalPages, start, end, total: count },
  };
};

export const fetchDataStaff = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  return prisma.staff.findMany({
    select: {
      id: true,
      isActive: true,
      staffDetail: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          department: { select: { name: true } },
          position: { select: { name: true } },
        },
      },
    },
    where: {
      OR: [
        { staffDetail: { first_name: { contains: search } } },
        { staffDetail: { last_name: { contains: search } } },
        { staffDetail: { department: { name: { contains: search } } } },
        { staffDetail: { position: { name: { contains: search } } } },
      ],
    },
    skip: offset,
    take: 10,
  });
};

export const updateStaff = async (data: { id: number; isActive: boolean }) => {
  const user = await checkAdministrator();
  const schema = z.object({
    id: z.number().min(1),
    isActive: z.boolean(),
  });

  const validate = schema.safeParse(data);
  if (!validate.success) {
    return { errors: z.flattenError(validate.error).fieldErrors };
  }

  try {
    const now = new Date();
    const bkk = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    await prisma.staff.update({
      where: { id: validate.data.id },
      data: {
        isActive: validate.data.isActive,
        empid: Number(user.id),
        updateat: bkk,
      },
    });

    revalidatePath("/kpi/settings/staff");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ แก้ไขเจ้าหน้าที่เรียบร้อย",
    };
  } catch {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};

export const fetchAvailableEmployees = async () => {
  await checkAdministrator();
  const alreadyStaff = await prisma.staff.findMany({
    select: { staffid: true },
  });
  const staffIds = alreadyStaff.map((s) => s.staffid);

  return prisma.users.findMany({
    where: {
      isActive: true,
      id: { notIn: staffIds.length ? staffIds : [-1] },
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
    orderBy: { first_name: "asc" },
  });
};

export const createStaff = async (data: { staffid: number }) => {
  const user = await checkAdministrator();

  const schema = z.object({
    staffid: z.number().min(1, "กรุณาเลือกพนักงาน"),
  });

  const validate = schema.safeParse(data);
  if (!validate.success) {
    return { errors: z.flattenError(validate.error).fieldErrors };
  }

  try {
    const now = new Date();
    const bkk = new Date(now.getTime() + 7 * 60 * 60 * 1000);

    await prisma.staff.create({
      data: {
        staffid: validate.data.staffid,
        isActive: true,
        empid: Number(user.id),
        createat: bkk,
        updateat: bkk,
      },
    });

    revalidatePath("/kpi/settings/staff");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ เพิ่มเจ้าหน้าที่เรียบร้อย",
    };
  } catch (e) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};
