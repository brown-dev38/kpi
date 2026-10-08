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
import KpiSettingsResearchIndicatorIdContent from "./content";
import { fetchDataResearchMain, fetchDataEmployee } from "./actions";

export default async function KpiSettingsResearchIndicatorIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [main, employees] = await Promise.all([
    fetchDataResearchMain(),
    fetchDataEmployee(),
  ]);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>แก้ไขตัวชี้วัดวิจัย</CardTitle>
          <CardDescription>ข้อมูลตัวชี้วัดวิจัยทั้งหมด</CardDescription>
          <CardAction>
            <Link href="/kpi/settings/kpi/research/indicator">
              <Button variant={"ghost"}>
                <ChevronLeft />
                ย้อนกลับ
              </Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <KpiSettingsResearchIndicatorIdContent
            id={id}
            main={main}
            employees={employees}
          />
        </CardContent>
      </Card>
    </main>
  );
}
