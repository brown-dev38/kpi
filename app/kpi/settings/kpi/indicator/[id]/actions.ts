"use server";

import { checkAdministrator } from "@/lib/checksession";
import prisma from "@/lib/prisma/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const fetchDataIndicatorById = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_indicator.findUnique({
    where: { id: Number(id) },
  });
  return data ? { ...data, target: Number(data.target) } : data;
};

export const fetchDataIndicatorMain = async () => {
  await checkAdministrator();
  const data = await prisma.kpi_main.findMany({
    where: {
      isActive: true,
    },
  });
  return data;
};

export const fetchDataIndicatorSub = async () => {
  await checkAdministrator();
  const data = await prisma.kpi_sub.findMany({
    where: {
      isActive: true,
    },
  });
  return data;
};

export const fetchDataEmployee = async () => {
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

export const fetchDataIndicatorReference = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_indicator_ref.findMany({
    select: {
      id: true,
      name: true,
      url: true,
    },
    where: {
      indicatorid: Number(id),
      isActive: true,
    },
  });
  return data;
};

export const fetchDataIndicatorGuide = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_indicator_guide.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      indicatorid: Number(id),
      isActive: true,
    },
  });
  return data;
};

export const fetchDataEmployeeById = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_indicator_user.findMany({
    where: {
      indicatorid: Number(id),
      isActive: true,
    },
    select: {
      id: true,
      programid: true,
      staff: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });

  return data;
};

export const fetchDataIndicatorProgram = async (id: string) => {
  await checkAdministrator();
  const data = await prisma.kpi_indicator_program.findMany({
    select: { programid: true },
    // หลักสูตรที่ถูกปิดใช้งานไม่แสดงใน checklist จึงไม่ส่งกลับไปด้วย
    // (ไม่เช่นนั้นตอนบันทึกจะตรวจหลักสูตรไม่ผ่าน)
    where: {
      indicatorid: Number(id),
      isActive: true,
      program: { isActive: true },
    },
  });
  return data.map((item) => item.programid);
};

export const updateIndicator = async (
  data: {
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
    isActive: boolean;
  },
  reference: {
    id: number;
    name: string | null;
    url: string | null;
  }[],
  guide: {
    id: number;
    name: string;
  }[],
  inputEmployee: {
    programid: number;
    staff: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[],
  id: number,
  programs: number[] = [],
) => {
  const user = await checkAdministrator();

  const schema = z.object({
    mainid: z.number().min(1, "กรุณาเลือกหัวข้อหลัก"),
    subid: z.coerce.number().optional(),
    name: z.string().min(1, "กรุณากรอกชื่อตัวชี้วัด"),
    resource: z.string().min(1, "กรุณากรอกข้อมูลที่ต้องเก็บ"),
    period: z.enum(["SEMESTER", "ANNUAL"], { message: "กรุณาเลือกรอบวัด" }),
    dividend: z.string().min(1, "กรุณากรอกตัวตั้ง"),
    divisor: z.string().min(1, "กรุณากรอกตัวหาร"),
    condition: z.string().min(1, "กรุณากรอกเงื่อนไข"),
    target: z.coerce.number().min(0, "กรุณากรอกเป้าหมาย"),
    unit: z.string().min(1, "กรุณากรอกหน่วย"),
    isActive: z.boolean(),
  });

  const validate = schema.safeParse({
    mainid: data.mainid,
    subid: data.subid,
    name: data.name,
    resource: data.resource,
    period: data.period,
    dividend: data.dividend,
    divisor: data.divisor,
    condition: data.condition,
    target: data.target,
    unit: data.unit,
    isActive: data.isActive,
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

  const now = new Date();

  try {
    await prisma.kpi_indicator.update({
      where: { id },
      data: {
        mainid: validate.data.mainid,
        subid: validate.data.subid ?? null,
        name: validate.data.name,
        resource: validate.data.resource,
        period: validate.data.period,
        dividend: validate.data.dividend,
        divisor: validate.data.divisor,
        condition: validate.data.condition,
        target: validate.data.target,
        unit: validate.data.unit,
        isActive: validate.data.isActive,
        empid: Number(user.id),
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขข้อมูลพื้นฐานได้",
    };
  }

  try {
    const oldRef = await prisma.kpi_indicator_ref.findMany({
      where: {
        indicatorid: id,
        isActive: true,
      },
    });

    const oldRefSet = new Set(oldRef.map((item) => item.id));
    const newRefSet = new Set(reference.map((item) => item?.id));

    for (const ref of oldRefSet) {
      if (!newRefSet.has(ref)) {
        await prisma.kpi_indicator_ref.update({
          where: { id: ref },
          data: { isActive: false },
        });
      }
    }

    const newRef = reference.filter((item) => !oldRefSet.has(item?.id ?? 0));

    if (newRef.length > 0) {
      for (const ref of newRef) {
        await prisma.kpi_indicator_ref.create({
          data: {
            indicatorid: id,
            name: ref.name ?? "",
            url: ref.url ?? "",
            isActive: true,
            empid: Number(user.id),
            createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
            updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          },
        });
      }
    }
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขข้อมูลอ้างอิงได้ (Reference)",
    };
  }

  try {
    const oldGuide = await prisma.kpi_indicator_guide.findMany({
      where: {
        indicatorid: id,
        isActive: true,
      },
    });

    const oldGuideSet = new Set(oldGuide.map((item) => item.id));
    const newGuideSet = new Set(guide.map((item) => item?.id ?? 0));

    for (const guide of oldGuideSet) {
      if (!newGuideSet.has(guide)) {
        await prisma.kpi_indicator_guide.update({
          where: { id: guide },
          data: { isActive: false },
        });
      }
    }

    const newGuide = guide.filter((item) => !oldGuideSet.has(item?.id ?? 0));

    if (newGuide.length > 0) {
      for (const guide of newGuide) {
        await prisma.kpi_indicator_guide.create({
          data: {
            indicatorid: id,
            name: guide.name ?? "",
            isActive: true,
            empid: Number(user.id),
            createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
            updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          },
        });
      }
    }
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขแนวทางการปฏิบัติได้ (Guide)",
    };
  }

  try {
    const oldEmployee = await prisma.kpi_indicator_user.findMany({
      where: {
        indicatorid: id,
        isActive: true,
      },
    });
    // เทียบด้วยคู่ (staffid, programid) ไม่ใช่ id ของแถว kpi_indicator_user
    // programid 1 = ทุกหลักสูตร, อื่นๆ ต้องเป็นหลักสูตรที่ผูกกับตัวชี้วัด
    // ผู้รับผิดชอบของหลักสูตรที่ถูกเอาออกจึงถูกปิดใช้งานไปด้วย
    const pairKey = (staffid: number, programid: number) =>
      `${staffid}:${programid}`;
    const allowedUserPrograms = new Set([1, ...programIds]);
    const newAssignments = new Map<
      string,
      { staffid: number; programid: number }
    >();
    for (const item of inputEmployee) {
      const staffid = item?.staff?.id;
      if (staffid && allowedUserPrograms.has(item.programid)) {
        newAssignments.set(pairKey(staffid, item.programid), {
          staffid,
          programid: item.programid,
        });
      }
    }
    const oldKeys = new Set(
      oldEmployee.map((item) => pairKey(item.staffid, item.programid)),
    );

    for (const employee of oldEmployee) {
      if (!newAssignments.has(pairKey(employee.staffid, employee.programid))) {
        await prisma.kpi_indicator_user.update({
          where: { id: employee.id },
          data: {
            isActive: false,
            empid: Number(user.id),
            updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          },
        });
      }
    }

    for (const [key, assignment] of newAssignments) {
      if (!oldKeys.has(key)) {
        await prisma.kpi_indicator_user.create({
          data: {
            indicatorid: id,
            staffid: assignment.staffid,
            programid: assignment.programid,
            isActive: true,
            empid: Number(user.id),
            createat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
            updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
          },
        });
      }
    }
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขผู้รับผิดชอบได้ (Employee)",
    };
  }

  try {
    const nowBkk = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.kpi_indicator_program.updateMany({
        where: { indicatorid: id, programid: { notIn: programIds } },
        data: { isActive: false, empid: Number(user.id), updateat: nowBkk },
      }),
      ...programIds.map((programid) =>
        prisma.kpi_indicator_program.upsert({
          where: { indicatorid_programid: { indicatorid: id, programid } },
          update: { isActive: true, empid: Number(user.id), updateat: nowBkk },
          create: {
            indicatorid: id,
            programid,
            isActive: true,
            empid: Number(user.id),
            createat: nowBkk,
            updateat: nowBkk,
          },
        }),
      ),
    ]);
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถแก้ไขหลักสูตรได้ (Program)",
    };
  }

  revalidatePath("/kpi/settings/kpi/indicator/" + id);

  return {
    status: true,
    messages: "ดำเนินการสำเร็จ แก้ไขตัวชี้วัดเรียบร้อย",
  };
};
