"use client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { fetchDataResearchIndicator } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import Link from "next/link";

type Data = {
  id: number;
  name: string;
  condition: string;
  target: number;
  unit: string;
  research_main: { id: number; name: string } | null;
  isActive: boolean;
};

export default function KpiSettingsResearchIndicatorTable({
  page,
  search,
  total,
}: {
  page: number;
  search: string;
  total: number;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Data[]>([]);

  useEffect(() => {
    setLoading(true);
    fetchDataResearchIndicator(page, search).then((data) => {
      setLoading(false);
      setData(data);
    });
  }, [page, search, total]);

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">ลำดับ</TableHead>
            <TableHead>ชื่อตัวชี้วัด</TableHead>
            <TableHead>เงื่อนไข</TableHead>
            <TableHead>หัวข้อหลัก</TableHead>
            <TableHead className="text-center">สถานะ</TableHead>
            <TableHead className="text-center">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 10 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: 6 }).map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : data.map((x, i) => (
                <TableRow key={x.id}>
                  <TableCell className="text-center">
                    {(page - 1) * 10 + i + 1}
                  </TableCell>
                  <TableCell className="whitespace-normal wrap-words">
                    {x.name}
                  </TableCell>
                  <TableCell>
                    {x.condition}
                    {x.target}
                    {x.unit}
                  </TableCell>
                  <TableCell className="whitespace-normal wrap-words">
                    {x.research_main?.name}
                  </TableCell>
                  <TableCell className="text-center">
                    {x.isActive ? (
                      <Badge className="bg-emerald-100 text-emerald-500">
                        เปิดใช้งาน
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-500">
                        ปิดใช้งาน
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/kpi/settings/kpi/research/indicator/${x.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  );
}
