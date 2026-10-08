import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import KpiRegisterResearchContent from "./content";
import { Skeleton } from "@/components/ui/skeleton";

export default function KpiRegisterResearchPage() {
  return (
    <main className="p-5">
      <Card>
        <CardHeader>
          <CardTitle>ลงข้อมูลตัวชี้วัด</CardTitle>
          <CardDescription>
            กรุณาเลือกตัวชี้วัดที่ต้องการลงข้อมูล (ด้านงานวิจัยและบริการวิชาการ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <KpiRegisterResearchContent />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
