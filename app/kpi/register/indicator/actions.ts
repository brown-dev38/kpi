"use server";

import { checkSession } from "@/lib/checksession";
import { fetchUserIndicatorPrograms, reportablePrograms } from "@/lib/access";
import prisma from "@/lib/prisma/prisma";
import { z } from "zod";

const activeProgramsSelect = {
  where: { isActive: true, program: { isActive: true } },
  select: { programid: true },
} as const;

/**
 * ตัวชี้วัดที่ผู้ใช้เห็น + หลักสูตรที่ยังไม่ลงข้อมูล (นับเฉพาะหลักสูตรที่ตัวเองรับผิดชอบ)
 * รายภาคการศึกษา: ลงภาคใดภาคหนึ่งของปีแล้ว ถือว่าลงแล้ว
 */
const fetchUserIndicators = async (mainid?: number, year?: number) => {
  const user = await checkSession();
  const access = await fetchUserIndicatorPrograms(Number(user.id), user.role);

  const indicators = await prisma.kpi_indicator.findMany({
    where: {
      isActive: true,
      ...(mainid ? { mainid } : {}),
      ...(access ? { id: { in: [...access.keys()] } } : {}),
    },
    select: {
      id: true,
      name: true,
      mainid: true,
      kpiMain: { select: { name: true } },
      kpiIndicatorPrograms: activeProgramsSelect,
      kpiIndicatorResponse: {
        where: {
          kpiIndicatorAnswer: { some: {} },
          ...(year ? { year } : {}),
        },
        select: { programid: true },
      },
    },
  });

  return indicators.flatMap((ind) => {
    const programs = reportablePrograms(
      ind.kpiIndicatorPrograms.map((p) => p.programid),
      access ? (access.get(ind.id) ?? []) : null,
    );
    if (programs.length === 0) return [];
    const unanswered = programs.filter(
      (id) => !ind.kpiIndicatorResponse.some((r) => r.programid === id),
    ).length;
    return [{ ...ind, unanswered }];
  });
};

export const fetchDataIndicator = async (year?: number) => {
  const indicators = await fetchUserIndicators(undefined, year);

  const mainMap = new Map<
    number,
    {
      mainid: number;
      kpiMain: { name: string } | null;
      unansweredCount: number;
    }
  >();

  for (const ind of indicators) {
    if (!mainMap.has(ind.mainid)) {
      mainMap.set(ind.mainid, {
        mainid: ind.mainid,
        kpiMain: ind.kpiMain,
        unansweredCount: 0,
      });
    }
    mainMap.get(ind.mainid)!.unansweredCount += ind.unanswered;
  }

  return Array.from(mainMap.values());
};

export const fetchDataIndicatorByMain = async (
  mainid: number,
  year?: number,
) => {
  const indicators = await fetchUserIndicators(mainid, year);

  return indicators.map((x) => ({
    id: x.id,
    name: x.name,
    isAnswered: x.unanswered === 0,
  }));
};

export const fetchDataIndicatorDetail = async (id: number, year: number) => {
  const user = await checkSession();
  const access = await fetchUserIndicatorPrograms(Number(user.id), user.role);

  const [indicator, response] = await Promise.all([
    prisma.kpi_indicator.findFirst({
      select: {
        name: true,
        resource: true,
        period: true,
        condition: true,
        target: true,
        unit: true,
        dividend: true,
        divisor: true,
        kpiMain: {
          select: {
            name: true,
          },
        },
        kpiSub: {
          select: {
            name: true,
          },
        },
        kpiIndicatorGuide: {
          select: {
            id: true,
            name: true,
          },
          where: {
            isActive: true,
          },
        },
        kpiIndicatorRefs: {
          select: {
            id: true,
            name: true,
            url: true,
          },
          where: {
            isActive: true,
          },
        },
        kpiIndicatorPrograms: {
          select: { program: { select: { id: true, name: true } } },
          where: { isActive: true, program: { isActive: true } },
          orderBy: { programid: "asc" },
        },
        kpiIndicatorUser: {
          select: {
            programid: true,
            program: { select: { name: true } },
            staff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
              },
            },
          },
          where: {
            isActive: true,
          },
        },
      },
      where: {
        id: Number(id),
        isActive: true,
      },
    }),
    prisma.kpi_indicator_response.findMany({
      where: { indicatorid: Number(id), year },
      select: {
        semester: true,
        programid: true,
        kpiIndicatorAnswer: {
          select: { dividend: true, divisor: true },
          take: 1,
        },
      },
    }),
  ]);

  if (!indicator) return null;

  const { kpiIndicatorPrograms, ...rest } = indicator;
  // แสดงเฉพาะหลักสูตรที่ผู้ใช้รับผิดชอบ; ไม่ได้ผูกหลักสูตร = programid 1
  const allowed = reportablePrograms(
    kpiIndicatorPrograms.map((x) => x.program.id),
    access ? (access.get(Number(id)) ?? []) : null,
  );
  if (allowed.length === 0) return null;
  const programs = kpiIndicatorPrograms.length
    ? kpiIndicatorPrograms
        .map((x) => x.program)
        .filter((p) => allowed.includes(p.id))
    : [{ id: 1, name: "" }];

  // รายปีเก็บ semester = 0, รายภาคเก็บ 1/2
  const semesters = indicator.period === "SEMESTER" ? [1, 2] : [0];
  const answers = semesters.flatMap((semester) =>
    programs.map((p) => {
      const ans = response.find(
        (r) => r.semester === semester && r.programid === p.id,
      )?.kpiIndicatorAnswer[0];
      return {
        semester,
        programid: p.id,
        programName: p.name,
        dividend: ans ? Number(ans.dividend) : null,
        divisor: ans ? Number(ans.divisor) : null,
      };
    }),
  );

  return { ...rest, target: Number(indicator.target), answers };
};

const isEmpty = (value: unknown) =>
  value === null || value === undefined || String(value).trim() === "";

export const createAnswerIndicator = async (
  data: {
    year: number;
    semester: number | null;
    answers: {
      programid: number;
      dividend: number | string | null;
      divisor: number | string | null;
    }[];
  },
  indicator: number,
) => {
  const user = await checkSession();
  const access = await fetchUserIndicatorPrograms(Number(user.id), user.role);

  const indicatorData = await prisma.kpi_indicator.findFirst({
    where: { id: indicator, isActive: true },
    select: {
      period: true,
      mainid: true,
      kpiIndicatorPrograms: activeProgramsSelect,
    },
  });

  if (!indicatorData) {
    return { status: false, messages: "ดำเนินการไม่สำเร็จ ไม่พบตัวชี้วัด" };
  }

  // บันทึกได้เฉพาะหลักสูตรที่ผู้ใช้รับผิดชอบ (ผู้ดูแลระบบ = ทุกหลักสูตร)
  const allowedPrograms = reportablePrograms(
    indicatorData.kpiIndicatorPrograms.map((x) => x.programid),
    access ? (access.get(indicator) ?? []) : null,
  );
  if (allowedPrograms.length === 0) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่มีสิทธิ์บันทึกตัวชี้วัดนี้",
    };
  }

  const year = z.coerce.number().int().min(1).safeParse(data.year);
  if (!year.success) {
    return { status: false, messages: "ดำเนินการไม่สำเร็จ กรุณาเลือกปี" };
  }

  const isSemester = indicatorData.period === "SEMESTER";
  const semester = isSemester ? Number(data.semester) : 0;
  if (isSemester && semester !== 1 && semester !== 2) {
    return { status: false, messages: "ดำเนินการไม่สำเร็จ กรุณาเลือกภาคเรียน" };
  }

  // หลักสูตรที่เว้นว่างทั้งตัวตั้งและตัวหาร = ไม่บันทึก (ไม่ทับผลของผู้รายงานคนอื่นด้วย 0)
  const filled = data.answers.filter(
    (a) => !(isEmpty(a.dividend) && isEmpty(a.divisor)),
  );
  if (filled.length === 0) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณากรอกข้อมูลอย่างน้อย 1 หลักสูตร",
    };
  }
  if (filled.some((a) => isEmpty(a.dividend) || isEmpty(a.divisor))) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณากรอกตัวตั้งและตัวหารให้ครบ",
    };
  }

  const answerSchema = z
    .array(
      z.object({
        programid: z
          .number()
          .int()
          .refine((id) => allowedPrograms.includes(id)),
        dividend: z.coerce.number().min(0, "กรุณากรอกตัวตั้ง"),
        divisor: z.coerce.number().min(0, "กรุณากรอกตัวหาร"),
      }),
    )
    .refine(
      (answers) =>
        new Set(answers.map((a) => a.programid)).size === answers.length,
    );

  const answerValidate = answerSchema.safeParse(filled);

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
      for (const answer of answerValidate.data) {
        const key = {
          indicatorid: indicator,
          year: year.data,
          semester,
          programid: answer.programid,
        };
        // empid/updateat ของ response = ผู้บันทึกล่าสุด
        const response = await tx.kpi_indicator_response.upsert({
          where: { indicatorid_year_semester_programid: key },
          update: { empid: Number(user.id), updateat: nowBkk },
          create: {
            ...key,
            period: indicatorData.period,
            mainid: indicatorData.mainid,
            empid: Number(user.id),
            createat: nowBkk,
            updateat: nowBkk,
          },
          select: { id: true },
        });

        // response อาจมีอยู่แล้วแต่ไม่มี answer จึงต้องเช็คก่อนว่าจะ update หรือ create
        const existingAnswer = await tx.kpi_indicator_answer.findFirst({
          where: { responseid: response.id },
          select: { id: true },
        });

        if (existingAnswer) {
          await tx.kpi_indicator_answer.update({
            where: { id: existingAnswer.id },
            data: {
              dividend: answer.dividend,
              divisor: answer.divisor,
              updateat: nowBkk,
            },
          });
        } else {
          await tx.kpi_indicator_answer.create({
            data: {
              responseid: response.id,
              indicatorid: indicator,
              dividend: answer.dividend,
              divisor: answer.divisor,
              createat: nowBkk,
              updateat: nowBkk,
            },
          });
        }
      }
    });
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ ไม่สามารถบันทึกข้อมูลได้",
    };
  }

  return {
    status: true,
    messages: "ดำเนินการสำเร็จ บันทึกข้อมูลเรียบร้อย",
  };
};
