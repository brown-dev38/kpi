"use client";

import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Label,
  LabelList,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import type { IndicatorHistoryPoint } from "@/app/kpi/actions";

const COLOR_VALUE  = "#3b82f6"; // blue-500
const COLOR_TARGET = "#f59e0b"; // amber-500
const COLOR_MISS   = "#ef4444"; // red-500  — bar below target
const COLOR_TREND  = "#8b5cf6"; // violet-500
const COLOR_EMPTY  = "#e5e7eb"; // gray-200 — ช่วงที่ยังไม่มีข้อมูล

/** Linear regression trend values over the data points that have a non-null value */
function computeTrend(
  points: IndicatorHistoryPoint[]
): (number | null)[] {
  const valid = points
    .map((p, i) => (p.value !== null ? { i, v: p.value } : null))
    .filter(Boolean) as { i: number; v: number }[];

  if (valid.length < 2) return points.map(() => null);

  const n = valid.length;
  const sumX = valid.reduce((s, p) => s + p.i, 0);
  const sumY = valid.reduce((s, p) => s + p.v, 0);
  const sumXY = valid.reduce((s, p) => s + p.i * p.v, 0);
  const sumX2 = valid.reduce((s, p) => s + p.i * p.i, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return points.map(() => null);

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return points.map((_, i) => {
    const raw = slope * i + intercept;
    return Math.max(0, parseFloat(raw.toFixed(4)));
  });
}

function barColor(value: number | null, target: number): string {
  if (value === null) return COLOR_EMPTY;
  return value >= target ? COLOR_VALUE : COLOR_MISS;
}

function fmt(v: number | null): string {
  if (v === null) return "-";
  // คั่นหลักพันเสมอ ทศนิยมไม่เกิน 2 ตำแหน่ง
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function CustomTooltip({
  active,
  payload,
  label,
  isPercent,
}: TooltipContentProps<number, string> & { isPercent: boolean }) {
  if (!active || !payload?.length) return null;

  const valueEntry = payload.find((p) => p.dataKey === "value");
  const targetEntry = payload.find((p) => p.dataKey === "target");
  const trendEntry = payload.find((p) => p.dataKey === "trend");
  const point = valueEntry?.payload as IndicatorHistoryPoint | undefined;

  const met =
    valueEntry?.value !== null &&
    valueEntry?.value !== undefined &&
    targetEntry?.value !== null &&
    targetEntry?.value !== undefined &&
    (valueEntry.value as number) >= (targetEntry.value as number);

  return (
    <div className="rounded-lg border bg-background px-3 py-2.5 shadow-md text-sm min-w-[160px] space-y-1.5">
      <p className="font-semibold text-foreground">{label}</p>

      {/* Computed result */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">ผลลัพธ์</span>
        <span
          className="font-bold tabular-nums"
          style={{ color: met ? COLOR_VALUE : COLOR_MISS }}
        >
          {fmt(valueEntry?.value as number | null ?? null)}
          {isPercent ? " %" : ""}
        </span>
      </div>

      {/* Target */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">เป้าหมาย</span>
        <span className="font-medium tabular-nums" style={{ color: COLOR_TARGET }}>
          {fmt(targetEntry?.value as number | null ?? null)}
          {isPercent ? " %" : ""}
        </span>
      </div>

      {/* Trend */}
      {trendEntry?.value !== undefined && trendEntry.value !== null && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">แนวโน้ม</span>
          <span className="font-medium tabular-nums" style={{ color: COLOR_TREND }}>
            {fmt(trendEntry.value as number)}
            {isPercent ? " %" : ""}
          </span>
        </div>
      )}

      {/* Raw values */}
      {(point?.dividend !== null || point?.divisor !== null) && (
        <div className="border-t pt-1.5 mt-1 space-y-1">
          {point?.dividend !== null && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground text-xs">ตัวตั้ง</span>
              <span className="text-xs tabular-nums">{fmt(point?.dividend ?? null)}</span>
            </div>
          )}
          {point?.divisor !== null && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground text-xs">ตัวหาร</span>
              <span className="text-xs tabular-nums">{fmt(point?.divisor ?? null)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function IndicatorChart({
  data,
  unit,
  isPercent,
  compact = false,
  showTrend = true,
}: {
  data: IndicatorHistoryPoint[];
  unit: string;
  isPercent: boolean;
  compact?: boolean;
  /** ปิดเส้นแนวโน้มเมื่อกราฟมีจุดน้อย เช่น โหมดเปรียบเทียบ */
  showTrend?: boolean;
}) {
  if (data.length === 0) return null;

  const allValues = data.map((d) => d.value ?? 0);
  const target = data[0]?.target ?? 0;
  const trendValues = showTrend
    ? computeTrend(data)
    : data.map(() => null as number | null);
  const chartData = data.map((d, i) => ({ ...d, trend: trendValues[i] }));
  const maxVal = Math.max(...allValues, target, ...trendValues.filter((v) => v !== null) as number[], 1);
  const hasMissing = data.some((d) => d.value === null);
  const yMax = Math.ceil(maxVal * 1.15);
  const axisLabel = isPercent ? "ร้อยละ (%)" : unit ? unit : "ค่า";

  return (
    <div className="space-y-1">
      <ResponsiveContainer width="100%" height={compact ? 140 : 300}>
        <ComposedChart
          data={chartData}
          margin={
            compact
              ? { top: 18, right: 6, left: 4, bottom: 0 }
              : { top: 20, right: 24, left: 8, bottom: 8 }
          }
          barCategoryGap="35%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="currentColor"
            strokeOpacity={0.1}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: compact ? 9 : 11 }}
            tickLine={false}
            axisLine={false}
            interval={compact && data.length > 6 ? "preserveStartEnd" : 0}
          />
          <YAxis
            tick={{ fontSize: compact ? 9 : 11 }}
            tickLine={false}
            axisLine={{ stroke: "currentColor", strokeOpacity: 0.15 }}
            width={compact ? 50 : 56}
            domain={[0, yMax]}
            tickFormatter={(v) =>
              isPercent
                ? `${fmt(v)}%`
                : v >= 1000000
                  ? `${fmt(v / 1000000)}M`
                  : v >= 10000
                    ? `${fmt(v / 1000)}k`
                    : fmt(v)
            }
          >
            <Label
              value={axisLabel}
              angle={-90}
              position="insideLeft"
              style={{
                fontSize: compact ? 9 : 11,
                fill: "var(--muted-foreground)",
                textAnchor: "middle",
              }}
            />
          </YAxis>
          <Tooltip
            content={(props) => <CustomTooltip {...(props as TooltipContentProps<number, string>)} isPercent={isPercent} />}
            cursor={{ fill: "currentColor", fillOpacity: 0.04 }}
          />
          {!compact && (
            <Legend
              formatter={(value: string) => {
                if (value === "value")
                  return `ผลลัพธ์ (${isPercent ? "(ตัวตั้ง÷ตัวหาร)×100" : "ตัวตั้ง÷ตัวหาร"})`;
                if (value === "trend") return "แนวโน้ม (Linear)";
                return `เป้าหมาย (${fmt(target)} ${unit})`;
              }}
              wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }}
            />
          )}

          <Bar dataKey="value" name="value" maxBarSize={compact ? 28 : 52} radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="value"
              position="top"
              style={{
                fontSize: compact ? 9 : 10,
                fill: "var(--muted-foreground)",
              }}
              formatter={(v) => {
                if (typeof v !== "number") return "";
                return isPercent ? `${fmt(v)}%` : fmt(v);
              }}
            />
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={barColor(entry.value, entry.target)}
                fillOpacity={entry.value === null ? 0.3 : 0.9}
              />
            ))}
          </Bar>

          {/* จุดเดียวลากเส้นไม่ได้ ต้องใช้เส้นอ้างอิงพาดขวางกราฟแทน */}
          {data.length === 1 ? (
            <ReferenceLine
              y={target}
              stroke={COLOR_TARGET}
              strokeWidth={2}
              strokeDasharray="6 3"
              ifOverflow="extendDomain"
            />
          ) : (
            <Line
              type="monotone"
              dataKey="target"
              name="target"
              stroke={COLOR_TARGET}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={compact ? false : { r: 4, fill: COLOR_TARGET, strokeWidth: 0 }}
              activeDot={{ r: compact ? 3 : 5, fill: COLOR_TARGET, strokeWidth: 0 }}
              legendType="plainline"
            />
          )}

          {showTrend && (
            <Line
              type="linear"
              dataKey="trend"
              name="trend"
              stroke={COLOR_TREND}
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: compact ? 3 : 4, fill: COLOR_TREND, strokeWidth: 0 }}
              legendType="plainline"
              connectNulls
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend: อธิบายสีแท่งและเส้นทุกกราฟ รวมกราฟย่อในการ์ด */}
      <div
        className={`flex flex-wrap items-center text-muted-foreground ${
          compact
            ? "gap-x-4 gap-y-1.5 px-1 pt-1 pb-1 text-[10px]"
            : "justify-center gap-x-6 gap-y-2 pb-1 text-xs"
        }`}
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            className={`inline-block rounded-sm ${compact ? "size-2" : "size-2.5"}`}
            style={{ backgroundColor: COLOR_VALUE }}
          />
          ผ่านเป้าหมาย
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span
            className={`inline-block rounded-sm ${compact ? "size-2" : "size-2.5"}`}
            style={{ backgroundColor: COLOR_MISS }}
          />
          ต่ำกว่าเป้าหมาย
        </span>
        {hasMissing && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className={`inline-block rounded-sm ${compact ? "size-2" : "size-2.5"}`}
              style={{ backgroundColor: COLOR_EMPTY }}
            />
            ไม่มีข้อมูล
          </span>
        )}
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <svg width={compact ? 14 : 18} height="10" className="shrink-0">
            <line
              x1="0"
              y1="5"
              x2={compact ? 14 : 18}
              y2="5"
              stroke={COLOR_TARGET}
              strokeWidth="2"
              strokeDasharray="6 3"
            />
          </svg>
          เป้าหมาย {fmt(target)} {unit}
        </span>
        {showTrend && (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <svg width={compact ? 14 : 18} height="10" className="shrink-0">
              <line
                x1="0"
                y1="5"
                x2={compact ? 14 : 18}
                y2="5"
                stroke={COLOR_TREND}
                strokeWidth="2"
                strokeDasharray="4 2"
              />
            </svg>
            แนวโน้ม
          </span>
        )}
      </div>
    </div>
  );
}
