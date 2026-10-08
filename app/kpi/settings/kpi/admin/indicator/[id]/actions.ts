"use server";

import { checkAdministrator } from "@/lib/checksession";
import prisma from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const fetchDataAdminIndicatorById = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_admin.findUnique({
    where: { id: Number(id) },
  });
  return data ? { ...data, target: Number(data.target) } : data;
};

export const fetchDataAdminMain = async () => {
  await checkAdministrator();
  const data = await prisma.admin_main.findMany({
    select: { id: true, name: true },
    where: { isActive: true },
  });
  return data;
};

export const fetchDataEmployee = async () => {
  await checkAdministrator();
  const data = await prisma.users.findMany({
    select: { id: true, first_name: true, last_name: true },
    where: { isActive: true },
  });
  return data;
};

export const fetchDataAdminIndicatorReference = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_admin_ref.findMany({
    select: { id: true, name: true, url: true },
    where: { indicatorid: Number(id), isActive: true },
  });
  return data;
};

export const fetchDataAdminIndicatorGuide = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_admin_guide.findMany({
    select: { id: true, name: true },
    where: { indicatorid: Number(id), isActive: true },
  });
  return data;
};

export const fetchDataAdminEmployeeById = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_admin_user.findMany({
    where: { indicatorid: Number(id), isActive: true },
    select: {
      id: true,
      staff: {
        select: { id: true, first_name: true, last_name: true },
      },
    },
  });
  return data;
};

export const updateAdminIndicator = async (
  data: {
    mainid: number;
    name: string;
    resource: string;
    period: string;
    dividend: string;
    divisor: string;
    condition: string;
    target: number;
    unit: string;
    isActive: boolean;
  },
  reference: { id: number; name: string | null; url: string | null }[],
  guide: { id: number; name: string }[],
  inputEmployee: {
    staff: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[],
  id: number,
) => {
  const user = await checkAdministrator();

  const schema = z.object({
    mainid: z.number().min(1, "กรุณาเลือกหัวข้อหลัก"),
    name: z.string().min(1, "กรุณากรอกชื่อตัวชี้วัด"),
    resource: z.string().min(1, "กรุณากรอกข้อมูลที่ต้องเก็บ"),
    period: z.enum(["SEMESTER", "ANNUAL"]),
    dividend: z.string().min(1, "กรุณากรอกตัวตั้ง"),
    divisor: z.string(),
    condition: z.string().min(1, "กรุณากรอกเงื่อนไข"),
    target: z.coerce.number().min(0, "กรุณากรอกเป้าหมาย"),
    unit: z.string().min(1, "กรุณากรอกหน่วย"),
    isActive: z.boolean(),
  });

  const validate = schema.safeParse(data);

  if (!validate.success) {
    return { errors: validate.error.flatten().fieldErrors };
  }

  const now = new Date();

  try {
    await prisma.kpi_admin.update({
      where: { id },
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
        isActive: validate.data.isActive,
        emp_id: Number(user.id),
        update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขข้อมูลพื้นฐานได้",
    };
  }

  try {
    const oldRef = await prisma.kpi_admin_ref.findMany({
      where: { indicatorid: id, isActive: true },
    });
    const oldRefSet = new Set(oldRef.map((item) => item.id));
    const newRefSet = new Set(reference.map((item) => item?.id));

    for (const ref of oldRefSet) {
      if (!newRefSet.has(ref)) {
        await prisma.kpi_admin_ref.update({
          where: { id: ref },
          data: { isActive: false },
        });
      }
    }

    const newRef = reference.filter((item) => !oldRefSet.has(item?.id ?? 0));
    for (const ref of newRef) {
      await prisma.kpi_admin_ref.create({
        data: {
          indicatorid: id,
          name: ref.name ?? "",
          url: ref.url ?? "",
          isActive: true,
          emp_id: Number(user.id),
          create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        },
      });
    }
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขข้อมูลอ้างอิงได้ (Reference)",
    };
  }

  try {
    const oldGuide = await prisma.kpi_admin_guide.findMany({
      where: { indicatorid: id, isActive: true },
    });
    const oldGuideSet = new Set(oldGuide.map((item) => item.id));
    const newGuideSet = new Set(guide.map((item) => item?.id ?? 0));

    for (const g of oldGuideSet) {
      if (!newGuideSet.has(g)) {
        await prisma.kpi_admin_guide.update({
          where: { id: g },
          data: { isActive: false },
        });
      }
    }

    const newGuide = guide.filter((item) => !oldGuideSet.has(item?.id ?? 0));
    for (const g of newGuide) {
      await prisma.kpi_admin_guide.create({
        data: {
          indicatorid: id,
          name: g.name ?? "",
          isActive: true,
          emp_id: Number(user.id),
          create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        },
      });
    }
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขแนวทางการปฏิบัติได้ (Guide)",
    };
  }

  try {
    const oldEmployee = await prisma.kpi_admin_user.findMany({
      where: { indicatorid: id, isActive: true },
    });
    const oldEmployeeSet = new Set(oldEmployee.map((item) => item.id));
    const newEmployeeSet = new Set(
      inputEmployee.map((item) => item?.staff?.id ?? 0),
    );

    for (const emp of oldEmployeeSet) {
      if (!newEmployeeSet.has(emp)) {
        await prisma.kpi_admin_user.update({
          where: { id: emp },
          data: { isActive: false },
        });
      }
    }

    const newEmployee = inputEmployee.filter(
      (item) => !oldEmployeeSet.has(item?.staff?.id ?? 0),
    );
    for (const emp of newEmployee) {
      await prisma.kpi_admin_user.create({
        data: {
          indicatorid: id,
          staff_id: emp.staff?.id ?? 0,
          isActive: true,
          emp_id: Number(user.id),
          create_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          update_at: new Date(now.getTime() + 7 * 60 * 60 * 1000),
        },
      });
    }
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขผู้รับผิดชอบได้ (Employee)",
    };
  }

  revalidatePath("/kpi/settings/kpi/admin/indicator/" + id);

  return { status: true, messages: "ดำเนินการสำเร็จ แก้ไขตัวชี้วัดเรียบร้อย" };
};
