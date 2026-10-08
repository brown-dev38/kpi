import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiSettingsPositionAdd from "./add";
import { fetchPaginationPosition } from "./actions";
import { PaginationComponent } from "@/lib/pagination";
import KpiSettingsPositionTable from "./table";

export default async function KpiSettingsPositionPage(props: {
  searchParams: Promise<{ page: string; search: string }>;
}) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams?.page ?? 1);
  const search = decodeURIComponent(searchParams?.search ?? "");

  const pagination = await fetchPaginationPosition(page, search);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>ตำแหน่ง</CardTitle>
          <CardDescription>ข้อมูลตำแหน่งทั้งหมด</CardDescription>
          <CardAction>
            <KpiSettingsPositionAdd />
          </CardAction>
        </CardHeader>
        <CardContent>
          <KpiSettingsPositionTable
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
