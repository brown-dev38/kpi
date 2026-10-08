"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, LayoutGrid, Table2 } from "lucide-react";
import { IndicatorChart } from "@/app/kpi/dashboard/[mainid]/[indicatorid]/chart";
import type { IndicatorHistoryPoint } from "@/app/kpi/actions";
import {
  ComparisonChart,
  SERIES_COLORS,
  type ComparisonSeries,
} from "@/app/kpi/dashboard/_components/comparison-chart";
import { motion } from "framer-motion";

export type IndicatorItem = {
  id: number;
  /** ใช้แยกแถว/ประวัติ: `${id}:${programid}` (วิชาการ) หรือ `${id}` */
  key: string;
  programid: number;
  /** ชื่อที่แสดงในตาราง/รายการเทียบ: ต่อท้ายชื่อหลักสูตรเมื่อแยกหลักสูตร */
  name: string;
  /** ชื่อตัวชี้วัดล้วน (หัวการ์ดกราฟ) */
  indicatorName: string;
  /** ชื่อหลักสูตร; "" = ไม่แยกหลักสูตร */
  programName: string;
  period: "SEMESTER" | "ANNUAL";
  condition: string;
  target: number;
  unit: string;
  isAnswered: boolean;
  answer: { dividend: number; divisor: number | null } | null;
};

export type HistoryEntry = { history: IndicatorHistoryPoint[]; unit: string };
export type DashboardView = "table" | "graph";

/** คั่นหลักพันเสมอ ทศนิยมไม่เกิน 2 ตำแหน่ง */
function fmtNumber(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function fmtStat(v: number | null, isPercent: boolean): string {
  if (v === null) return "-";
  return isPercent ? `${fmtNumber(v)}%` : fmtNumber(v);
}

function computeStats(history: IndicatorHistoryPoint[]) {
  const valid = history.filter(
    (h): h is IndicatorHistoryPoint & { value: number } => h.value !== null,
  );
  if (valid.length === 0) return { latest: null, average: null };
  const latest = valid[valid.length - 1].value;
  const average = valid.reduce((s, h) => s + h.value, 0) / valid.length;
  return { latest, average };
}

/** จุดของปีที่ระบุ (รายภาคการศึกษาอาจมีหลายจุดต่อปี) */
function pointsOfYear(history: IndicatorHistoryPoint[], year: number) {
  return history.filter((point) => point.year === year);
}

function placeholderPoint(
  label: string,
  year: number,
  target: number,
): IndicatorHistoryPoint {
  return { label, year, value: null, dividend: null, divisor: null, target };
}

/** แถวของตัวชี้วัดเดียวกัน (แยกตามหลักสูตร) รวมเป็นกลุ่มเดียว เรียงตามลำดับเดิม */
function groupByIndicator(items: IndicatorItem[]) {
  const groups = new Map<number, IndicatorItem[]>();
  for (const item of items) {
    groups.set(item.id, [...(groups.get(item.id) ?? []), item]);
  }
  return [...groups.values()];
}

export function ViewToggle({
  view,
  onChange,
}: {
  view: DashboardView;
  onChange: (view: DashboardView) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border p-1 gap-1 shrink-0">
      <Button
        type="button"
        size="sm"
        variant={view === "table" ? "default" : "ghost"}
        className="gap-1.5"
        onClick={() => onChange("table")}
      >
        <Table2 className="size-4" />
        ตาราง
      </Button>
      <Button
        type="button"
        size="sm"
        variant={view === "graph" ? "default" : "ghost"}
        className="gap-1.5"
        onClick={() => onChange("graph")}
      >
        <LayoutGrid className="size-4" />
        กราฟ
      </Button>
    </div>
  );
}

/**
 * การ์ดกราฟของ 1 ตัวชี้วัด; rows = 1 แถวต่อหลักสูตร (ไม่แยกหลักสูตร = 1 แถว)
 * ติ๊กหลักสูตรเพื่อเลือกแสดง ไม่ติ๊กเลย = แสดงทุกหลักสูตร
 */
function IndicatorGraphCard({
  rows,
  items,
  historyMap,
  year,
  isPercent,
  detailUrlOf,
}: {
  rows: IndicatorItem[];
  items: IndicatorItem[];
  historyMap: Record<string, HistoryEntry>;
  year: number;
  isPercent: boolean;
  detailUrlOf: (item: IndicatorItem) => string;
}) {
  const checkboxId = useId();
  const [compareYears, setCompareYears] = useState<number[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [programKeys, setProgramKeys] = useState<string[]>([]);

  const toggleYear = (value: number) =>
    setCompareYears((prev) =>
      prev.includes(value)
        ? prev.filter((y) => y !== value)
        : [...prev, value].sort((a, b) => a - b),
    );

  const toggleId = (value: string) =>
    setCompareIds((prev) =>
      prev.includes(value)
        ? prev.filter((id) => id !== value)
        : [...prev, value],
    );

  const toggleProgram = (key: string) =>
    setProgramKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const visibleRows = useMemo(() => {
    const selected = rows.filter((row) => programKeys.includes(row.key));
    return selected.length > 0 ? selected : rows;
  }, [rows, programKeys]);
  const primary = visibleRows[0];
  const isMultiProgram = rows.length > 1;

  // ทุกหลักสูตรของตัวชี้วัดเดียวกันใช้ timeline (ปี/ภาค) เดียวกัน
  const history = historyMap[primary.key]?.history ?? [];

  // ปีอื่นที่มีใน timeline ของตัวชี้วัดนี้ (ใหม่ก่อน)
  const otherYears = useMemo(() => {
    const years = new Set<number>();
    history.forEach((point) => {
      if (point.year !== year) years.add(point.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [history, year]);

  // ตัวชี้วัดอื่นที่เลือกเทียบได้ (ไม่รวมหลักสูตรของตัวชี้วัดนี้เอง)
  const otherItems = useMemo(
    () => items.filter((other) => other.id !== primary.id),
    [items, primary.id],
  );

  const axisYears = useMemo(
    () => Array.from(new Set([...compareYears, year])).sort((a, b) => a - b),
    [compareYears, year],
  );

  // กราฟหลายชุด: แสดงหลายหลักสูตร และ/หรือ เทียบกับตัวชี้วัดอื่น
  // หลักสูตรของตัวชี้วัดนี้ใช้แกนซ้ายร่วมกัน (สเกลเดียวกัน) ตัวชี้วัดที่เทียบอยู่แกนขวา
  const compareData = useMemo(() => {
    if (compareIds.length === 0 && visibleRows.length < 2) return null;

    const slots: { year: number; semester: number; label: string }[] = [];
    axisYears.forEach((axisYear) => {
      const semesters = Array.from(
        new Set(pointsOfYear(history, axisYear).map((p) => p.semester ?? 0)),
      )
        .filter((semester) => semester !== 0)
        .sort((a, b) => a - b);

      if (semesters.length === 0) {
        slots.push({ year: axisYear, semester: 0, label: String(axisYear) });
      } else {
        semesters.forEach((semester) =>
          slots.push({
            year: axisYear,
            semester,
            label: `${axisYear} ภาค ${semester}`,
          }),
        );
      }
    });

    const seriesRows = [
      ...visibleRows.map((row) => ({
        row,
        name: row.programName || row.name,
        axis: "left" as const,
      })),
      ...compareIds
        .map((id) => otherItems.find((other) => other.key === id))
        .filter((other): other is IndicatorItem => Boolean(other))
        .map((row) => ({ row, name: row.name, axis: "right" as const })),
    ];

    const series: ComparisonSeries[] = seriesRows.map(
      ({ row, name, axis }, index) => {
        const entry = historyMap[row.key];
        const seriesHistory = entry?.history ?? [];
        const bySlot = new Map(
          seriesHistory.map((point) => [
            `${point.year}-${point.semester ?? 0}`,
            point,
          ]),
        );

        return {
          key: `s${row.key}`,
          name,
          color: SERIES_COLORS[index % SERIES_COLORS.length],
          target: seriesHistory[0]?.target ?? row.target,
          unit: entry?.unit ?? row.unit,
          axis,
          values: slots.map(
            (slot) =>
              bySlot.get(`${slot.year}-${slot.semester}`)?.value ?? null,
          ),
        };
      },
    );

    return { categories: slots.map((slot) => slot.label), series };
  }, [axisYears, compareIds, history, historyMap, otherItems, visibleRows]);

  // โหมดหลักสูตรเดียว: แท่งสีเดียวและใช้สีบอกว่าผ่านเป้าหรือไม่
  const { chartData, showTrend } = useMemo(() => {
    const target = history[0]?.target ?? primary.target;
    const points = axisYears.flatMap((axisYear) => {
      const yearPoints = pointsOfYear(history, axisYear);
      return yearPoints.length
        ? yearPoints
        : [placeholderPoint(String(axisYear), axisYear, target)];
    });

    // เทียบหลายปีคือช่วงเวลาต่อเนื่อง เส้นแนวโน้มจึงมีความหมาย ขอแค่มีตั้งแต่ 2 จุด
    return { chartData: points, showTrend: points.length > 1 };
  }, [axisYears, history, primary.target]);

  // ค่าล่าสุดคิดจากปีที่แสดง แต่ค่าเฉลี่ยคิดจากทุกปีที่มีข้อมูล (แยกตามหลักสูตร)
  const stats = rows.map((row) => {
    const rowHistory = historyMap[row.key]?.history ?? [];
    return {
      row,
      latest: computeStats(pointsOfYear(rowHistory, year)).latest,
      average: computeStats(rowHistory).average,
    };
  });

  const answeredCount = rows.filter((row) => row.isAnswered).length;

  return (
    <Card className="h-full gap-3 py-4 transition-colors hover:border-primary/50 hover:shadow-sm">
      <CardHeader className="gap-1 px-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={detailUrlOf(primary)}
            className="text-sm font-medium leading-snug line-clamp-2 hover:underline"
          >
            {primary.indicatorName}
          </Link>
          {answeredCount === rows.length ? (
            <Badge
              variant="outline"
              className="shrink-0 text-green-600 border-green-600"
            >
              บันทึกแล้ว
            </Badge>
          ) : answeredCount === 0 ? (
            <Badge variant="destructive" className="shrink-0">
              ยังไม่บันทึก
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="shrink-0 text-amber-600 border-amber-600"
            >
              บันทึกแล้ว {answeredCount}/{rows.length} หลักสูตร
            </Badge>
          )}
        </div>
        {isMultiProgram ? (
          <div className="flex flex-col gap-1.5 pt-1">
            {stats.map(({ row, latest, average }) => {
              const seriesIndex = visibleRows.indexOf(row);
              const id = `${checkboxId}-${row.key}`;
              return (
                <div
                  key={row.key}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm ${
                    seriesIndex === -1 ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex min-w-40 flex-1 items-center gap-1.5">
                    <Checkbox
                      id={id}
                      checked={programKeys.includes(row.key)}
                      onCheckedChange={() => toggleProgram(row.key)}
                    />
                    {compareData && seriesIndex !== -1 && (
                      <span
                        className="inline-block size-2 shrink-0 rounded-sm"
                        style={{
                          backgroundColor:
                            SERIES_COLORS[seriesIndex % SERIES_COLORS.length],
                        }}
                      />
                    )}
                    <Label
                      htmlFor={id}
                      className="text-xs font-normal leading-snug"
                    >
                      {row.programName}
                    </Label>
                  </div>
                  {/* ค่าสรุป + ลิงก์ ขึ้นบรรทัดใหม่พร้อมกันเมื่อพื้นที่ไม่พอ */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        ปี {year}
                      </span>
                      <span className="font-semibold tabular-nums">
                        {fmtStat(latest, isPercent)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        เฉลี่ยทุกปี
                      </span>
                      <span className="font-semibold tabular-nums">
                        {fmtStat(average, isPercent)}
                      </span>
                    </span>
                    <Link
                      href={detailUrlOf(row)}
                      aria-label={`รายละเอียด ${row.programName}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-4 pt-1 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">ปี {year}</span>
              <span className="font-semibold tabular-nums">
                {fmtStat(stats[0].latest, isPercent)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">เฉลี่ยทุกปี</span>
              <span className="font-semibold tabular-nums">
                {fmtStat(stats[0].average, isPercent)}
              </span>
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 flex-1 justify-between gap-1 text-xs font-normal"
                disabled={otherYears.length === 0}
              >
                <span className="truncate">
                  {compareYears.length === 0
                    ? "เทียบกับปี"
                    : `ปี ${compareYears.slice().sort((a, b) => b - a).join(", ")}`}
                </span>
                <ChevronDown className="size-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
              <DropdownMenuLabel>เลือกปีที่ต้องการเทียบ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={
                  otherYears.length > 0 &&
                  compareYears.length === otherYears.length
                }
                onCheckedChange={(checked) =>
                  setCompareYears(
                    checked ? [...otherYears].sort((a, b) => a - b) : [],
                  )
                }
                onSelect={(event) => event.preventDefault()}
                className="font-medium"
              >
                ทุกปี
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {otherYears.map((otherYear) => (
                <DropdownMenuCheckboxItem
                  key={otherYear}
                  checked={compareYears.includes(otherYear)}
                  onCheckedChange={() => toggleYear(otherYear)}
                  onSelect={(event) => event.preventDefault()}
                >
                  ปี {otherYear}
                </DropdownMenuCheckboxItem>
              ))}
              {compareYears.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setCompareYears([])}>
                    ล้างการเลือก
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 flex-1 justify-between gap-1 text-xs font-normal"
                disabled={otherItems.length === 0}
              >
                <span className="truncate">
                  {compareIds.length === 0
                    ? "เทียบกับตัวชี้วัด"
                    : `ตัวชี้วัด ${compareIds.length} รายการ`}
                </span>
                <ChevronDown className="size-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-72 max-w-[min(22rem,90vw)] overflow-y-auto"
            >
              <DropdownMenuLabel>เลือกตัวชี้วัดที่ต้องการเทียบ</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={
                  otherItems.length > 0 &&
                  compareIds.length === otherItems.length
                }
                onCheckedChange={(checked) =>
                  setCompareIds(checked ? otherItems.map((other) => other.key) : [])
                }
                onSelect={(event) => event.preventDefault()}
                className="font-medium"
              >
                ทุกตัวชี้วัดในหมวดนี้
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {otherItems.map((other) => (
                <DropdownMenuCheckboxItem
                  key={other.key}
                  checked={compareIds.includes(other.key)}
                  onCheckedChange={() => toggleId(other.key)}
                  onSelect={(event) => event.preventDefault()}
                  className="whitespace-normal"
                >
                  {other.name}
                </DropdownMenuCheckboxItem>
              ))}
              {compareIds.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setCompareIds([])}>
                    ล้างการเลือก
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="px-2">
        {compareData ? (
          <ComparisonChart
            categories={compareData.categories}
            series={compareData.series}
            isPercent={isPercent}
            compact
          />
        ) : chartData.length > 0 ? (
          <IndicatorChart
            data={chartData}
            unit={historyMap[primary.key]?.unit ?? primary.unit}
            isPercent={isPercent}
            showTrend={showTrend}
            compact
          />
        ) : (
          <p className="py-8 text-center text-xs text-muted-foreground">
            ไม่มีข้อมูล
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function IndicatorGroup({
  items,
  historyMap,
  view,
  year,
  mainid,
  domain,
  mainName,
}: {
  items: IndicatorItem[];
  historyMap: Record<string, HistoryEntry>;
  view: DashboardView;
  year: number;
  mainid: number | string;
  domain?: string;
  mainName: string;
}) {
  const isPercent = !domain || domain === "academic";
  const detailUrlOf = (item: IndicatorItem) =>
    `/kpi/dashboard/${mainid}/${item.id}?year=${year}&domain=${domain ?? ""}&mainName=${encodeURIComponent(mainName)}&name=${encodeURIComponent(item.name)}&program=${item.programid}`;

  return (
    <motion.div
      data-motion-item
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h3 className="text-base font-semibold leading-snug">{mainName}</h3>
        <p className="text-sm text-muted-foreground">
          ตัวชี้วัด {items.length} รายการ · ปีงบประมาณ {year}
        </p>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">ไม่มีตัวชี้วัด</p>
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ตัวชี้วัด</TableHead>
                <TableHead>รอบวัด</TableHead>
                <TableHead>เงื่อนไข</TableHead>
                <TableHead className="text-center">ตัวตั้ง</TableHead>
                <TableHead className="text-center">ตัวหาร</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const detailUrl = detailUrlOf(item);
                return (
                  <TableRow
                    key={item.key}
                    data-motion-item
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      <Link href={detailUrl} className="block w-full">
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={detailUrl} className="block w-full">
                        {item.period === "SEMESTER" ? "รายภาคการศึกษา" : "รายปี"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={detailUrl} className="block w-full">
                        {item.condition} {fmtNumber(item.target)} {item.unit}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={detailUrl} className="block w-full">
                        {item.answer ? fmtNumber(item.answer.dividend) : "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={detailUrl} className="block w-full">
                        {item.answer?.divisor !== null &&
                        item.answer?.divisor !== undefined
                          ? fmtNumber(item.answer.divisor)
                          : "-"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={detailUrl} className="flex justify-center">
                        {item.isAnswered ? (
                          <Badge
                            variant="outline"
                            className="text-green-600 border-green-600"
                          >
                            บันทึกแล้ว
                          </Badge>
                        ) : (
                          <Badge variant="destructive">ยังไม่บันทึก</Badge>
                        )}
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 1 การ์ดต่อตัวชี้วัด รวมทุกหลักสูตรไว้ในการ์ดเดียว */}
            {groupByIndicator(items).map((rows) => (
              <motion.div
                key={rows[0].id}
                data-motion-item
                layout="position"
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="h-full"
              >
                <IndicatorGraphCard
                  rows={rows}
                  items={items}
                  historyMap={historyMap}
                  year={year}
                  isPercent={isPercent}
                  detailUrlOf={detailUrlOf}
                />
              </motion.div>
            ))}
        </div>
      )}
    </section>
    </motion.div>
  );
}
