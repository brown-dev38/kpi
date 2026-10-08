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
import { fetchDataStaff } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import KpiSettingsStaffEdit from "./edit";

type StaffRow = {
  id: number;
  isActive: boolean;
  staffDetail: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    department: { name: string } | null;
    position: { name: string } | null;
  } | null;
};

export default function KpiSettingsStaffTable({
  page,
  search,
  total,
}: {
  page: number;
  search: string;
  total: number;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StaffRow[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<StaffRow | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchDataStaff(page, search).then((rows) => {
      setData(rows);
      setLoading(false);
    });
  }, [page, search, total]);

  const handleEdit = (row: StaffRow) => {
    setOpen(true);
    setEdit(row);
  };

  const handleClose = () => {
    setEdit(null);
    setLoading(true);
    fetchDataStaff(page, search).then((rows) => {
      setData(rows);
      setLoading(false);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">ลำดับ</TableHead>
            <TableHead>ชื่อ - นามสกุล</TableHead>
            <TableHead>หน่วยงาน</TableHead>
            <TableHead>ตำแหน่ง</TableHead>
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
            : data.map((row, i) => (
                <TableRow key={row.id}>
                  <TableCell className="text-center">
                    {(page - 1) * 10 + i + 1}
                  </TableCell>
                  <TableCell>
                    {row.staffDetail?.first_name ?? ""}{" "}
                    {row.staffDetail?.last_name ?? ""}
                  </TableCell>
                  <TableCell>
                    {row.staffDetail?.department?.name ?? "-"}
                  </TableCell>
                  <TableCell>
                    {row.staffDetail?.position?.name ?? "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.isActive ? (
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
                      onClick={() => handleEdit(row)}
                    >
                      <Edit />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <KpiSettingsStaffEdit
        open={open}
        setOpen={setOpen}
        edit={edit}
        setEdit={setEdit}
        reload={handleClose}
      />
    </div>
  );
}
