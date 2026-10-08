import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import dynamic from "next/dynamic";
import { fetchDataEmployee, fetchAvailableEmployees } from "./actions";
import { PaginationComponent } from "@/lib/pagination";

const KpiSettingsStaffAdd = dynamic(() => import("./add"));
const KpiSettingsStaffTable = dynamic(() => import("./table"));

export default async function KpiSettingsStaffPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const [data, employees] = await Promise.all([
    fetchDataEmployee({ page: page, search: search }),
    fetchAvailableEmployees(),
  ]);

  return (
    <main className="p-5">
      <Card>
        <CardHeader>
          <CardTitle>เจ้าหน้าที่</CardTitle>
          <CardDescription>ข้อมูลเจ้าหน้าที่ทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsStaffAdd employees={employees} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <KpiSettingsStaffTable
            page={page}
            search={search}
            total={data.pagination.total}
          />
        </CardContent>
        <PaginationComponent data={data.pagination} current={page} />
      </Card>
    </main>
  );
}
