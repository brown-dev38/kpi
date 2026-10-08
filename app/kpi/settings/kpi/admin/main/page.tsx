import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchPaginationAdminMain } from "./actions";
import KpiSettingsAdminMainAdd from "./add";
import { PaginationComponent } from "@/lib/pagination";
import KpiSettingsAdminMainTable from "./table";
import Search from "@/lib/search";

export default async function KpiSettingsAdminMainPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const pagination = await fetchPaginationAdminMain(page, search);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>หัวข้อหลัก</CardTitle>
          <CardDescription>ข้อมูลหัวข้อหลักทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsAdminMainAdd />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsAdminMainTable
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
