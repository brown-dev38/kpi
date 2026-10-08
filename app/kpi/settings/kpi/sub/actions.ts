"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const fetchPaginationIndicatorSub = async (
  page: number,
  search: string
) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const count = await prisma.kpi_sub.count({
    where: {
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          kpiMain: {
            name: {
              contains: search,
            },
          },
        },
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

export const fetchDataIndicatorSub = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const data = await prisma.kpi_sub.findMany({
    skip: offset,
    take: 10,
    select: {
      id: true,
      name: true,
      isActive: true,
      kpiMain: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    where: {
      OR: [
        {
          name: {
            contains: search,
          },
        },
        {
          kpiMain: {
            name: {
              contains: search,
            },
          },
        },
      ],
    },
  });
  return data;
};

export const fetchDataIndicatorMain = async () => {
  await checkAdministrator();
  const data = await prisma.kpi_main.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isActive: true,
    },
  });
  return data;
};

export const createIndicatorSub = async ({
  name,
  mainid,
}: {
  name: string;
  mainid: number;
}) => {
  const user = await checkAdministrator();

  const schema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อหัวข้อย่อย"),
    mainid: z.coerce.number().min(1, "กรุณาเลือกหัวข้อหลัก"),
  });

  const validate = schema.safeParse({ name, mainid });
  if (!validate.success) {
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();
    await prisma.kpi_sub.create({
      data: {
        name: validate.data.name,
        mainid: validate.data.mainid,
        isActive: true,
        empid: Number(user.id),
        createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });
    revalidatePath("/kpi/settings/indicator/sub");
    return {
      status: true,
      messages: "ดำเนินการสำเร็จ สร้างหัวข้อย่อยเรียบร้อย",
    };
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};

export const updateIndicatorSub = async ({
  id,
  name,
  mainid,
  isActive,
}: {
  id: number;
  name: string;
  mainid: number;
  isActive: boolean;
}) => {
  const user = await checkAdministrator();

  const schema = z.object({
    id: z.number(),
    name: z.string().min(1, "กรุณากรอกชื่อหัวข้อหลัก"),
    mainid: z.coerce.number().min(1, "กรุณาเลือกหัวข้อหลัก"),
    isActive: z.boolean(),
  });

  const validate = schema.safeParse({ id, name, mainid, isActive });
  if (!validate.success) {
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();
    await prisma.kpi_sub.update({
      where: { id: validate.data.id },
      data: {
        name: validate.data.name,
        mainid: validate.data.mainid,
        isActive: validate.data.isActive,
        empid: Number(user.id),
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });
    revalidatePath("/kpi/settings/indicator/sub");
    return {
      status: true,
      messages: "ดำเนินการสำเร็จ แก้ไขหัวข้อย่อยเรียบร้อย",
    };
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};
