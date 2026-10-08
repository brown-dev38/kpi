import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiRegisterIndicatorContent from "./content";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiRegisterIndicatorPage() {
  return (
    <main className="p-5">
      <Card>
        <CardHeader>
          <CardTitle>ลงข้อมูลตัวชี้วัด</CardTitle>
          <CardDescription>
            กรุณาเลือกตัวชี้วัดที่ต้องการลงข้อมูล
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <KpiRegisterIndicatorContent />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
