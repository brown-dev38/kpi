import prisma from "@/lib/prisma/prisma";

/**
 * Full KPI access = administrator role, or a row in `staff` (คณะกรรมการ/เจ้าหน้าที่).
 * Anyone else only sees the indicators they are assigned to.
 */
export const hasFullKpiAccess = async (
  userId: number,
  role?: string | null,
) => {
  if (role === "administrator") return true;

  const staff = await prisma.staff.findFirst({
    where: { isActive: true, staffid: userId },
    select: { id: true },
  });

  return Boolean(staff);
};

/**
 * Programs each indicator is assigned to this user for (kpi_indicator_user).
 * null = full access (every indicator, every program).
 */
export const fetchUserIndicatorPrograms = async (
  userId: number,
  role?: string | null,
) => {
  if (await hasFullKpiAccess(userId, role)) return null;

  const rows = await prisma.kpi_indicator_user.findMany({
    where: { isActive: true, staffid: userId },
    select: { indicatorid: true, programid: true },
  });

  const map = new Map<number, number[]>();
  for (const row of rows) {
    map.set(row.indicatorid, [
      ...(map.get(row.indicatorid) ?? []),
      row.programid,
    ]);
  }
  return map;
};

/**
 * Programs of one indicator the user may report.
 * - indicatorPrograms: active programs linked to the indicator ([] = not split)
 * - userPrograms: null = full access, otherwise the user's assigned programids
 * Returns [1] for a non-split indicator, [] when the user has no access.
 */
export const reportablePrograms = (
  indicatorPrograms: number[],
  userPrograms: number[] | null,
) => {
  const programs = indicatorPrograms.length ? indicatorPrograms : [1];
  if (userPrograms === null) return programs;
  if (userPrograms.length === 0) return [];
  // programid 1 = all programs; a non-split indicator is open to every assignee
  if (userPrograms.includes(1) || programs[0] === 1) return programs;
  return programs.filter((id) => userPrograms.includes(id));
};

/**
 * Research/admin KPI: full access, or an active assignee of the indicator
 * (kpi_research_user / kpi_admin_user).
 */
export const canAccessKpi = async (
  domain: "research" | "admin",
  indicatorid: number,
  userId: number,
  role?: string | null,
) => {
  if (await hasFullKpiAccess(userId, role)) return true;

  const where = { isActive: true, staff_id: userId, indicatorid };
  const count =
    domain === "research"
      ? await prisma.kpi_research_user.count({ where })
      : await prisma.kpi_admin_user.count({ where });
  return count > 0;
};
