import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiSettingsAcademicYearTable from "./table";
import KpiSettingsAcademicYearAdd from "./add";
import { fetchPaginationAcademicYear } from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import Search from "@/lib/search";

export default async function KpiSettingsAcademicYearPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const pagination = await fetchPaginationAcademicYear(page, search);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>ปีการศึกษา</CardTitle>
          <CardDescription>ข้อมูลปีการศึกษาทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsAcademicYearAdd />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsAcademicYearTable
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
