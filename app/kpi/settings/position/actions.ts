"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const fetchPaginationPosition = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const count = await prisma.position.count({
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

export const fetchDataPosition = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const positions = await prisma.position.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
    },
    where: {
      name: {
        contains: search,
      },
    },
    skip: offset,
    take: 10,
  });

  return positions;
};

export const createPosition = async (data: { name: string }) => {
  const user = await checkAdministrator();
  const schema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อสิทธิ์"),
  });

  const validate = schema.safeParse(data);

  if (!validate.success) {
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();

    await prisma.position.create({
      data: {
        name: validate.data.name,
        isActive: true,
        empid: Number(user.id),
        createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });

    revalidatePath("/kpi/settings/position");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ สร้างตำแหน่งเรียบร้อย",
    };
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};

export const updatePosition = async (data: {
  id: number;
  name: string;
  isActive: boolean;
}) => {
  const user = await checkAdministrator();
  const schema = z.object({
    id: z.number(),
    name: z.string().min(1, "กรุณากรอกชื่อสิทธิ์"),
    isActive: z.boolean(),
  });

  const validate = schema.safeParse(data);
  if (!validate.success) {
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();

    await prisma.position.update({
      where: { id: data.id },
      data: {
        name: validate.data.name,
        isActive: validate.data.isActive,
        empid: Number(user.id),
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });

    revalidatePath("/kpi/settings/position");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ แก้ไขตำแหน่งเรียบร้อย",
    };
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};
