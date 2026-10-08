import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiDashboard from "./dashboard";
import { Activity, CalendarDays } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex w-full items-center gap-2 px-4 sm:px-6 lg:px-8">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>หน้าหลัก</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto hidden items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <CalendarDays className="size-3.5 text-primary" />
            ศูนย์ติดตามผลการดำเนินงาน
          </div>
        </div>
      </header>
      <main className="page-shell">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow mb-2">Dashboard</p>
            <h1 className="page-heading">ภาพรวมตัวชี้วัด</h1>
            <p className="mt-1 text-sm text-muted-foreground">ติดตามความคืบหน้าและผลการดำเนินงานแยกตามด้าน</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Activity className="size-4" />
            ข้อมูลอัปเดตตามปีงบประมาณ
          </div>
        </div>
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b bg-white/70 px-5 py-5 sm:px-6">
            <CardTitle className="text-lg">สถานะการรายงาน</CardTitle>
            <CardDescription>เลือกด้านและปีงบประมาณเพื่อดูรายละเอียด</CardDescription>
          </CardHeader>
          <CardContent className="px-4 py-5 sm:px-6 sm:py-6">
            <Suspense fallback={<Skeleton className="h-52 w-full rounded-2xl" />}>
              <KpiDashboard />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  );
}
