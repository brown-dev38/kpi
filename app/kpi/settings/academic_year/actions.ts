"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export const fetchPaginationAcademicYear = async (
  page: number,
  search: string,
) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const searchNum = Number(search);
  const count = await prisma.academic_year.count({
    where: search
      ? {
          OR: [
            ...(!isNaN(searchNum) && search !== ""
              ? [{ year: searchNum }, { semester: searchNum }]
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

export const fetchDataAcademicYear = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const searchNum = Number(search);
  const data = await prisma.academic_year.findMany({
    select: {
      id: true,
      year: true,
      semester: true,
      description: true,
      isActive: true,
    },
    where: search
      ? {
          OR: [
            ...(!isNaN(searchNum) && search !== ""
              ? [{ year: searchNum }, { semester: searchNum }]
              : []),
          ],
        }
      : {},
    orderBy: [{ year: "desc" }, { semester: "asc" }],
    skip: offset,
    take: 10,
  });

  return data;
};

export const createAcademicYear = async (data: {
  year: number;
  semester: number;
  description?: string;
}) => {
  const user = await checkAdministrator();
  const schema = z.object({
    year: z
      .number({ message: "กรุณากรอกปีการศึกษา" })
      .int()
      .min(2500, "ปีการศึกษาไม่ถูกต้อง"),
    semester: z
      .number({ message: "กรุณากรอกภาคการศึกษา" })
      .int()
      .min(1, "ภาคการศึกษาไม่ถูกต้อง")
      .max(3, "ภาคการศึกษาไม่ถูกต้อง"),
    description: z.string().optional(),
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
    await prisma.academic_year.create({
      data: {
        year: validate.data.year,
        semester: validate.data.semester,
        description: validate.data.description ?? null,
        isActive: true,
        emp_id: Number(user.id),
        create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });

    revalidatePath("/kpi/settings/academic_year");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ เพิ่มปีการศึกษาเรียบร้อย",
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

export const updateAcademicYear = async (data: {
  id: number;
  year: number;
  semester: number;
  description?: string;
  isActive: boolean;
}) => {
  const user = await checkAdministrator();
  const schema = z.object({
    id: z.number(),
    year: z
      .number({ message: "กรุณากรอกปีการศึกษา" })
      .int()
      .min(2500, "ปีการศึกษาไม่ถูกต้อง"),
    semester: z
      .number({ message: "กรุณากรอกภาคการศึกษา" })
      .int()
      .min(1, "ภาคการศึกษาไม่ถูกต้อง")
      .max(3, "ภาคการศึกษาไม่ถูกต้อง"),
    description: z.string().optional(),
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
    await prisma.academic_year.update({
      where: { id: data.id },
      data: {
        year: validate.data.year,
        semester: validate.data.semester,
        description: validate.data.description ?? null,
        isActive: validate.data.isActive,
        emp_id: Number(user.id),
        update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });

    revalidatePath("/kpi/settings/academic_year");

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ แก้ไขปีการศึกษาเรียบร้อย",
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
