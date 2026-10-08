import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiSettingsProgramTable from "./table";
import KpiSettingsProgramAdd from "./add";
import { fetchPaginationProgram } from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import Search from "@/lib/search";

export default async function KpiSettingsProgramPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const pagination = await fetchPaginationProgram(page, search);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>หลักสูตร</CardTitle>
          <CardDescription>ข้อมูลหลักสูตรทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsProgramAdd />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsProgramTable
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
