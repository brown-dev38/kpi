import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchDashboardAdminDetail,
  fetchDashboardIndicatorDetail,
  fetchDashboardResearchDetail,
  fetchAdminHistory,
  fetchIndicatorHistory,
  fetchResearchHistory,
} from "@/app/kpi/actions";
import { notFound } from "next/navigation";
import { IndicatorChart } from "./chart";
import {
  BarChart3,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
  Target,
  Users,
  XCircle,
} from "lucide-react";

type Props = {
  params: Promise<{ mainid: string; indicatorid: string }>;
  searchParams: Promise<{
    year?: string;
    domain?: string;
    mainName?: string;
    name?: string;
    program?: string;
  }>;
};


/** คั่นหลักพันเสมอ ทศนิยมไม่เกิน 2 ตำแหน่ง */
function fmtNumber(v: number): string {
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default async function DashboardIndicatorDetailPage({
  params,
  searchParams,
}: Props) {
  const { mainid, indicatorid } = await params;
  const { year: yearStr, domain, mainName, name, program } =
    await searchParams;

  const year = Number(yearStr ?? 0);
  const id = Number(indicatorid);
  const programid = Number(program) || 1;
  const decodedMainName = mainName ? decodeURIComponent(mainName) : "-";
  const decodedName = name ? decodeURIComponent(name) : "-";

  const [data, historyResult] = await Promise.all([
    domain === "research"
      ? fetchDashboardResearchDetail(id, year)
      : domain === "admin"
        ? fetchDashboardAdminDetail(id, year)
        : fetchDashboardIndicatorDetail(id, year, programid),
    domain === "research"
      ? fetchResearchHistory(id)
      : domain === "admin"
        ? fetchAdminHistory(id)
        : fetchIndicatorHistory(id, programid),
  ]);

  if (!data) notFound();

  const isPercent = domain !== "research" && domain !== "admin";
  const { history, unit: historyUnit } = historyResult;

  type StaffRef = {
    staff: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    } | null;
  };

  const guides =
    domain === "research"
      ? (data as { kpiResearchGuides: { id: number; name: string }[] })
          .kpiResearchGuides
      : domain === "admin"
        ? (data as { kpiAdminGuides: { id: number; name: string }[] })
            .kpiAdminGuides
        : (data as { kpiIndicatorGuide: { id: number; name: string }[] })
            .kpiIndicatorGuide;

  const refs =
    domain === "research"
      ? (
          data as {
            kpiResearchRefs: { id: number; name: string; url: string }[];
          }
        ).kpiResearchRefs
      : domain === "admin"
        ? (
            data as {
              kpiAdminRefs: { id: number; name: string; url: string }[];
            }
          ).kpiAdminRefs
        : (
            data as {
              kpiIndicatorRefs: { id: number; name: string; url: string }[];
            }
          ).kpiIndicatorRefs;

  const users =
    domain === "research"
      ? (data as { kpiResearchUsers: StaffRef[] }).kpiResearchUsers
      : domain === "admin"
        ? (data as { kpiAdminUsers: StaffRef[] }).kpiAdminUsers
        : (data as { kpiIndicatorUser: StaffRef[] }).kpiIndicatorUser;

  const backUrl = `/kpi/dashboard/${mainid}?year=${year}&domain=${domain ?? ""}&name=${encodeURIComponent(decodedMainName)}`;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/kpi">หน้าหลัก</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={backUrl}>
                  {decodedMainName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="max-w-[200px] truncate">
                  {decodedName}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <main className="p-4 md:p-6 space-y-4">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-semibold leading-tight">{data.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ปีงบประมาณ {year} · {decodedMainName}
          </p>
        </div>

        {/* Timeline chart */}
        {history.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="size-4 text-muted-foreground" />
                ประวัติการบันทึกข้อมูล
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {isPercent ? "(ตัวตั้ง ÷ ตัวหาร) × 100" : "ตัวตั้ง ÷ ตัวหาร"}
                  &nbsp;·&nbsp; เป้าหมาย {fmtNumber(data.target)} {historyUnit}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IndicatorChart
                data={history}
                unit={historyUnit}
                isPercent={isPercent}
              />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left column — main info */}
          <div className="lg:col-span-2 space-y-4">
            {/* Indicator details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-muted-foreground" />
                  รายละเอียดตัวชี้วัด
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 divide-y">
                <InfoRow label="ชื่อตัวชี้วัด" value={data.name} />
                <InfoRow label="ข้อมูลที่ต้องเก็บ" value={data.resource} />
                <InfoRow
                  label="รอบวัด"
                  value={
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="size-3.5 text-muted-foreground" />
                      {data.period === "SEMESTER" ? "รายภาคการศึกษา" : "รายปี"}
                    </span>
                  }
                />
                <InfoRow
                  label="เงื่อนไข"
                  value={
                    <span className="flex items-center gap-1.5">
                      <Target className="size-3.5 text-muted-foreground" />
                      {data.condition} {fmtNumber(data.target)} {data.unit}
                    </span>
                  }
                />
                <InfoRow label="ตัวตั้ง (Dividend)" value={data.dividend} />
                <InfoRow
                  label="ตัวหาร (Divisor)"
                  value={
                    data.divisor || (
                      <span className="text-muted-foreground">-</span>
                    )
                  }
                />
              </CardContent>
            </Card>

            {/* Answer status */}
            <Card
              className={
                data.answer
                  ? "border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20"
                  : "border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20"
              }
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  {data.answer ? (
                    <CheckCircle2 className="size-4 text-green-600" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  ผลการบันทึกข้อมูล
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.answer ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-green-700 border-green-500 bg-green-50 dark:bg-green-950/40"
                      >
                        บันทึกแล้ว
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="rounded-lg bg-background border px-4 py-3 space-y-0.5">
                        <p className="text-xs text-muted-foreground">ตัวตั้ง</p>
                        <p className="text-2xl font-bold tabular-nums">
                          {fmtNumber(data.answer.dividend)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-background border px-4 py-3 space-y-0.5">
                        <p className="text-xs text-muted-foreground">ตัวหาร</p>
                        <p className="text-2xl font-bold tabular-nums">
                          {data.answer.divisor !== null &&
                          data.answer.divisor !== undefined ? (
                            fmtNumber(data.answer.divisor)
                          ) : (
                            <span className="text-muted-foreground text-lg">
                              -
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive">ยังไม่บันทึก</Badge>
                    <p className="text-sm text-muted-foreground">
                      ยังไม่มีการบันทึกข้อมูลสำหรับปีนี้
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column — meta info */}
          <div className="space-y-4">
            {/* Responsible staff */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-muted-foreground" />
                  ผู้รับผิดชอบ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
                ) : (
                  <ul className="space-y-2">
                    {users.map((u) => {
                      const initials = [u.staff?.first_name, u.staff?.last_name]
                        .filter(Boolean)
                        .map((n) => n![0])
                        .join("")
                        .toUpperCase();
                      return (
                        <li
                          key={u.staff?.id}
                          className="flex items-center gap-2.5"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                            {initials || "?"}
                          </span>
                          <span className="text-sm">
                            {u.staff?.first_name} {u.staff?.last_name}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Guidelines */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-muted-foreground" />
                  แนวทางปฏิบัติ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {guides.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
                ) : (
                  <ul className="space-y-2">
                    {guides.map((g, i) => (
                      <li key={g.id} className="flex gap-2 text-sm">
                        <span className="shrink-0 text-muted-foreground font-mono text-xs pt-0.5">
                          {String(i + 1).padStart(2, "0")}.
                        </span>
                        <span>{g.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* References */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Link2 className="size-4 text-muted-foreground" />
                  แหล่งข้อมูลอ้างอิง
                </CardTitle>
              </CardHeader>
              <CardContent>
                {refs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>
                ) : (
                  <ul className="space-y-2">
                    {refs.map((r) => (
                      <li key={r.id}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-1.5 text-sm text-primary hover:underline underline-offset-2 group"
                        >
                          <ExternalLink className="size-3.5 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                          <span>{r.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </SidebarInset>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-3 text-sm">
      <span className="text-muted-foreground font-medium shrink-0">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
