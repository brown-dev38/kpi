"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  IndicatorGroup,
  ViewToggle,
  type DashboardView,
  type HistoryEntry,
  type IndicatorItem,
} from "./dashboard/_components/indicator-group";
import {
  fetchActiveFiscalYears,
  fetchDashboardCategory,
  fetchDashboardSummaries,
} from "./actions";
import {
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Gauge,
  ListChecks,
  LoaderCircle,
  RotateCcw,
  SearchIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type FiscalYear = { id: number; year: number };
type Domain = "academic" | "admin" | "research";
type Summary = {
  mainid: number;
  name: string;
  total: number;
  answered: number;
  unanswered: number;
};
type CategoryPayload = {
  mainid: number;
  items: IndicatorItem[];
  historyMap: Record<string, HistoryEntry>;
};

const categoryCache = new Map<string, Promise<CategoryPayload>>();

/** คั่นหลักพันเสมอ ทศนิยมไม่เกิน 2 ตำแหน่ง */
function fmtNumber(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function getCategory(year: number, domain: Domain, mainid: number) {
  const key = `${domain}:${year}:${mainid}`;
  const cached = categoryCache.get(key);
  if (cached) return cached;

  const request = fetchDashboardCategory(year, domain, mainid).catch((error) => {
    categoryCache.delete(key);
    throw error;
  });
  categoryCache.set(key, request);
  return request;
}

function DashboardLoading() {
  return (
    <div className="space-y-4" aria-label="กำลังโหลดข้อมูล">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-36 rounded-xl" />
      <Skeleton className="h-52 w-full rounded-2xl" />
    </div>
  );
}

function LazyCategory({
  summary,
  year,
  domain,
  view,
  query,
}: {
  summary: Summary;
  year: number;
  domain: Domain;
  view: DashboardView;
  query: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearViewport = useInView(containerRef, {
    once: true,
    margin: "700px 0px",
  });
  // ค้นหาแล้วต้องโหลดทุกหมวดทันที ไม่งั้นหมวดที่ยังไม่เลื่อนถึงจะถูกมองว่าไม่มีผลลัพธ์
  const shouldLoad = isNearViewport || query.length > 0;
  const [category, setCategory] = useState<CategoryPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!shouldLoad || category) return;
    let active = true;
    setError(false);
    getCategory(year, domain, summary.mainid)
      .then((data) => {
        if (active) setCategory(data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [category, domain, shouldLoad, summary.mainid, year]);

  // ค้นหาเฉพาะตัวชี้วัดในหมวดนี้ ไม่ข้ามไปหมวดอื่น
  const keyword = query.trim().toLowerCase();
  const matchedItems = category
    ? keyword
      ? category.items.filter((item) =>
          item.name.toLowerCase().includes(keyword),
        )
      : category.items
    : [];

  const retry = () => {
    categoryCache.delete(`${domain}:${year}:${summary.mainid}`);
    setError(false);
    getCategory(year, domain, summary.mainid)
      .then(setCategory)
      .catch(() => setError(true));
  };

  return (
    <motion.div
      ref={containerRef}
      data-motion-item
      layout="position"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {category ? (
        matchedItems.length > 0 ? (
          <IndicatorGroup
            items={matchedItems}
            historyMap={category.historyMap}
            view={view}
            year={year}
            mainid={summary.mainid}
            domain={domain}
            mainName={summary.name}
          />
        ) : null
      ) : error ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
            <CircleAlert className="size-6 text-destructive" />
            <div>
              <p className="text-sm font-medium">โหลดหมวดนี้ไม่สำเร็จ</p>
              <p className="text-xs text-muted-foreground">{summary.name}</p>
            </div>
            <Button size="sm" variant="outline" onClick={retry}>
              <RotateCcw /> ลองอีกครั้ง
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-dashed">
          <CardHeader className="flex-row items-center justify-between gap-3 border-b bg-muted/25">
            <div>
              <p className="font-medium">{summary.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                ตัวชี้วัด {summary.total} รายการ
              </p>
            </div>
            {shouldLoad ? (
              <span className="flex items-center gap-2 text-xs text-primary">
                <LoaderCircle className="size-4 animate-spin" /> กำลังโหลด
              </span>
            ) : (
              <Badge variant="outline">โหลดเมื่อเลื่อนถึง</Badge>
            )}
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 py-5 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-20 rounded-xl" />
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function YearDashboard({ year, domain }: { year: number; domain: Domain }) {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState<DashboardView>("graph");
  // ค้นหาแยกตามแท็บ (state อยู่ในคอมโพเนนต์ของแท็บนั้น) จึงไม่ค้นข้ามด้าน
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchDashboardSummaries(year, domain)
      .then((data) => {
        if (active) setSummaries(data);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [domain, year]);

  if (loading) return <DashboardLoading />;
  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <CircleAlert className="mx-auto mb-3 size-7 text-destructive" />
        <p className="font-medium">ไม่สามารถโหลดข้อมูลภาพรวมได้</p>
        <p className="mt-1 text-sm text-muted-foreground">กรุณาเปลี่ยนปีแล้วลองอีกครั้ง</p>
      </div>
    );
  }
  if (summaries.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">ไม่มีข้อมูล</p>;
  }

  const total = summaries.reduce((sum, item) => sum + item.total, 0);
  const answered = summaries.reduce((sum, item) => sum + item.answered, 0);
  const unanswered = total - answered;
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
  const stats = [
    { label: "ทั้งหมด", value: fmtNumber(total), icon: ListChecks, tone: "bg-violet-50 text-violet-700 border-violet-100" },
    { label: "บันทึกแล้ว", value: fmtNumber(answered), icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { label: "รอดำเนินการ", value: fmtNumber(unanswered), icon: CircleDashed, tone: "bg-rose-50 text-rose-700 border-rose-100" },
    { label: "ความสำเร็จ", value: `${fmtNumber(percent)}%`, icon: Gauge, tone: "bg-amber-50 text-amber-700 border-amber-100" },
  ];

  return (
    <motion.div
      key={`${domain}:${year}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }, index) => (
          <motion.div
            key={label}
            data-motion-item
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.045 }}
            whileHover={{ y: -3 }}
            className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${tone}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-medium opacity-70">{label}</span>
                <p className="mt-1 text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
              </div>
              <span className="rounded-xl bg-white/70 p-2 shadow-sm"><Icon className="size-4 sm:size-5" /></span>
            </div>
            {label === "ความสำเร็จ" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/5">
                <motion.div
                  className="h-full rounded-full bg-current"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <InputGroup className="w-full sm:max-w-72">
          <InputGroupInput
            placeholder="ค้นหาตัวชี้วัดในด้านนี้..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <InputGroupAddon>
            <SearchIcon className="size-4" />
          </InputGroupAddon>
          {query.length > 0 && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                variant="ghost"
                aria-label="ล้างคำค้นหา"
                onClick={() => setQuery("")}
              >
                <X className="size-4" />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <ViewToggle view={view} onChange={setView} />
      </div>
      {query.trim().length > 0 && (
        <p className="text-xs text-muted-foreground">
          ค้นหาเฉพาะตัวชี้วัดในด้านนี้ · หมวดที่ไม่มีผลลัพธ์จะถูกซ่อน
        </p>
      )}

      <div className="flex flex-col gap-4">
        {summaries.map((summary) => (
          <LazyCategory
            key={`${domain}:${year}:${summary.mainid}`}
            summary={summary}
            year={year}
            domain={domain}
            view={view}
            query={query}
          />
        ))}
      </div>
    </motion.div>
  );
}

function isDomain(value: string | null): value is Domain {
  return value === "academic" || value === "admin" || value === "research";
}

export default function KpiDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const domainParam = searchParams.get("domain");
  const activeDomain: Domain = isDomain(domainParam) ? domainParam : "academic";

  const setActiveDomain = useCallback(
    (domain: Domain) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("domain", domain);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loadingYears, setLoadingYears] = useState(true);

  useEffect(() => {
    fetchActiveFiscalYears()
      .then(setFiscalYears)
      .finally(() => setLoadingYears(false));
  }, []);

  if (loadingYears) return <DashboardLoading />;
  if (fiscalYears.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">ไม่มีปีงบประมาณที่เปิดใช้งาน</p>;
  }

  // fetchActiveFiscalYears เรียงปีจากมากไปน้อย ปีล่าสุดจึงเป็นรายการแรก
  const latestYear = fiscalYears[0].year;

  return (
    <Tabs value={activeDomain} onValueChange={(value) => setActiveDomain(value as Domain)} className="gap-5">
      {/* grid ทำให้ทุกแท็บสูงเท่ากันแม้ข้อความยาวไม่เท่ากัน และไม่มีแถบเลื่อนแนวนอน */}
      <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1.5 group-data-[orientation=horizontal]/tabs:h-auto">
        <TabsTrigger
          value="academic"
          className="h-auto min-h-10 w-full whitespace-normal px-2 py-2 text-center leading-snug"
        >
          ด้านวิชาการ
        </TabsTrigger>
        <TabsTrigger
          value="admin"
          className="h-auto min-h-10 w-full whitespace-normal px-2 py-2 text-center leading-snug"
        >
          ด้านบริหารทั่วไป
        </TabsTrigger>
        <TabsTrigger
          value="research"
          className="h-auto min-h-10 w-full whitespace-normal px-2 py-2 text-center leading-snug"
        >
          ด้านงานวิจัย
        </TabsTrigger>
      </TabsList>
      <AnimatePresence mode="wait" initial={false}>
        <YearDashboard
          key={`${activeDomain}:${latestYear}`}
          year={latestYear}
          domain={activeDomain}
        />
      </AnimatePresence>
    </Tabs>
  );
}
