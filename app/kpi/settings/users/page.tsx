import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiSettingsUsersTable from "./table";
import {
  fetchPaginationUser,
  fetchDataDepartment,
  fetchDataPosition,
  fetchDataRole,
} from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import Search from "@/lib/search";

export default async function KpiSettingsUsersPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const [pagination, department, position, role] = await Promise.all([
    fetchPaginationUser(page, search),
    fetchDataDepartment(),
    fetchDataPosition(),
    fetchDataRole(),
  ]);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>พนักงาน</CardTitle>
          <CardDescription>ข้อมูลพนักงานทั้งหมด</CardDescription>
          <CardAction></CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsUsersTable
            page={page}
            search={search}
            total={pagination?.total}
            department={department}
            position={position}
            role={role}
          />
        </CardContent>
        <PaginationComponent data={pagination} current={page} />
      </Card>
    </main>
  );
}
