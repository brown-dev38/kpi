"use server";

import prisma from "@/lib/prisma/prisma";
import { checkAdministrator } from "@/lib/checksession";

export const fetchPaginationResearchIndicator = async (
  page: number,
  search: string
) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const count = await prisma.kpi_research.count({
    where: {
      OR: [
        { name: { contains: search } },
        { research_main: { name: { contains: search } } },
      ],
    },
  });
  const totalPages = Math.ceil(count / 10);
  const start = count === 0 ? 0 : offset + 1;
  const end = Math.min(page * 10, count);
  return { totalPages, start, end, total: count };
};

export const fetchDataResearchIndicator = async (
  page: number,
  search: string
) => {
  await checkAdministrator();
  const offset = (page - 1) * 10;
  const data = await prisma.kpi_research.findMany({
    select: {
      id: true,
      name: true,
      condition: true,
      target: true,
      unit: true,
      research_main: { select: { id: true, name: true } },
      isActive: true,
    },
    where: {
      OR: [
        { name: { contains: search } },
        { research_main: { name: { contains: search } } },
      ],
    },
    skip: offset,
    take: 10,
  });
  return data.map((item) => ({ ...item, target: Number(item.target) }));
};
