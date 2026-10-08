import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiSettingsIndicatorSubAdd from "./add";
import { PaginationComponent } from "@/lib/pagination";
import { fetchDataIndicatorMain, fetchPaginationIndicatorSub } from "./actions";
import KpiSettingsIndicatorSubTable from "./table";
import Search from "@/lib/search";

export default async function KpiSettingsIndicatorMainPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const [pagination, main] = await Promise.all([
    fetchPaginationIndicatorSub(page, search),
    fetchDataIndicatorMain(),
  ]);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>หัวข้อย่อย</CardTitle>
          <CardDescription>ข้อมูลหัวข้อย่อยทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsIndicatorSubAdd main={main} />
          </CardAction>
        </CardHeader>
        <CardContent>
          <Search search={search} />
          <KpiSettingsIndicatorSubTable
            page={page}
            search={search}
            total={pagination?.total}
            main={main}
          />
        </CardContent>
        <PaginationComponent data={pagination} current={page} />
      </Card>
    </main>
  );
}
