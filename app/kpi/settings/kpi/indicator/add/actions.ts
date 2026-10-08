"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";
import { z } from "zod";

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

export const fetchDataIndicatorSub = async () => {
  await checkAdministrator();
  const data = await prisma.kpi_sub.findMany({
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

export const fetchDataIndicatorUser = async () => {
  await checkAdministrator();
  const data = await prisma.users.findMany({
    select: {
      id: true,
      first_name: true,
      last_name: true,
    },
    where: {
      isActive: true,
    },
  });
  return data;
};

export const createIndicator = async (
  {
    mainid,
    subid,
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
    subid: number;
    name: string;
    resource: string;
    period: "SEMESTER" | "ANNUAL";
    dividend: string;
    divisor: string;
    condition: string;
    target: number;
    unit: string;
  },
  users: { id: number; programid: number }[],
  references: { name: string | null; url: string | null }[],
  guides: { name: string }[],
  programs: number[] = [],
) => {
  const user = await checkAdministrator();

  const schema = z.object({
    mainid: z.coerce.number().min(1, "กรุณาเลือกหัวข้อหลัก"),
    subid: z.coerce.number().optional(),
    name: z.string().min(1, "กรุณากรอกชื่อตัวชี้วัด"),
    resource: z.string().min(1, "กรุณากรอกข้อมูลที่ต้องเก็บ"),
    period: z.enum(["SEMESTER", "ANNUAL"], { error: "กรุณากรอกรอบวัด" }),
    dividend: z.string().min(1, "กรุณากรอกตัวตั้ง"),
    divisor: z.string().min(1, "กรุณากรอกตัวหาร"),
    condition: z.string().min(1, "กรุณากรอกเงื่อนไข"),
    target: z.coerce.number().min(0, "กรุณากรอกเป้าหมาย"),
    unit: z.string().min(1, "กรุณากรอกหน่วย"),
  });

  const validate = schema.safeParse({
    mainid,
    subid,
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
    return {
      errors: validate.error.flatten().fieldErrors,
    };
  }

  const programIds = [...new Set(programs)];
  const validPrograms = await prisma.program.count({
    where: { id: { in: programIds, not: 1 }, isActive: true },
  });
  if (validPrograms !== programIds.length) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ข้อมูลหลักสูตรไม่ถูกต้อง",
    };
  }

  // ผู้รับผิดชอบ: programid 1 = ทุกหลักสูตร, อื่นๆ ต้องเป็นหลักสูตรที่ผูกกับตัวชี้วัด
  // (ตัดคู่ (staffid, programid) ที่ซ้ำ และหลักสูตรที่ไม่ได้ผูกออก)
  const allowedUserPrograms = new Set([1, ...programIds]);
  const assignments = [
    ...new Map(
      users
        .filter((item) => allowedUserPrograms.has(item.programid))
        .map((item) => [`${item.id}:${item.programid}`, item]),
    ).values(),
  ];

  try {
    const now = new Date();
    const indicator = await prisma.kpi_indicator.create({
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

    if (references.length > 0) {
      for (const reference of references) {
        await prisma.kpi_indicator_ref.create({
          data: {
            indicatorid: indicator.id,
            name: reference.name ?? "",
            url: reference.url ?? "",
            isActive: true,
            empid: Number(user.id),
            createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
            updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          },
        });
      }
    }

    if (guides.length > 0) {
      for (const guide of guides) {
        await prisma.kpi_indicator_guide.create({
          data: {
            indicatorid: indicator.id,
            name: guide.name,
            isActive: true,
            empid: Number(user.id),
            createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
            updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          },
        });
      }
    }

    if (programIds.length > 0) {
      await prisma.kpi_indicator_program.createMany({
        data: programIds.map((programid) => ({
          indicatorid: indicator.id,
          programid,
          isActive: true,
          empid: Number(user.id),
          createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        })),
      });
    }

    if (assignments.length > 0) {
      for (const staff of assignments) {
        await prisma.kpi_indicator_user.create({
          data: {
            indicatorid: indicator.id,
            staffid: staff.id,
            programid: staff.programid,
            isActive: true,
            empid: Number(user.id),
            createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
            updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          },
        });
      }
    }

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
