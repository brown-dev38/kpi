import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchPaginationKPIIndicator } from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import KpiSettingsIndicatorTable from "./table";
import Search from "@/lib/search";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function KpiSettingsKPIIndicatorPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const [pagination] = await Promise.all([
    fetchPaginationKPIIndicator(page, search),
  ]);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>ตัวชี้วัด</CardTitle>
          <CardDescription>ข้อมูลตัวชี้วัดทั้งหมด</CardDescription>
          <CardAction>
            <Link href="/kpi/settings/kpi/indicator/add">
              <Button>
                <Plus />
                เพิ่มตัวชี้วัด
              </Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsIndicatorTable
            page={page}
            search={search}
            total={pagination?.total}
          />
        </CardContent>
        <PaginationComponent data={pagination} current={page} />
      </Card>
    </main>
  );
}
