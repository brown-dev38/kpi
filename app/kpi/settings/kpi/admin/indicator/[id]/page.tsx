import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import KpiSettingsAdminIndicatorIdContent from "./content";
import { fetchDataAdminMain, fetchDataEmployee } from "./actions";

export default async function KpiSettingsAdminIndicatorIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [main, employees] = await Promise.all([
    fetchDataAdminMain(),
    fetchDataEmployee(),
  ]);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>แก้ไขตัวชี้วัดบริหารทั่วไป</CardTitle>
          <CardDescription>ข้อมูลตัวชี้วัดบริหารทั่วไปทั้งหมด</CardDescription>
          <CardAction>
            <Link href="/kpi/settings/kpi/admin/indicator">
              <Button variant={"ghost"}>
                <ChevronLeft />
                ย้อนกลับ
              </Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <KpiSettingsAdminIndicatorIdContent
            id={id}
            main={main}
            employees={employees}
          />
        </CardContent>
      </Card>
    </main>
  );
}
