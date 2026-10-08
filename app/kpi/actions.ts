"use server";

import prisma from "@/lib/prisma/prisma";
import { signOut } from "@/auth";
import { checkSession } from "@/lib/checksession";
import {
  fetchUserIndicatorPrograms,
  hasFullKpiAccess,
  reportablePrograms,
} from "@/lib/access";
import { z } from "zod";

export const logOut = async () => {
  await signOut({ redirectTo: "/login" });
};

// โปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่เท่านั้น: ใช้ id จาก session ไม่รับ id จาก client
// (ไม่เช่นนั้นจะอ่าน/แก้ข้อมูลของผู้ใช้อื่นได้ รวมถึงเลขบัตรประชาชน)
export const fetchProfile = async () => {
  const sessionUser = await checkSession();

  const user = await prisma.users.findUnique({
    where: {
      id: Number(sessionUser.id),
    },
    select: {
      id: true,
      username: true,
      first_name: true,
      last_name: true,
      cid: true,
      depid: true,
      department: {
        select: {
          name: true,
        },
      },
      posid: true,
      position: {
        select: {
          name: true,
        },
      },
    },
  });

  const departments = await prisma.department.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isActive: true,
    },
  });

  const positions = await prisma.position.findMany({
    select: {
      id: true,
      name: true,
    },
    where: {
      isActive: true,
    },
  });

  return {
    user: user,
    departments: departments,
    positions: positions,
  };
};

export const updateProfile = async (params: {
  username: string;
  first_name: string;
  last_name: string;
  cid: string;
  department: number;
  position: number;
}) => {
  const user = await checkSession();

  const schema = z.object({
    username: z.string(),
    first_name: z.string().min(1, "กรุณากรอกชื่อ"),
    last_name: z.string().min(1, "กรุณากรอกนามสกุล"),
    cid: z.string().min(1, "กรุณากรอกรหัสประจำตัวประชาชน"),
    department: z.number().min(1, "กรุณาทำการเลือกหน่วยงาน"),
    position: z.number().min(1, "กรุณาทำการเลือกตำแหน่ง"),
  });

  const validate = schema.safeParse(params);

  if (!validate.success)
    return {
      errors: validate.error.flatten().fieldErrors,
    };

  try {
    const now = new Date();

    await prisma.users.update({
      where: {
        id: Number(user.id),
      },
      data: {
        username: validate.data.username,
        first_name: validate.data.first_name,
        last_name: validate.data.last_name,
        cid: validate.data.cid,
        depid: validate.data.department,
        posid: validate.data.position,
        updateat: new Date(now.getTime() + 7 * 60 * 60 * 1000),
      },
    });

    return {
      status: true,
      messages: "ดำเนินการสำเร็จ แก้ไขข้อมูลเรียบร้อย",
    };
  } catch (err) {
    return {
      status: false,
      messages: "ดำเนินการไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
};

export const fetchDashboardIndicatorByMain = async (
  mainid: number,
  year: number,
  staffId?: number | null,
) => {
  let accessWhere: object = { isActive: true, mainid };

  if (staffId) {
    const [staff, indicatorUser] = await Promise.all([
      prisma.staff.findFirst({
        where: { isActive: true, staffid: staffId },
      }),
      prisma.kpi_indicator_user.findMany({
        where: { isActive: true, staffid: staffId },
        select: { indicatorid: true },
      }),
    ]);

    if (!staff) {
      accessWhere = {
        isActive: true,
        mainid,
        id: { in: indicatorUser.map((x) => x.indicatorid) },
      };
    }
  }

  const indicators = await prisma.kpi_indicator.findMany({
    where: accessWhere,
    select: {
      id: true,
      name: true,
      period: true,
      condition: true,
      target: true,
      unit: true,
      dividend: true,
      divisor: true,
      kpiIndicatorPrograms: {
        where: { isActive: true, program: { isActive: true } },
        select: { program: { select: { id: true, name: true } } },
        orderBy: { programid: "asc" },
      },
      kpiIndicatorResponse: {
        where: { year, kpiIndicatorAnswer: { some: {} } },
        // รายภาคการศึกษา: ใช้ภาคล่าสุดที่มีข้อมูล
        orderBy: { semester: "desc" },
        select: {
          programid: true,
          kpiIndicatorAnswer: {
            select: { dividend: true, divisor: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { id: "asc" },
  });

  // ตัวชี้วัดที่ผูกหลักสูตรแสดงแยก 1 แถวต่อหลักสูตร, ไม่ผูก = programid 1
  return indicators.flatMap((x) => {
    const programs = x.kpiIndicatorPrograms.length
      ? x.kpiIndicatorPrograms.map((p) => p.program)
      : [{ id: 1, name: "" }];
    return programs.map((program) => {
      const ans = x.kpiIndicatorResponse.find((r) => r.programid === program.id)
        ?.kpiIndicatorAnswer[0];
      return {
        id: x.id,
        key: `${x.id}:${program.id}`,
        programid: program.id,
        name: program.name ? `${x.name} (${program.name})` : x.name,
        // ชื่อตัวชี้วัด/หลักสูตรแยกกัน สำหรับการ์ดกราฟที่รวมหลายหลักสูตร
        indicatorName: x.name,
        programName: program.name,
        period: x.period,
        condition: x.condition,
        target: Number(x.target),
        unit: x.unit,
        dividend: x.dividend,
        divisor: x.divisor,
        isAnswered: !!ans,
        answer: ans
          ? {
              dividend: Number(ans.dividend),
              divisor: ans.divisor !== null ? Number(ans.divisor) : null,
            }
          : null,
      };
    });
  });
};

export const fetchDashboardResearchByMain = async (
  mainid: number,
  year: number,
  staffId?: number | null,
) => {
  let accessWhere: object = { isActive: true, mainid };

  if (staffId) {
    const [staff, researchUser] = await Promise.all([
      prisma.staff.findFirst({
        where: { isActive: true, staffid: staffId },
      }),
      prisma.kpi_research_user.findMany({
        where: { isActive: true, staff_id: staffId },
        select: { indicatorid: true },
      }),
    ]);

    if (!staff) {
      accessWhere = {
        isActive: true,
        mainid,
        id: { in: researchUser.map((x) => x.indicatorid) },
      };
    }
  }

  const [indicators, responses] = await Promise.all([
    prisma.kpi_research.findMany({
      where: accessWhere,
      select: {
        id: true,
        name: true,
        period: true,
        condition: true,
        target: true,
        unit: true,
        dividend: true,
        divisor: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.kpi_research_response.findMany({
      where: { year },
      select: { id: true, indicatorid: true },
    }),
  ]);

  const respByIndicator = new Map(responses.map((r) => [r.indicatorid, r.id]));
  const responseIds = responses.map((r) => r.id);

  const answers = responseIds.length
    ? await prisma.kpi_research_answer.findMany({
        where: { responseid: { in: responseIds } },
        select: { responseid: true, dividend: true, divisor: true },
      })
    : [];

  const answerByResponse = new Map(answers.map((a) => [a.responseid, a]));

  return indicators.map((x) => {
    const respId = respByIndicator.get(x.id);
    const ans = respId ? answerByResponse.get(respId) : undefined;
    return {
      id: x.id,
      key: String(x.id),
      programid: 0,
      name: x.name,
      indicatorName: x.name,
      programName: "",
      period: x.period,
      condition: x.condition,
      target: Number(x.target),
      unit: x.unit,
      dividend: x.dividend,
      divisor: x.divisor ?? "",
      isAnswered: !!ans,
      answer: ans
        ? {
            dividend: Number(ans.dividend),
            divisor: ans.divisor !== null ? Number(ans.divisor) : null,
          }
        : null,
    };
  });
};

export const fetchDashboardAdminByMain = async (
  mainid: number,
  year: number,
  staffId?: number | null,
) => {
  let accessWhere: object = { isActive: true, mainid };

  if (staffId) {
    const [staff, adminUser] = await Promise.all([
      prisma.staff.findFirst({
        where: { isActive: true, staffid: staffId },
      }),
      prisma.kpi_admin_user.findMany({
        where: { isActive: true, staff_id: staffId },
        select: { indicatorid: true },
      }),
    ]);

    if (!staff) {
      accessWhere = {
        isActive: true,
        mainid,
        id: { in: adminUser.map((x) => x.indicatorid) },
      };
    }
  }

  const [indicators, responses] = await Promise.all([
    prisma.kpi_admin.findMany({
      where: accessWhere,
      select: {
        id: true,
        name: true,
        period: true,
        condition: true,
        target: true,
        unit: true,
        dividend: true,
        divisor: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.kpi_admin_response.findMany({
      where: { year },
      select: { id: true, indicatorid: true },
    }),
  ]);

  const respByIndicator = new Map(responses.map((r) => [r.indicatorid, r.id]));
  const responseIds = responses.map((r) => r.id);

  const answers = responseIds.length
    ? await prisma.kpi_admin_answer.findMany({
        where: { responseid: { in: responseIds } },
        select: { responseid: true, dividend: true, divisor: true },
      })
    : [];

  const answerByResponse = new Map(answers.map((a) => [a.responseid, a]));

  return indicators.map((x) => {
    const respId = respByIndicator.get(x.id);
    const ans = respId ? answerByResponse.get(respId) : undefined;
    return {
      id: x.id,
      key: String(x.id),
      programid: 0,
      name: x.name,
      indicatorName: x.name,
      programName: "",
      period: x.period,
      condition: x.condition,
      target: Number(x.target),
      unit: x.unit,
      dividend: x.dividend,
      divisor: x.divisor ?? "",
      isAnswered: !!ans,
      answer: ans
        ? {
            dividend: Number(ans.dividend),
            divisor: ans.divisor !== null ? Number(ans.divisor) : null,
          }
        : null,
    };
  });
};

export const fetchActiveFiscalYears = async () => {
  await checkSession();
  return prisma.fiscal_year.findMany({
    where: { isActive: true },
    select: { id: true, year: true },
    orderBy: { year: "desc" },
  });
};

const activeProgramsSelect = {
  where: { isActive: true, program: { isActive: true } },
  select: { programid: true },
} as const;

/** นับแถวตามหลักสูตร: ไม่ผูกหลักสูตร = 1 แถว (programid 1), ผูก = 1 แถวต่อหลักสูตร */
function countProgramRows(ind: {
  kpiIndicatorPrograms: { programid: number }[];
  kpiIndicatorResponse: { programid: number }[];
}) {
  const programs = ind.kpiIndicatorPrograms.length
    ? ind.kpiIndicatorPrograms.map((p) => p.programid)
    : [1];
  const answered = programs.filter((id) =>
    ind.kpiIndicatorResponse.some((r) => r.programid === id),
  ).length;
  return { total: programs.length, answered };
}

export const fetchDashboardIndicator = async (year: number) => {
  const indicators = await prisma.kpi_indicator.findMany({
    where: { isActive: true },
    select: {
      id: true,
      mainid: true,
      kpiMain: { select: { name: true } },
      kpiIndicatorPrograms: activeProgramsSelect,
      kpiIndicatorResponse: {
        where: { year, kpiIndicatorAnswer: { some: {} } },
        select: { programid: true },
      },
    },
  });

  const mainMap = new Map<
    number,
    { mainid: number; name: string; total: number; answered: number }
  >();

  for (const ind of indicators) {
    if (!mainMap.has(ind.mainid)) {
      mainMap.set(ind.mainid, {
        mainid: ind.mainid,
        name: ind.kpiMain?.name ?? "-",
        total: 0,
        answered: 0,
      });
    }
    const entry = mainMap.get(ind.mainid)!;
    const rows = countProgramRows(ind);
    entry.total += rows.total;
    entry.answered += rows.answered;
  }

  return Array.from(mainMap.values()).map((x) => ({
    ...x,
    unanswered: x.total - x.answered,
  }));
};

export const fetchDashboardResearch = async (year: number) => {
  const [indicators, responses] = await Promise.all([
    prisma.kpi_research.findMany({
      where: { isActive: true },
      select: {
        id: true,
        mainid: true,
        research_main: { select: { name: true } },
      },
    }),
    prisma.kpi_research_response.findMany({
      where: { year },
      select: { indicatorid: true },
    }),
  ]);

  const answeredIds = new Set(responses.map((r) => r.indicatorid));

  const mainMap = new Map<
    number,
    { mainid: number; name: string; total: number; answered: number }
  >();

  for (const ind of indicators) {
    if (!mainMap.has(ind.mainid)) {
      mainMap.set(ind.mainid, {
        mainid: ind.mainid,
        name: ind.research_main?.name ?? "-",
        total: 0,
        answered: 0,
      });
    }
    const entry = mainMap.get(ind.mainid)!;
    entry.total++;
    if (answeredIds.has(ind.id)) entry.answered++;
  }

  return Array.from(mainMap.values()).map((x) => ({
    ...x,
    unanswered: x.total - x.answered,
  }));
};

export const fetchDashboardAdmin = async (year: number) => {
  const [indicators, responses] = await Promise.all([
    prisma.kpi_admin.findMany({
      where: { isActive: true },
      select: {
        id: true,
        mainid: true,
        admin_main: { select: { name: true } },
      },
    }),
    prisma.kpi_admin_response.findMany({
      where: { year },
      select: { indicatorid: true },
    }),
  ]);

  const answeredIds = new Set(responses.map((r) => r.indicatorid));

  const mainMap = new Map<
    number,
    { mainid: number; name: string; total: number; answered: number }
  >();

  for (const ind of indicators) {
    if (!mainMap.has(ind.mainid)) {
      mainMap.set(ind.mainid, {
        mainid: ind.mainid,
        name: ind.admin_main?.name ?? "-",
        total: 0,
        answered: 0,
      });
    }
    const entry = mainMap.get(ind.mainid)!;
    entry.total++;
    if (answeredIds.has(ind.id)) entry.answered++;
  }

  return Array.from(mainMap.values()).map((x) => ({
    ...x,
    unanswered: x.total - x.answered,
  }));
};

export const fetchActiveAcademicYears = async () => {
  await checkSession();
  return prisma.academic_year.findMany({
    select: { id: true, year: true, semester: true },
    where: { isActive: true },
    orderBy: [{ year: "desc" }, { semester: "asc" }],
  });
};

export const fetchResearchMainsWithCount = async () => {
  const user = await checkSession();

  const [fullAccess, researchUser, activeFiscalYears, allMains] =
    await Promise.all([
      hasFullKpiAccess(Number(user.id), user.role),
      prisma.kpi_research_user.findMany({
        where: { isActive: true, staff_id: Number(user.id) },
        select: { indicatorid: true },
      }),
      prisma.fiscal_year.findMany({
        where: { isActive: true },
        select: { year: true },
      }),
      prisma.research_main.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { id: "asc" },
      }),
    ]);

  const accessWhere = fullAccess
    ? { isActive: true }
    : { isActive: true, id: { in: researchUser.map((x) => x.indicatorid) } };

  const [indicators, responses] = await Promise.all([
    prisma.kpi_research.findMany({
      where: accessWhere,
      select: { id: true, mainid: true },
    }),
    prisma.kpi_research_response.findMany({
      where: { year: { in: activeFiscalYears.map((fy) => fy.year) } },
      select: { indicatorid: true, year: true },
    }),
  ]);

  const answeredSet = new Set(
    responses.map((r) => `${r.indicatorid}:${r.year}`),
  );

  const unansweredPerMain = new Map<number, number>();
  for (const ind of indicators) {
    for (const fy of activeFiscalYears) {
      if (!answeredSet.has(`${ind.id}:${fy.year}`)) {
        unansweredPerMain.set(
          ind.mainid,
          (unansweredPerMain.get(ind.mainid) ?? 0) + 1,
        );
      }
    }
  }

  return allMains.map((m) => ({
    id: m.id,
    name: m.name,
    unansweredCount: unansweredPerMain.get(m.id) ?? 0,
  }));
};

export const fetchAdminMainsWithCount = async () => {
  const user = await checkSession();

  const [fullAccess, adminUser, activeFiscalYears, allMains] =
    await Promise.all([
      hasFullKpiAccess(Number(user.id), user.role),
      prisma.kpi_admin_user.findMany({
        where: { isActive: true, staff_id: Number(user.id) },
        select: { indicatorid: true },
      }),
      prisma.fiscal_year.findMany({
        where: { isActive: true },
        select: { year: true },
      }),
      prisma.admin_main.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { id: "asc" },
      }),
    ]);

  const accessWhere = fullAccess
    ? { isActive: true }
    : { isActive: true, id: { in: adminUser.map((x) => x.indicatorid) } };

  const [indicators, responses] = await Promise.all([
    prisma.kpi_admin.findMany({
      where: accessWhere,
      select: { id: true, mainid: true },
    }),
    prisma.kpi_admin_response.findMany({
      where: { year: { in: activeFiscalYears.map((fy) => fy.year) } },
      select: { indicatorid: true, year: true },
    }),
  ]);

  const answeredSet = new Set(
    responses.map((r) => `${r.indicatorid}:${r.year}`),
  );

  const unansweredPerMain = new Map<number, number>();
  for (const ind of indicators) {
    for (const fy of activeFiscalYears) {
      if (!answeredSet.has(`${ind.id}:${fy.year}`)) {
        unansweredPerMain.set(
          ind.mainid,
          (unansweredPerMain.get(ind.mainid) ?? 0) + 1,
        );
      }
    }
  }

  return allMains.map((m) => ({
    id: m.id,
    name: m.name,
    unansweredCount: unansweredPerMain.get(m.id) ?? 0,
  }));
};

export const fetchDashboardIndicatorDetail = async (
  id: number,
  year: number,
  programid = 1,
) => {
  const [indicator, response] = await Promise.all([
    prisma.kpi_indicator.findFirst({
      where: { id, isActive: true },
      select: {
        name: true,
        resource: true,
        period: true,
        condition: true,
        target: true,
        unit: true,
        dividend: true,
        divisor: true,
        kpiMain: { select: { name: true } },
        kpiSub: { select: { name: true } },
        kpiIndicatorGuide: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
        kpiIndicatorRefs: {
          where: { isActive: true },
          select: { id: true, name: true, url: true },
        },
        kpiIndicatorUser: {
          // ดูหลักสูตรเดียว: ผู้รับผิดชอบหลักสูตรนั้น + ผู้รับผิดชอบทุกหลักสูตร (programid 1)
          where: {
            isActive: true,
            ...(programid !== 1 ? { programid: { in: [1, programid] } } : {}),
          },
          select: {
            staff: { select: { id: true, first_name: true, last_name: true } },
          },
        },
      },
    }),
    prisma.kpi_indicator_response.findFirst({
      where: {
        indicatorid: id,
        year,
        programid,
        kpiIndicatorAnswer: { some: {} },
      },
      // รายภาคการศึกษา: ใช้ภาคล่าสุดที่มีข้อมูล
      orderBy: { semester: "desc" },
      select: { id: true },
    }),
  ]);

  if (!indicator) return null;

  let answer: { dividend: number; divisor: number | null } | null = null;
  if (response) {
    const ans = await prisma.kpi_indicator_answer.findFirst({
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

  // คนเดียวอาจผูกทั้ง "ทุกหลักสูตร" และหลักสูตรที่ดูอยู่
  const kpiIndicatorUser = indicator.kpiIndicatorUser.filter(
    (u, i, all) => all.findIndex((x) => x.staff?.id === u.staff?.id) === i,
  );

  return {
    ...indicator,
    kpiIndicatorUser,
    target: Number(indicator.target),
    answer,
  };
};

export const fetchDashboardResearchDetail = async (
  id: number,
  year: number,
) => {
  const [indicator, response] = await Promise.all([
    prisma.kpi_research.findFirst({
      where: { id, isActive: true },
      select: {
        name: true,
        resource: true,
        period: true,
        condition: true,
        target: true,
        unit: true,
        dividend: true,
        divisor: true,
        research_main: { select: { name: true } },
        kpiResearchGuides: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
        kpiResearchRefs: {
          where: { isActive: true },
          select: { id: true, name: true, url: true },
        },
        kpiResearchUsers: {
          where: { isActive: true },
          select: {
            staff: { select: { id: true, first_name: true, last_name: true } },
          },
        },
      },
    }),
    prisma.kpi_research_response.findFirst({
      where: { indicatorid: id, year },
      select: { id: true },
    }),
  ]);

  if (!indicator) return null;

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

  return {
    ...indicator,
    target: Number(indicator.target),
    divisor: indicator.divisor ?? "",
    answer,
  };
};

export const fetchDashboardAdminDetail = async (id: number, year: number) => {
  const [indicator, response] = await Promise.all([
    prisma.kpi_admin.findFirst({
      where: { id, isActive: true },
      select: {
        name: true,
        resource: true,
        period: true,
        condition: true,
        target: true,
        unit: true,
        dividend: true,
        divisor: true,
        admin_main: { select: { name: true } },
        kpiAdminGuides: {
          where: { isActive: true },
          select: { id: true, name: true },
        },
        kpiAdminRefs: {
          where: { isActive: true },
          select: { id: true, name: true, url: true },
        },
        kpiAdminUsers: {
          where: { isActive: true },
          select: {
            staff: { select: { id: true, first_name: true, last_name: true } },
          },
        },
      },
    }),
    prisma.kpi_admin_response.findFirst({
      where: { indicatorid: id, year },
      select: { id: true },
    }),
  ]);

  if (!indicator) return null;

  let answer: { dividend: number; divisor: number | null } | null = null;
  if (response) {
    const ans = await prisma.kpi_admin_answer.findFirst({
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

  return {
    ...indicator,
    target: Number(indicator.target),
    divisor: indicator.divisor ?? "",
    answer,
  };
};

export type IndicatorHistoryPoint = {
  label: string;
  year: number;
  semester?: number;
  /** Computed KPI result: (dividend/divisor)*100 for academic, dividend/divisor for research */
  value: number | null;
  dividend: number | null;
  divisor: number | null;
  target: number;
};

function computeAcademicValue(
  dividend: number | null,
  divisor: number | null,
): number | null {
  if (dividend === null || divisor === null || divisor === 0) return null;
  return Math.round((dividend / divisor) * 10000) / 100; // 2 decimal places
}

function computeResearchValue(
  dividend: number | null,
  divisor: number | null,
  hasDivisor: boolean,
): number | null {
  if (dividend === null) return null;
  if (!hasDivisor) return dividend;
  if (divisor === null || divisor === 0) return null;
  return Math.round((dividend / divisor) * 100) / 100;
}

export const fetchIndicatorHistory = async (
  indicatorid: number,
  programid = 1,
) => {
  const [indicator, academicYears, fiscalYears, responses] = await Promise.all([
    prisma.kpi_indicator.findFirst({
      where: { id: indicatorid },
      select: { target: true, period: true, unit: true },
    }),
    prisma.academic_year.findMany({
      orderBy: [{ year: "asc" }, { semester: "asc" }],
      select: { year: true, semester: true },
    }),
    prisma.fiscal_year.findMany({
      orderBy: { year: "asc" },
      select: { year: true },
    }),
    prisma.kpi_indicator_response.findMany({
      where: { indicatorid, programid },
      select: {
        id: true,
        year: true,
        semester: true,
        period: true,
        kpiIndicatorAnswer: {
          select: { dividend: true, divisor: true },
          take: 1,
        },
      },
    }),
  ]);

  const target = indicator?.target !== undefined ? Number(indicator.target) : 0;
  const unit = indicator?.unit ?? "";
  const period = indicator?.period ?? "ANNUAL";

  // Build a map from "year-semester" → response ที่มี answer จริง
  // อาจมี response ซ้ำหลายแถวในช่วงเวลาเดียวกัน (ไม่มี unique constraint กันไว้)
  // ถ้าใช้แถวสุดท้ายที่เจอเฉยๆ อาจได้แถวที่ไม่มี answer ผูกอยู่ ทำให้กราฟไม่ขึ้น
  // ข้อมูลทั้งที่บันทึกสำเร็จแล้วในอีกแถวหนึ่ง
  const responseMap = new Map<string, (typeof responses)[number]>();
  for (const r of responses) {
    const key = `${r.year}-${r.semester}`;
    const existing = responseMap.get(key);
    if (
      !existing ||
      (existing.kpiIndicatorAnswer.length === 0 &&
        r.kpiIndicatorAnswer.length > 0)
    ) {
      responseMap.set(key, r);
    }
  }

  // Build timeline from the appropriate year table
  const timeline =
    period === "SEMESTER"
      ? academicYears.map((ay) => ({
          year: ay.year,
          semester: ay.semester,
          label: `${ay.year} ภาค ${ay.semester}`,
        }))
      : fiscalYears.map((fy) => ({
          year: fy.year,
          semester: 0,
          label: String(fy.year),
        }));

  const history: IndicatorHistoryPoint[] = timeline.map((t) => {
    const resp = responseMap.get(`${t.year}-${t.semester}`);
    const ans = resp?.kpiIndicatorAnswer[0];
    const dividend = ans ? Number(ans.dividend) : null;
    const divisor = ans ? Number(ans.divisor) : null;
    return {
      label: t.label,
      year: t.year,
      semester: t.semester,
      dividend,
      divisor,
      value: computeAcademicValue(dividend, divisor),
      target,
    };
  });

  return { history, target, unit, period };
};

export const fetchResearchHistory = async (indicatorid: number) => {
  const [indicator, fiscalYears, responses] = await Promise.all([
    prisma.kpi_research.findFirst({
      where: { id: indicatorid },
      select: { target: true, unit: true, divisor: true },
    }),
    prisma.fiscal_year.findMany({
      orderBy: { year: "asc" },
      select: { year: true },
    }),
    prisma.kpi_research_response.findMany({
      where: { indicatorid },
      select: { id: true, year: true },
    }),
  ]);

  const target = indicator?.target !== undefined ? Number(indicator.target) : 0;
  const unit = indicator?.unit ?? "";
  const hasDivisor = !!indicator?.divisor;

  const answers = responses.length
    ? await prisma.kpi_research_answer.findMany({
        where: { responseid: { in: responses.map((r) => r.id) } },
        select: { responseid: true, dividend: true, divisor: true },
      })
    : [];

  // อาจมี response ซ้ำหลายแถวในปีเดียวกัน (ไม่มี unique constraint กันไว้)
  // จึงต้อง map จาก responseid -> year แล้วให้ answer เป็นตัวตัดสินว่าปีไหนมีค่า
  // ไม่ใช้ response ตัวสุดท้ายที่เจอเป็นตัวตัดสิน เพราะอาจเป็นแถวที่ไม่มี answer
  // ผูกอยู่ (เจอกรณีจริง: บันทึกสำเร็จแต่กราฟไม่ขึ้นข้อมูล)
  const responseYearById = new Map(responses.map((r) => [r.id, r.year]));
  const answerByYear = new Map<number, (typeof answers)[number]>();
  for (const ans of answers) {
    const year = responseYearById.get(ans.responseid);
    if (year !== undefined) answerByYear.set(year, ans);
  }

  const history: IndicatorHistoryPoint[] = fiscalYears.map((fy) => {
    const ans = answerByYear.get(fy.year);
    const dividend = ans ? Number(ans.dividend) : null;
    const divisor = ans
      ? ans.divisor !== null
        ? Number(ans.divisor)
        : null
      : null;
    return {
      label: String(fy.year),
      year: fy.year,
      dividend,
      divisor,
      value: computeResearchValue(dividend, divisor, hasDivisor),
      target,
    };
  });

  return { history, target, unit, period: "ANNUAL" as const, hasDivisor };
};

const computeAdminValue = computeResearchValue;

export const fetchAdminHistory = async (indicatorid: number) => {
  const [indicator, fiscalYears, responses] = await Promise.all([
    prisma.kpi_admin.findFirst({
      where: { id: indicatorid },
      select: { target: true, unit: true, divisor: true },
    }),
    prisma.fiscal_year.findMany({
      orderBy: { year: "asc" },
      select: { year: true },
    }),
    prisma.kpi_admin_response.findMany({
      where: { indicatorid },
      select: { id: true, year: true },
    }),
  ]);

  const target = indicator?.target !== undefined ? Number(indicator.target) : 0;
  const unit = indicator?.unit ?? "";
  const hasDivisor = !!indicator?.divisor;

  const answers = responses.length
    ? await prisma.kpi_admin_answer.findMany({
        where: { responseid: { in: responses.map((r) => r.id) } },
        select: { responseid: true, dividend: true, divisor: true },
      })
    : [];

  // อาจมี response ซ้ำหลายแถวในปีเดียวกัน (ไม่มี unique constraint กันไว้)
  // จึงต้อง map จาก responseid -> year แล้วให้ answer เป็นตัวตัดสินว่าปีไหนมีค่า
  // ไม่ใช้ response ตัวสุดท้ายที่เจอเป็นตัวตัดสิน เพราะอาจเป็นแถวที่ไม่มี answer
  // ผูกอยู่ (เจอกรณีจริง: บันทึกสำเร็จแต่กราฟไม่ขึ้นข้อมูล)
  const responseYearById = new Map(responses.map((r) => [r.id, r.year]));
  const answerByYear = new Map<number, (typeof answers)[number]>();
  for (const ans of answers) {
    const year = responseYearById.get(ans.responseid);
    if (year !== undefined) answerByYear.set(year, ans);
  }

  const history: IndicatorHistoryPoint[] = fiscalYears.map((fy) => {
    const ans = answerByYear.get(fy.year);
    const dividend = ans ? Number(ans.dividend) : null;
    const divisor = ans
      ? ans.divisor !== null
        ? Number(ans.divisor)
        : null
      : null;
    return {
      label: String(fy.year),
      year: fy.year,
      dividend,
      divisor,
      value: computeAdminValue(dividend, divisor, hasDivisor),
      target,
    };
  });

  return { history, target, unit, period: "ANNUAL" as const, hasDivisor };
};

export const fetchDashboardSummaries = async (year: number, domain: string) => {
  await checkSession();
  return domain === "research"
    ? fetchDashboardResearch(year)
    : domain === "admin"
      ? fetchDashboardAdmin(year)
      : fetchDashboardIndicator(year);
};

export const fetchDashboardCategory = async (
  year: number,
  domain: string,
  mainid: number,
) => {
  await checkSession();
  const historyMap: Record<
    string,
    { history: IndicatorHistoryPoint[]; unit: string }
  > = {};

  if (domain === "academic") {
    const items = await fetchDashboardIndicatorByMain(mainid, year);
    const indicatorIds = items.map((item) => item.id);
    const [academicYears, fiscalYears, responses] = await Promise.all([
      prisma.academic_year.findMany({
        orderBy: [{ year: "asc" }, { semester: "asc" }],
        select: { year: true, semester: true },
      }),
      prisma.fiscal_year.findMany({
        orderBy: { year: "asc" },
        select: { year: true },
      }),
      prisma.kpi_indicator_response.findMany({
        where: { indicatorid: { in: indicatorIds } },
        select: {
          indicatorid: true,
          programid: true,
          year: true,
          semester: true,
          kpiIndicatorAnswer: {
            select: { dividend: true, divisor: true },
            take: 1,
          },
        },
      }),
    ]);
    const responseMap = new Map(
      responses.map((response) => [
        `${response.indicatorid}:${response.programid}:${response.year}:${response.semester}`,
        response,
      ]),
    );

    items.forEach((item) => {
      const timeline =
        item.period === "SEMESTER"
          ? academicYears.map((academicYear) => ({
              year: academicYear.year,
              semester: academicYear.semester,
              label: `${academicYear.year} ภาค ${academicYear.semester}`,
            }))
          : fiscalYears.map((fiscalYear) => ({
              year: fiscalYear.year,
              semester: 0,
              label: String(fiscalYear.year),
            }));
      historyMap[item.key] = {
        unit: item.unit,
        history: timeline.map((point) => {
          const response = responseMap.get(
            `${item.key}:${point.year}:${point.semester}`,
          );
          const answer = response?.kpiIndicatorAnswer[0];
          const dividend = answer ? Number(answer.dividend) : null;
          const divisor = answer ? Number(answer.divisor) : null;
          return {
            ...point,
            dividend,
            divisor,
            value: computeAcademicValue(dividend, divisor),
            target: item.target,
          };
        }),
      };
    });
    return { mainid, items, historyMap };
  }

  if (domain === "research") {
    const items = await fetchDashboardResearchByMain(mainid, year);
    const indicatorIds = items.map((item) => item.id);
    const [fiscalYears, responses, answers] = await Promise.all([
      prisma.fiscal_year.findMany({
        orderBy: { year: "asc" },
        select: { year: true },
      }),
      prisma.kpi_research_response.findMany({
        where: { indicatorid: { in: indicatorIds } },
        select: { id: true, indicatorid: true, year: true },
      }),
      prisma.kpi_research_answer.findMany({
        where: { indicatorid: { in: indicatorIds } },
        select: { responseid: true, dividend: true, divisor: true },
      }),
    ]);
    const responseMap = new Map(
      responses.map((response) => [
        `${response.indicatorid}:${response.year}`,
        response,
      ]),
    );
    const answerMap = new Map(
      answers.map((answer) => [answer.responseid, answer]),
    );

    items.forEach((item) => {
      const hasDivisor = Boolean(item.divisor);
      historyMap[item.key] = {
        unit: item.unit,
        history: fiscalYears.map((fiscalYear) => {
          const response = responseMap.get(`${item.id}:${fiscalYear.year}`);
          const answer = response ? answerMap.get(response.id) : undefined;
          const dividend = answer ? Number(answer.dividend) : null;
          const divisor =
            answer?.divisor !== null && answer?.divisor !== undefined
              ? Number(answer.divisor)
              : null;
          return {
            label: String(fiscalYear.year),
            year: fiscalYear.year,
            dividend,
            divisor,
            value: computeResearchValue(dividend, divisor, hasDivisor),
            target: item.target,
          };
        }),
      };
    });
    return { mainid, items, historyMap };
  }

  const items = await fetchDashboardAdminByMain(mainid, year);
  const indicatorIds = items.map((item) => item.id);
  const [fiscalYears, responses, answers] = await Promise.all([
    prisma.fiscal_year.findMany({
      orderBy: { year: "asc" },
      select: { year: true },
    }),
    prisma.kpi_admin_response.findMany({
      where: { indicatorid: { in: indicatorIds } },
      select: { id: true, indicatorid: true, year: true },
    }),
    prisma.kpi_admin_answer.findMany({
      where: { indicatorid: { in: indicatorIds } },
      select: { responseid: true, dividend: true, divisor: true },
    }),
  ]);
  const responseMap = new Map(
    responses.map((response) => [
      `${response.indicatorid}:${response.year}`,
      response,
    ]),
  );
  const answerMap = new Map(
    answers.map((answer) => [answer.responseid, answer]),
  );

  items.forEach((item) => {
    const hasDivisor = Boolean(item.divisor);
    historyMap[item.key] = {
      unit: item.unit,
      history: fiscalYears.map((fiscalYear) => {
        const response = responseMap.get(`${item.id}:${fiscalYear.year}`);
        const answer = response ? answerMap.get(response.id) : undefined;
        const dividend = answer ? Number(answer.dividend) : null;
        const divisor =
          answer?.divisor !== null && answer?.divisor !== undefined
            ? Number(answer.divisor)
            : null;
        return {
          label: String(fiscalYear.year),
          year: fiscalYear.year,
          dividend,
          divisor,
          value: computeAdminValue(dividend, divisor, hasDivisor),
          target: item.target,
        };
      }),
    };
  });
  return { mainid, items, historyMap };
};

export const countUnansweredIndicators = async (year?: number) => {
  const user = await checkSession();
  const access = await fetchUserIndicatorPrograms(Number(user.id), user.role);

  const indicators = await prisma.kpi_indicator.findMany({
    where: {
      isActive: true,
      ...(access ? { id: { in: [...access.keys()] } } : {}),
    },
    select: {
      id: true,
      kpiIndicatorPrograms: activeProgramsSelect,
      kpiIndicatorResponse: {
        where: {
          ...(year !== undefined ? { year } : {}),
          kpiIndicatorAnswer: { some: {} },
        },
        select: { programid: true },
      },
    },
  });

  // นับเฉพาะหลักสูตรที่ผู้ใช้รับผิดชอบ (ผู้ดูแลระบบ = ทุกหลักสูตร)
  return indicators.reduce((sum, ind) => {
    const programs = reportablePrograms(
      ind.kpiIndicatorPrograms.map((p) => p.programid),
      access ? (access.get(ind.id) ?? []) : null,
    );
    return (
      sum +
      programs.filter(
        (id) => !ind.kpiIndicatorResponse.some((r) => r.programid === id),
      ).length
    );
  }, 0);
};
