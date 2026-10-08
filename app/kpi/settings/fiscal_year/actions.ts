"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const fetchPaginationFiscalYear = async (
  page: number,
  search: string,
) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const searchNum = Number(search);
  const count = await prisma.fiscal_year.count({
    where: search
      ? {
          OR: [
            ...(!isNaN(searchNum) && search !== ""
              ? [{ year: searchNum }]
              : []),
          ],
        }
      : {},
  });

  const totalPages = Math.ceil(count / 10);
  const start = count == 0 ? 0 : offset + 1;
  const end = Math.min(page * 10, count);
  return {
    totalPages,
    start,
    end,
    total: count,
  };
};

export const fetchDataFiscalYear = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const searchNum = Number(search);
  const data = await prisma.fiscal_year.findMany({
    select: {
      id: true,
      year: true,
      isActive: true,
    },
    where: search
      ? {
          OR: [
            ...(!isNaN(searchNum) && search !== ""
              ? [{ year: searchNum }]
              : []),
          ],
        }
      : {},
    orderBy: [{ year: "desc" }],
    skip: offset,
    take: 10,
  });

  return data;
};

export const createFiscalYear = async (data: { year: number }) => {
  const user = await checkAdministrator();
  const schema = z.object({
    year: z
      .number({ message: "กรุณากรอกปีงบประมาณ" })
      .int()
      .min(2500, "ปีงบประมาณไม่ถูกต้อง"),
  });

  const validate = schema.safeParse(data);
  if (!validate.success) {
    return {
      status: false,
      messages: "",
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();
    await prisma.fiscal_year.create({
      data: {
        year: validate.data.year,
        isActive: true,
        emp_id: Number(user.id),
        create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });

    revalidatePath("/kpi/settings/fiscal_year");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ เพิ่มปีงบประมาณเรียบร้อย",
      errors: null,
    };
  } catch {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      errors: null,
    };
  }
};

export const updateFiscalYear = async (data: {
  id: number;
  year: number;
  isActive: boolean;
}) => {
  const user = await checkAdministrator();
  const schema = z.object({
    id: z.number(),
    year: z
      .number({ message: "กรุณากรอกปีงบประมาณ" })
      .int()
      .min(2500, "ปีงบประมาณไม่ถูกต้อง"),
    isActive: z.boolean(),
  });

  const validate = schema.safeParse(data);
  if (!validate.success) {
    return {
      status: false,
      messages: "",
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();
    await prisma.fiscal_year.update({
      where: { id: data.id },
      data: {
        year: validate.data.year,
        isActive: validate.data.isActive,
        emp_id: Number(user.id),
        update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });

    revalidatePath("/kpi/settings/fiscal_year");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ แก้ไขปีงบประมาณเรียบร้อย",
      errors: null,
    };
  } catch {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
      errors: null,
    };
  }
};
