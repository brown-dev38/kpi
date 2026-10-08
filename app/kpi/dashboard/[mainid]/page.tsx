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
import {
  fetchDashboardAdminByMain,
  fetchDashboardIndicatorByMain,
  fetchDashboardResearchByMain,
  fetchAdminHistory,
  fetchIndicatorHistory,
  fetchResearchHistory,
} from "@/app/kpi/actions";
import { CategoryDashboard } from "./category-client";
import type { HistoryEntry } from "@/app/kpi/dashboard/_components/indicator-group";

type Props = {
  params: Promise<{ mainid: string }>;
  searchParams: Promise<{ year?: string; domain?: string; name?: string }>;
};

export default async function DashboardDetailPage({
  params,
  searchParams,
}: Props) {
  const { mainid } = await params;
  const { year: yearStr, domain, name } = await searchParams;

  const year = Number(yearStr ?? 0);
  const id = Number(mainid);
  const mainName = name ? decodeURIComponent(name) : "-";

  const items =
    domain === "research"
      ? await fetchDashboardResearchByMain(id, year)
      : domain === "admin"
        ? await fetchDashboardAdminByMain(id, year)
        : await fetchDashboardIndicatorByMain(id, year);

  const histories = await Promise.all(
    items.map((item) =>
      domain === "research"
        ? fetchResearchHistory(item.id)
        : domain === "admin"
          ? fetchAdminHistory(item.id)
          : fetchIndicatorHistory(item.id, item.programid),
    ),
  );
  const historyMap: Record<string, HistoryEntry> = {};
  items.forEach((item, i) => {
    historyMap[item.key] = {
      history: histories[i].history,
      unit: histories[i].unit,
    };
  });

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
                <BreadcrumbPage>{mainName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <main className="p-5">
        <CategoryDashboard
          items={items}
          historyMap={historyMap}
          year={year}
          mainid={mainid}
          domain={domain}
          mainName={mainName}
        />
      </main>
    </SidebarInset>
  );
}
