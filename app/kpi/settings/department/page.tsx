import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiSettingsDepartmentAdd from "./add";
import { fetchPaginationDepartment } from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import KpiSettingsDepartmentTable from "./table";

export default async function KpiSettingsDepartmentPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const pagination = await fetchPaginationDepartment(page, search);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>แผนก</CardTitle>
          <CardDescription>ข้อมูลแผนกทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsDepartmentAdd />
          </CardAction>
        </CardHeader>
        <CardContent>
          <KpiSettingsDepartmentTable
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
