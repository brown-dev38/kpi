"use server";

import { checkSession } from "@/lib/checksession";
import { canAccessKpi, hasFullKpiAccess } from "@/lib/access";
import prisma from "@/lib/prisma/prisma";
import { z } from "zod";

export const fetchFiscalYears = async (mainid?: number) => {
  const user = await checkSession();

  const fiscalYears = await prisma.fiscal_year.findMany({
    where: { isActive: true },
    select: { id: true, year: true },
    orderBy: { year: "desc" },
  });

  const [fullAccess, researchUser] = await Promise.all([
    hasFullKpiAccess(Number(user.id), user.role),
    prisma.kpi_research_user.findMany({
      where: { isActive: true, staff_id: Number(user.id) },
      select: { indicatorid: true },
    }),
  ]);

  const accessWhere = fullAccess
    ? { isActive: true, ...(mainid ? { mainid } : {}) }
    : {
        isActive: true,
        id: { in: researchUser.map((x) => x.indicatorid) },
        ...(mainid ? { mainid } : {}),
      };

  const [indicators, responses] = await Promise.all([
    prisma.kpi_research.findMany({ where: accessWhere, select: { id: true } }),
    prisma.kpi_research_response.findMany({
      where: { year: { in: fiscalYears.map((fy) => fy.year) } },
      select: { indicatorid: true, year: true },
    }),
  ]);

  const indicatorIds = new Set(indicators.map((i) => i.id));
  const answeredMap = new Map<number, Set<number>>();
  for (const r of responses) {
    if (!indicatorIds.has(r.indicatorid)) continue;
    if (!answeredMap.has(r.year)) answeredMap.set(r.year, new Set());
    answeredMap.get(r.year)!.add(r.indicatorid);
  }

  return fiscalYears.map((fy) => ({
    id: fy.id,
    year: fy.year,
    unansweredCount: indicators.filter(
      (i) => !answeredMap.get(fy.year)?.has(i.id),
    ).length,
  }));
};

export const fetchDataResearch = async (year: number, mainid?: number) => {
  const user = await checkSession();

  const [fullAccess, researchUser, responses] = await Promise.all([
    hasFullKpiAccess(Number(user.id), user.role),
    prisma.kpi_research_user.findMany({
      where: { isActive: true, staff_id: Number(user.id) },
      select: { indicatorid: true },
    }),
    prisma.kpi_research_response.findMany({
      where: { year },
      select: { indicatorid: true },
    }),
  ]);

  const answeredIds = new Set(responses.map((r) => r.indicatorid));

  const accessWhere = fullAccess
    ? { isActive: true, ...(mainid ? { mainid } : {}) }
    : {
        isActive: true,
        id: { in: researchUser.map((x) => x.indicatorid) },
        ...(mainid ? { mainid } : {}),
      };

  const indicators = await prisma.kpi_research.findMany({
    where: accessWhere,
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  return indicators.map((x) => ({
    id: x.id,
    name: x.name,
    isAnswered: answeredIds.has(x.id),
  }));
};

export const fetchDataResearchDetail = async (id: number, year: number) => {
  const user = await checkSession();
  // เปิดดูได้เฉพาะผู้รับผิดชอบตัวชี้วัด (ผู้ดูแลระบบ/เจ้าหน้าที่ = ทุกตัวชี้วัด)
  if (
    !(await canAccessKpi("research", Number(id), Number(user.id), user.role))
  ) {
    return null;
  }

  const [indicator, response] = await Promise.all([
    prisma.kpi_research.findFirst({
      select: {
        name: true,
        resource: true,
        period: true,
        condition: true,
        target: true,
        unit: true,
        dividend: true,
        divisor: true,
        kpiResearchGuides: {
          select: { id: true, name: true },
          where: { isActive: true },
        },
        kpiResearchRefs: {
          select: { id: true, name: true, url: true },
          where: { isActive: true },
        },
        kpiResearchUsers: {
          select: {
            staff: { select: { id: true, first_name: true, last_name: true } },
          },
          where: { isActive: true },
        },
      },
      where: { id: Number(id), isActive: true },
    }),
    prisma.kpi_research_response.findFirst({
      where: { indicatorid: Number(id), year },
      select: { id: true },
    }),
  ]);

  let answer: { dividend: number; divisor: number | null } | null = null;
  if (response) {
    const ans = await prisma.kpi_research_answer.findFirst({
      where: { responseid: response.id },
      select: { dividend: true, divisor: true },
    });
    if (ans) {
      answer = {
        dividend: Number(ans.dividend),
        divisor: ans.divisor !== null ? Number(ans.divisor) : null,
      };
    }
  }

  if (!indicator) return null;
  return { ...indicator, target: Number(indicator.target), answer };
};

export const createAnswerResearch = async (
  data: {
    year: number;
    dividend: number | null;
    divisor: number | null;
  },
  main: number,
  indicator: number,
) => {
  const user = await checkSession();
  // บันทึกได้เฉพาะผู้รับผิดชอบตัวชี้วัด (ผู้ดูแลระบบ/เจ้าหน้าที่ = ทุกตัวชี้วัด)
  if (
    !(await canAccessKpi("research", indicator, Number(user.id), user.role))
  ) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่มีสิทธิ์บันทึกตัวชี้วัดนี้",
    };
  }

  const indicatorData = await prisma.kpi_research.findFirst({
    where: { id: indicator, isActive: true },
    select: { period: true, divisor: true },
  });

  if (!indicatorData) {
    return { status: false, messages: "ดำเนินการไม่สำเร็จ ไม่พบตัวชี้วัด" };
  }

  // บางตัวชี้วัดไม่มีตัวหาร (คำนวณจากตัวตั้งอย่างเดียว) — ต้องเช็คจากการตั้งค่า
  // ตัวชี้วัดก่อนบันทึก ไม่เช่นนั้นค่าว่างจะถูก coerce เป็น 0 แล้วทำให้คำนวณผลลัพธ์
  // ไม่ได้ (หารด้วย 0) จนกราฟ dashboard ไม่แสดงผลทั้งที่บันทึกสำเร็จแล้ว
  const requiresDivisor = Boolean(indicatorData.divisor);

  const answerSchema = z.object({
    dividend: z.coerce.number().min(0, "กรุณากรอกตัวตั้ง"),
    divisor: requiresDivisor
      ? z.coerce.number().min(0, "กรุณากรอกตัวหาร")
      : z.null(),
  });

  const answerValidate = answerSchema.safeParse({
    dividend: data.dividend,
    divisor: requiresDivisor ? data.divisor : null,
  });

  if (!answerValidate.success) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ข้อมูล Answer ไม่ถูกต้อง",
    };
  }

  const now = new Date();
  const nowBkk = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  try {
    await prisma.$transaction(async (tx) => {
      const existingResponse = await tx.kpi_research_response.findFirst({
        where: { indicatorid: indicator, year: data.year },
        select: { id: true },
      });

      // response กับ answer อาจไม่ตรงกัน (มี response แต่ไม่มี answer) จึงต้อง
      // เช็คว่ามี answer อยู่จริงก่อน ไม่เช่นนั้น updateMany จะไม่ match แถวใดเลย
      // แล้วไม่บันทึกข้อมูลให้ทั้งที่ระบบแจ้งผลว่าสำเร็จ
      let responseid = existingResponse?.id;

      if (!responseid) {
        const responseSchema = z.object({
          year: z.coerce.number().min(1, "กรุณากรอกปี"),
          mainid: z.coerce.number().min(1, "กรุณากรอกหัวข้อหลัก"),
          indicatorid: z.coerce.number().min(1, "กรุณากรอกตัวชี้วัด"),
        });

        const responseValidate = responseSchema.safeParse({
          year: data.year,
          mainid: main,
          indicatorid: indicator,
        });

        if (!responseValidate.success) {
          throw new Error("INVALID_RESPONSE");
        }

        const newResponse = await tx.kpi_research_response.create({
          data: {
            year: responseValidate.data.year,
            mainid: responseValidate.data.mainid,
            indicatorid: responseValidate.data.indicatorid,
            emp_id: Number(user.id),
            create_at: nowBkk,
            update_at: nowBkk,
          },
        });

        responseid = newResponse.id;
      }

      const existingAnswer = await tx.kpi_research_answer.findFirst({
        where: { responseid },
        select: { id: true },
      });

      if (existingAnswer) {
        await tx.kpi_research_answer.update({
          where: { id: existingAnswer.id },
          data: {
            dividend: answerValidate.data.dividend,
            divisor: answerValidate.data.divisor,
            update_at: nowBkk,
          },
        });
      } else {
        await tx.kpi_research_answer.create({
          data: {
            responseid,
            indicatorid: indicator,
            dividend: answerValidate.data.dividend,
            divisor: answerValidate.data.divisor,
            create_at: nowBkk,
            update_at: nowBkk,
          },
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "INVALID_RESPONSE") {
      return {
        status: false,
        messages: "ดำเนินการไม่สำเร็จ ข้อมูล Response ไม่ถูกต้อง",
      };
    }
    console.log(err)
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถบันทึกข้อมูลได้",
    };
  }

  return { status: true, messages: "ดำเนินการสำเร็จ บันทึกข้อมูลเรียบร้อย" };
};
