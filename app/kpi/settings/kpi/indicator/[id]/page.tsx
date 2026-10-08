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
import KpiSettingsIndicatorIdIDContent from "./content";
import {
  fetchDataEmployee,
  fetchDataIndicatorMain,
  fetchDataIndicatorSub,
} from "./actions";
import { fetchActiveProgram } from "../../../program/actions";

export default async function KpiSettingsIndicatorIdIDPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [main, sub, employees, programs] = await Promise.all([
    fetchDataIndicatorMain(),
    fetchDataIndicatorSub(),
    fetchDataEmployee(),
    fetchActiveProgram(),
  ]);

  return (
    <main className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>แก้ไขตัวชี้วัด</CardTitle>
          <CardDescription>ข้อมูลตัวชี้วัดทั้งหมด</CardDescription>
          <CardAction>
            <Link href="/kpi/settings/kpi/indicator">
              <Button variant={"ghost"}>
                <ChevronLeft />
                ย้อนกลับ
              </Button>
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <KpiSettingsIndicatorIdIDContent
            id={id}
            main={main}
            sub={sub}
            employees={employees}
            programs={programs}
          />
        </CardContent>
      </Card>
    </main>
  );
}
