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
import { fetchDataUser } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import KpiSettingsUsersEdit from "./edit";

type Data = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  role: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
  position: { id: number; name: string } | null;
  isActive: boolean;
};

export default function KpiSettingsUsersTable({
  page,
  search,
  total,
  department,
  position,
  role,
}: {
  page: number;
  search: string;
  total: number;
  department: { id: number; name: string }[];
  position: { id: number; name: string }[];
  role: { id: number; name: string }[];
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Data[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchDataUser(page, search)]).then(([data]) => {
      setLoading(false);
      setData(data);
    });
  }, [page, search, total]);

  const handleEdit = (x: number) => {
    setOpen(true);
    setEdit(x);
  };

  const handleClose = () => {
    setEdit(null);
    setLoading(true);
    Promise.all([fetchDataUser(page, search)]).then(([data]) => {
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
            <TableHead>ชื่อ - นามสกุล</TableHead>
            <TableHead>หน่วยงาน</TableHead>
            <TableHead>ตำแหน่ง</TableHead>
            <TableHead>สิทธิ์การใช้งาน</TableHead>
            <TableHead className="text-center">สถานะ</TableHead>
            <TableHead className="text-center">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: 10 }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: 7 }).map((_, colIndex) => (
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
                  <TableCell>{x.first_name + " " + x.last_name}</TableCell>
                  <TableCell>{x.department?.name}</TableCell>
                  <TableCell>{x.position?.name}</TableCell>
                  <TableCell>{x.role?.name}</TableCell>
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
                      onClick={() => handleEdit(x.id)}
                    >
                      <Edit />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>

      <KpiSettingsUsersEdit
        open={open}
        setOpen={setOpen}
        edit={edit}
        setEdit={setEdit}
        reload={handleClose}
        department={department}
        position={position}
        role={role}
      />
    </div>
  );
}
