import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiSettingsRoleTable from "./table";
import KpiSettingsRoleAdd from "./add";
import { fetchPaginationRole } from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import Search from "@/lib/search";

export default async function KpiSettingsRolePage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const pagination = await fetchPaginationRole(page, search);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>สิทธิ์การใช้งาน</CardTitle>
          <CardDescription>ข้อมูลสิทธิ์การใช้งานทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsRoleAdd />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsRoleTable
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
