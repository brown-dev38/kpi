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
import { fetchDataAcademicYear } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import KpiSettingsAcademicYearEdit from "./edit";

type Data = {
  id: number;
  year: number;
  semester: number;
  description: string | null;
  isActive: boolean;
};

export default function KpiSettingsAcademicYearTable({
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
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Data | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDataAcademicYear(page, search).then((data) => {
      setLoading(false);
      setData(data);
    });
  }, [page, search, total]);

  const handleEdit = (x: Data) => {
    setOpen(true);
    setEdit(x);
  };

  const handleClose = () => {
    setEdit(null);
    setLoading(true);
    fetchDataAcademicYear(page, search).then((data) => {
      setLoading(false);
      setData(data);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">ลำดับ</TableHead>
            <TableHead className="text-center">ปีการศึกษา</TableHead>
            <TableHead className="text-center">ภาคการศึกษา</TableHead>
            <TableHead>คำอธิบาย</TableHead>
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
                  <TableCell className="text-center">{x.year}</TableCell>
                  <TableCell className="text-center">{x.semester}</TableCell>
                  <TableCell>{x.description ?? "-"}</TableCell>
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
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(x)}
                    >
                      <Edit />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <KpiSettingsAcademicYearEdit
        open={open}
        setOpen={setOpen}
        edit={edit}
        setEdit={setEdit}
        reload={handleClose}
      />
    </div>
  );
}
