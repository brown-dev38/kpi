import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiSettingsFiscalYearTable from "./table";
import KpiSettingsFiscalYearAdd from "./add";
import { fetchPaginationFiscalYear } from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import Search from "@/lib/search";

export default async function KpiSettingsFiscalYearPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const pagination = await fetchPaginationFiscalYear(page, search);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>ปีงบประมาณ</CardTitle>
          <CardDescription>ข้อมูลปีงบประมาณทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsFiscalYearAdd />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsFiscalYearTable
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
