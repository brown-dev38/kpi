"use client";

import {
  Bar,
  CartesianGrid,
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

/** สีของแต่ละตัวชี้วัด เลี่ยงเหลือง (เป้าหมาย) และแดง (ต่ำกว่าเป้า) ที่ใช้สื่อความหมายอื่น */
export const SERIES_COLORS = [
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#10b981", // emerald-500
  "#0ea5e9", // sky-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
  "#14b8a6", // teal-500
  "#a855f7", // purple-500
];

export type ComparisonSeries = {
  /** dataKey ในกราฟ */
  key: string;
  name: string;
  color: string;
  target: number;
  unit: string;
  /** แกน y ของชุดนี้; ไม่ระบุ = ชุดแรกแกนซ้าย ที่เหลือแกนขวา */
  axis?: "left" | "right";
  /** ค่าตามลำดับเดียวกับ categories */
  values: (number | null)[];
};

function fmt(v: number | null): string {
  if (v === null) return "-";
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** เส้นแนวโน้มแบบ linear regression จากจุดที่มีค่า */
function computeTrend(values: (number | null)[]): (number | null)[] {
  const valid = values
    .map((v, i) => (v !== null ? { i, v } : null))
    .filter(Boolean) as { i: number; v: number }[];

  if (valid.length < 2) return values.map(() => null);

  const n = valid.length;
  const sumX = valid.reduce((s, p) => s + p.i, 0);
  const sumY = valid.reduce((s, p) => s + p.v, 0);
  const sumXY = valid.reduce((s, p) => s + p.i * p.v, 0);
  const sumX2 = valid.reduce((s, p) => s + p.i * p.i, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return values.map(() => null);

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_, i) =>
    Math.max(0, parseFloat((slope * i + intercept).toFixed(4))),
  );
}

function CompareTooltip({
  active,
  payload,
  label,
  isPercent,
  series,
}: TooltipContentProps<number, string> & {
  isPercent: boolean;
  series: ComparisonSeries[];
}) {
  if (!active || !payload?.length) return null;

  const suffix = isPercent ? " %" : "";

  return (
    <div className="min-w-[200px] max-w-[300px] space-y-2 rounded-lg border bg-background px-3 py-2.5 text-sm shadow-md">
      <p className="font-semibold text-foreground">{label}</p>
      {series.map((s) => {
        const value = payload.find((p) => p.dataKey === s.key)?.value as
          | number
          | null
          | undefined;
        const trend = payload.find((p) => p.dataKey === `${s.key}__trend`)
          ?.value as number | null | undefined;

        return (
          <div key={s.key} className="space-y-0.5">
            <span className="flex items-start gap-1.5">
              <span
                className="mt-1 inline-block size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="min-w-0 text-xs leading-snug wrap-break-word">
                {s.name}
              </span>
            </span>
            <div className="flex items-center justify-between gap-3 pl-4">
              <span className="text-xs text-muted-foreground">ผลลัพธ์</span>
              <span
                className="font-bold tabular-nums"
                style={{ color: s.color }}
              >
                {fmt(value ?? null)}
                {suffix}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pl-4">
              <span className="text-xs text-muted-foreground">เป้าหมาย</span>
              <span className="text-xs font-medium tabular-nums">
                {fmt(s.target)}
                {suffix}
              </span>
            </div>
            {trend !== undefined && trend !== null && (
              <div className="flex items-center justify-between gap-3 pl-4">
                <span className="text-xs text-muted-foreground">แนวโน้ม</span>
                <span className="text-xs font-medium tabular-nums">
                  {fmt(trend)}
                  {suffix}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * กราฟแท่งหลายสี เทียบตัวชี้วัดหลายตัวในแกนเวลาเดียวกัน
 * แต่ละตัวชี้วัดมีแท่ง + เส้นเป้าหมาย (เส้นประ) + เส้นแนวโน้ม (เส้นจุด) สีเดียวกัน
 * ต่างจาก IndicatorChart ที่แท่งสีเดียวและใช้สีบอกว่าผ่านเป้าหรือไม่
 * แกน Y ซ้ายเป็นของตัวชี้วัดหลัก (series[0]) แกนขวาเป็นของตัวที่นำมาเทียบ เพราะหน่วยและขนาดค่าต่างกันได้มาก
 */
export function ComparisonChart({
  categories,
  series,
  isPercent,
  compact = false,
}: {
  categories: string[];
  series: ComparisonSeries[];
  isPercent: boolean;
  compact?: boolean;
}) {
  if (categories.length === 0 || series.length === 0) return null;

  const trends = series.map((s) => computeTrend(s.values));
  const hasTrend = trends.some((t) => t.some((v) => v !== null));

  const chartData = categories.map((label, index) => {
    const row: Record<string, string | number | null> = { label };
    series.forEach((s, seriesIndex) => {
      row[s.key] = s.values[index] ?? null;
      row[`${s.key}__target`] = s.target;
      row[`${s.key}__trend`] = trends[seriesIndex][index];
    });
    return row;
  });

  // ชุดที่สเกลเดียวกัน (เช่น หลายหลักสูตรของตัวชี้วัดเดียว) ใช้แกนเดียวกันผ่าน s.axis
  const axes = series.map(
    (s, index) => s.axis ?? (index === 0 ? "left" : "right"),
  );
  const indexesOf = (axis: "left" | "right") =>
    series.map((_, i) => i).filter((i) => axes[i] === axis);
  const leftIndexes = indexesOf("left");
  const rightIndexes = indexesOf("right");
  const hasRight = rightIndexes.length > 0;
  const axisOf = (index: number) => axes[index];

  const yMaxOf = (indexes: number[]) =>
    Math.ceil(
      Math.max(
        ...indexes.flatMap((i) => [
          ...series[i].values.map((v) => v ?? 0),
          series[i].target,
          ...trends[i].filter((v): v is number => v !== null),
        ]),
        1,
      ) * 1.15,
    );

  const axisLabelOf = (units: string[]) =>
    isPercent ? "ร้อยละ (%)" : [...new Set(units.filter(Boolean))].join(" / ") || "ค่า";

  const tickFormatter = (v: number) =>
    isPercent
      ? `${fmt(v)}%`
      : v >= 1000000
        ? `${fmt(v / 1000000)}M`
        : v >= 10000
          ? `${fmt(v / 1000)}k`
          : fmt(v);

  const renderYAxis = (
    side: "left" | "right",
    max: number,
    label: string,
    color: string,
  ) => (
    <YAxis
      yAxisId={side}
      orientation={side}
      tick={{ fontSize: compact ? 9 : 11 }}
      tickLine={false}
      axisLine={{ stroke: "currentColor", strokeOpacity: 0.15 }}
      width={compact ? 50 : 56}
      domain={[0, max]}
      tickFormatter={tickFormatter}
    >
      <Label
        value={label}
        angle={side === "left" ? -90 : 90}
        position={side === "left" ? "insideLeft" : "insideRight"}
        style={{
          fontSize: compact ? 9 : 11,
          fill: color,
          textAnchor: "middle",
        }}
      />
    </YAxis>
  );

  const axisNote = (index: number) =>
    hasRight ? ` · แกน${axes[index] === "left" ? "ซ้าย" : "ขวา"}` : "";

  return (
    <div className="space-y-1">
      <ResponsiveContainer width="100%" height={compact ? 180 : 340}>
        <ComposedChart
          data={chartData}
          margin={
            compact
              ? { top: 18, right: 6, left: 4, bottom: 0 }
              : { top: 20, right: 24, left: 8, bottom: 8 }
          }
          barCategoryGap="25%"
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
            interval={0}
          />
          {renderYAxis(
            "left",
            yMaxOf(leftIndexes),
            axisLabelOf(leftIndexes.map((i) => series[i].unit)),
            hasRight && leftIndexes.length === 1
              ? series[leftIndexes[0]].color
              : "var(--muted-foreground)",
          )}
          {hasRight &&
            renderYAxis(
              "right",
              yMaxOf(rightIndexes),
              axisLabelOf(rightIndexes.map((i) => series[i].unit)),
              rightIndexes.length === 1
                ? series[rightIndexes[0]].color
                : "var(--muted-foreground)",
            )}
          <Tooltip
            content={(props) => (
              <CompareTooltip
                {...(props as TooltipContentProps<number, string>)}
                isPercent={isPercent}
                series={series}
              />
            )}
            cursor={{ fill: "currentColor", fillOpacity: 0.04 }}
          />
          {!compact && (
            <Legend
              content={() => (
                <div className="flex flex-col gap-1.5 pt-2 text-xs text-muted-foreground">
                  {series.map((s, index) => (
                    <span key={s.key} className="flex items-start gap-2">
                      <span
                        className="mt-1 inline-block size-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="min-w-0 leading-snug wrap-break-word">
                        {s.name} · เป้าหมาย {fmt(s.target)} {s.unit}
                        {axisNote(index)}
                      </span>
                    </span>
                  ))}
                  <span className="flex items-start gap-2">
                    <svg width="18" height="10" className="mt-1 shrink-0">
                      <line
                        x1="0"
                        y1="5"
                        x2="18"
                        y2="5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                      />
                    </svg>
                    <span className="leading-snug">
                      เส้นประ = เป้าหมาย (สีตามตัวชี้วัด)
                    </span>
                  </span>
                  {hasTrend && (
                    <span className="flex items-start gap-2">
                      <svg width="18" height="10" className="mt-1 shrink-0">
                        <line
                          x1="0"
                          y1="5"
                          x2="18"
                          y2="5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeDasharray="2 3"
                        />
                      </svg>
                      <span className="leading-snug">
                        เส้นจุด = แนวโน้ม (สีตามตัวชี้วัด)
                      </span>
                    </span>
                  )}
                </div>
              )}
              wrapperStyle={{ position: "relative" }}
            />
          )}

          {series.map((s, index) => (
            <Bar
              key={s.key}
              yAxisId={axisOf(index)}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              fillOpacity={0.9}
              maxBarSize={compact ? 20 : 44}
              radius={[4, 4, 0, 0]}
            >
              <LabelList
                dataKey={s.key}
                position="top"
                style={{ fontSize: compact ? 9 : 10, fill: s.color }}
                formatter={(v) => {
                  if (typeof v !== "number") return "";
                  return isPercent ? `${fmt(v)}%` : fmt(v);
                }}
              />
            </Bar>
          ))}

          {/* เส้นเป้าหมายของแต่ละตัวชี้วัด — ช่วงเวลาเดียวลากเส้นไม่ได้ ใช้เส้นอ้างอิงพาดขวางแทน */}
          {series.map((s, index) =>
            categories.length === 1 ? (
              <ReferenceLine
                key={`${s.key}-target`}
                yAxisId={axisOf(index)}
                y={s.target}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray="6 3"
                ifOverflow="extendDomain"
              />
            ) : (
              <Line
                key={`${s.key}-target`}
                yAxisId={axisOf(index)}
                type="monotone"
                dataKey={`${s.key}__target`}
                name={`${s.name} (เป้าหมาย)`}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
                activeDot={false}
                legendType="none"
              />
            ),
          )}

          {/* เส้นแนวโน้มของแต่ละตัวชี้วัด */}
          {series.map((s, index) => (
            <Line
              key={`${s.key}-trend`}
              yAxisId={axisOf(index)}
              type="linear"
              dataKey={`${s.key}__trend`}
              name={`${s.name} (แนวโน้ม)`}
              stroke={s.color}
              strokeWidth={1.5}
              strokeDasharray="2 3"
              strokeOpacity={0.75}
              dot={false}
              activeDot={false}
              legendType="none"
              connectNulls
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {compact && (
        <div className="flex flex-col gap-1 px-1 pb-1 text-[10px] text-muted-foreground">
          {series.map((s, index) => (
            <span key={s.key} className="flex items-start gap-1.5">
              <span
                className="mt-1 inline-block size-2 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="min-w-0 leading-snug wrap-break-word">
                {s.name} · เป้าหมาย {fmt(s.target)} {s.unit}
                {axisNote(index)}
              </span>
            </span>
          ))}
          <span className="flex items-start gap-1.5">
            <svg width="14" height="10" className="mt-0.5 shrink-0">
              <line
                x1="0"
                y1="5"
                x2="14"
                y2="5"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 3"
              />
            </svg>
            <span className="min-w-0 leading-snug">
              เส้นประ = เป้าหมาย (สีตามตัวชี้วัด)
            </span>
          </span>
          {hasTrend && (
            <span className="flex items-start gap-1.5">
              <svg width="14" height="10" className="mt-0.5 shrink-0">
                <line
                  x1="0"
                  y1="5"
                  x2="14"
                  y2="5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                />
              </svg>
              <span className="min-w-0 leading-snug">
                เส้นจุด = แนวโน้ม (สีตามตัวชี้วัด)
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
