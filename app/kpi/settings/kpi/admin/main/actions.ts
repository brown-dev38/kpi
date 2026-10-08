"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const fetchPaginationAdminMain = async (
  page: number,
  search: string
) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const count = await prisma.admin_main.count({
    where: {
      name: {
        contains: search,
      },
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

export const fetchDataAdminMain = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const data = await prisma.admin_main.findMany({
    skip: offset,
    take: 10,
    where: {
      name: {
        contains: search,
      },
    },
  });
  return data;
};

export const createAdminMain = async ({ name }: { name: string }) => {
  const user = await checkAdministrator();

  const schema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อหัวข้อหลัก"),
  });

  const validate = schema.safeParse({ name });
  if (!validate.success) {
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();
    await prisma.admin_main.create({
      data: {
        name: validate.data.name,
        isActive: true,
        emp_id: Number(user.id),
        create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });
    revalidatePath("/kpi/settings/kpi/admin/main");
    return {
      status: true,
      messages: "ดำเนินการสำเร็จ สร้างหัวข้อหลักเรียบร้อย",
    };
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};

export const updateAdminMain = async ({
  id,
  name,
  isActive,
}: {
  id: number;
  name: string;
  isActive: boolean;
}) => {
  const user = await checkAdministrator();

  const schema = z.object({
    id: z.number(),
    name: z.string().min(1, "กรุณากรอกชื่อหัวข้อหลัก"),
    isActive: z.boolean(),
  });

  const validate = schema.safeParse({ id, name, isActive });
  if (!validate.success) {
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();
    await prisma.admin_main.update({
      where: { id: validate.data.id },
      data: {
        name: validate.data.name,
        isActive: validate.data.isActive,
        emp_id: Number(user.id),
        update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });
    revalidatePath("/kpi/settings/kpi/admin/main");
    return {
      status: true,
      messages: "ดำเนินการสำเร็จ แก้ไขหัวข้อหลักเรียบร้อย",
    };
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};
