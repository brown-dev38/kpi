import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchPaginationResearchIndicator } from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import KpiSettingsResearchIndicatorTable from "./table";
import Search from "@/lib/search";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function KpiSettingsResearchIndicatorPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const pagination = await fetchPaginationResearchIndicator(page, search);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>ตัวชี้วัดวิจัย</CardTitle>
          <CardDescription>ข้อมูลตัวชี้วัดวิจัยทั้งหมด</CardDescription>
          <CardAction>
            <Link href="/kpi/settings/kpi/research/indicator/add">
              <Button>
                <Plus />
                เพิ่มตัวชี้วัด
              </Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsResearchIndicatorTable
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
