"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { period } from "@/lib/generated/prisma/enums";

export const fetchPaginationKPIIndicator = async (
  page: number,
  search: string,
) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const count = await prisma.kpi_indicator.count({
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
        {
          kpiSub: {
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

export const fetchDataIndicator = async (page: number, search: string) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const data = await prisma.kpi_indicator.findMany({
    select: {
      id: true,
      name: true,
      condition: true,
      target: true,
      unit: true,
      kpiMain: {
        select: {
          id: true,
          name: true,
        },
      },
      kpiSub: {
        select: {
          id: true,
          name: true,
        },
      },
      isActive: true,
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
        {
          kpiSub: {
            name: {
              contains: search,
            },
          },
        },
      ],
    },
    skip: offset,
    take: 10,
  });
  return data.map((item) => ({ ...item, target: Number(item.target) }));
};

export const createIndicatorMain = async ({
  name,
  mainid,
  subid,
  resource,
  reference,
  period,
  dividend,
  divisor,
  condition,
  target,
  unit,
}: {
  name: string;
  mainid: number;
  subid: number;
  resource: string;
  reference: string;
  period: period;
  dividend: string;
  divisor: string;
  condition: string;
  target: number;
  unit: string;
}) => {
  const user = await checkAdministrator();

  const schema = z.object({
    name: z.string().min(1, "กรุณากรอกชื่อตัวชี้วัด"),
    mainid: z.coerce.number().min(1, "กรุณาเลือกหัวข้อหลัก"),
    subid: z.coerce.number().optional(),
    resource: z.string().min(1, "กรุณากรอกข้อมูลที่ต้องเก็บ"),
    reference: z.string().optional(),
    period: z.enum(["SEMESTER", "ANNUAL"]),
    dividend: z.string().min(1, "กรุณากรอกตัวตั้ง"),
    divisor: z.string().min(1, "กรุณากรอกตัวหาร"),
    condition: z.string().min(1, "กรุณากรอกเงื่อนไข"),
    target: z.coerce.number().min(1, "กรุณากรอกเป้าหมาย"),
    unit: z.string().min(1, "กรุณากรอกหน่วย"),
  });

  const validate = schema.safeParse({
    mainid,
    subid,
    name,
    resource,
    reference,
    period,
    dividend,
    divisor,
    condition,
    target,
    unit,
  });
  if (!validate.success) {
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  try {
    const now = new Date();
    await prisma.kpi_indicator.create({
      data: {
        name: validate.data.name,
        mainid: validate.data.mainid,
        subid: validate.data.subid ?? null,
        resource: validate.data.resource,
        period: validate.data.period,
        dividend: validate.data.dividend,
        divisor: validate.data.divisor,
        condition: validate.data.condition,
        target: validate.data.target,
        unit: validate.data.unit,
        isActive: true,
        empid: Number(user.id),
        createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });
    revalidatePath("/kpi/settings/indicator/indicator");
    return {
      status: true,
      messages: "ดำเนินการสำเร็จ สร้างตัวชี้วัดเรียบร้อย",
    };
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};

export const updateIndicatorMain = async ({
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
    await prisma.kpi_main.update({
      where: { id: validate.data.id },
      data: {
        name: validate.data.name,
        isActive: validate.data.isActive,
        empid: Number(user.id),
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });
    revalidatePath("/kpi/settings/indicator/main");
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
