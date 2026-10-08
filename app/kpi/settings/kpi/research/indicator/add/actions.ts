"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";

export const fetchDataResearchMain = async () => {
  await checkAdministrator();
  const data = await prisma.research_main.findMany({
    select: { id: true, name: true },
    where: { isActive: true },
  });
  return data;
};

export const fetchDataResearchIndicatorUser = async () => {
  await checkAdministrator();
  const data = await prisma.users.findMany({
    select: { id: true, first_name: true, last_name: true },
    where: { isActive: true },
  });
  return data;
};

export const createResearchIndicator = async (
  {
    mainid,
    name,
    resource,
    period,
    dividend,
    divisor,
    condition,
    target,
    unit,
  }: {
    mainid: number;
    name: string;
    resource: string;
    period: string;
    dividend: string;
    divisor: string;
    condition: string;
    target: number;
    unit: string;
  },
  users: { id: number; first_name: string | null; last_name: string | null }[],
  references: { name: string | null; url: string | null }[],
  guides: { name: string }[],
) => {
  const user = await checkAdministrator();

  const schema = z.object({
    mainid: z.coerce.number().min(1, "กรุณาเลือกหัวข้อหลัก"),
    name: z.string().min(1, "กรุณากรอกชื่อตัวชี้วัด"),
    resource: z.string().min(1, "กรุณากรอกข้อมูลที่ต้องเก็บ"),
    period: z.enum(["SEMESTER", "ANNUAL"]),
    dividend: z.string().min(1, "กรุณากรอกตัวตั้ง"),
    divisor: z.string(),
    condition: z.string().min(1, "กรุณากรอกเงื่อนไข"),
    target: z.coerce.number().min(0, "กรุณากรอกเป้าหมาย"),
    unit: z.string().min(1, "กรุณากรอกหน่วย"),
  });

  const validate = schema.safeParse({
    mainid,
    name,
    resource,
    period,
    dividend,
    divisor,
    condition,
    target,
    unit,
  });

  if (!validate.success) {
    return { errors: validate.error.flatten().fieldErrors };
  }

  try {
    const now = new Date();
    const indicator = await prisma.kpi_research.create({
      data: {
        mainid: validate.data.mainid,
        name: validate.data.name,
        resource: validate.data.resource,
        period: validate.data.period,
        dividend: validate.data.dividend,
        divisor: validate.data.divisor,
        condition: validate.data.condition,
        target: validate.data.target,
        unit: validate.data.unit,
        isActive: true,
        emp_id: Number(user.id),
        create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });

    for (const reference of references) {
      await prisma.kpi_research_ref.create({
        data: {
          indicatorid: indicator.id,
          name: reference.name ?? "",
          url: reference.url ?? "",
          isActive: true,
          emp_id: Number(user.id),
          create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        },
      });
    }

    for (const guide of guides) {
      await prisma.kpi_research_guide.create({
        data: {
          indicatorid: indicator.id,
          name: guide.name,
          isActive: true,
          emp_id: Number(user.id),
          create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        },
      });
    }

    for (const u of users) {
      await prisma.kpi_research_user.create({
        data: {
          indicatorid: indicator.id,
          staff_id: u.id,
          isActive: true,
          emp_id: Number(user.id),
          create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        },
      });
    }

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ สร้างตัวชี้วัดเรียบร้อย",
    };
  } catch (err) {
    console.log(err);
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};
