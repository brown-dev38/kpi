"use client";

import { useEffect, useState, useTransition } from "react";
import {
  fetchDataIndicatorById,
  fetchDataIndicatorGuide,
  fetchDataIndicatorReference,
  fetchDataEmployeeById,
  fetchDataIndicatorProgram,
  updateIndicator,
} from "./actions";
import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ProgramChecklist, {
  ProgramSelect,
  programLabel,
} from "../../../program/checklist";

type Form = {
  mainid: number;
  subid: number;
  name: string;
  resource: string;
  period: "SEMESTER" | "ANNUAL";
  dividend: string;
  divisor: string;
  condition: string;
  target: number;
  unit: string;
  isActive: boolean;
};

type Main = {
  id: number;
  name: string;
};

type Sub = {
  id: number;
  name: string;
};

/** ผู้รับผิดชอบ + หลักสูตรที่ดูแล (1 = ทุกหลักสูตร) */
type Employee = {
  programid: number;
  staff: {
    id: number;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type Reference = {
  id: number;
  name: string | null;
  url: string | null;
};

type Guide = {
  id: number;
  name: string;
};

export default function KpiSettingsIndicatorIdIDContent({
  id,
  main,
  sub,
  employees,
  programs,
}: {
  id: string;
  main: Main[];
  sub: Sub[];
  programs: { id: number; name: string }[];
  employees: {
    id: number;
    first_name: string | null;
    last_name: string | null;
  }[];
}) {
  const [inputRef, setInputRef] = useState<Reference>({
    id: 0,
    name: null,
    url: null,
  });
  const [reference, setReference] = useState<Reference[]>([]);
  const [inputGuide, setInputGuide] = useState<Guide>({
    id: 0,
    name: "",
  });
  const [guide, setGuide] = useState<Guide[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<
    number | undefined
  >();
  const [inputEmployee, setInputEmployee] = useState<Employee[]>([]);
  const [selectedEmployeeProgram, setSelectedEmployeeProgram] = useState(1);
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  const form = useForm<Form>({
    defaultValues: {
      mainid: 0,
      subid: 0,
      name: "",
      resource: "",
      period: undefined,
      dividend: "",
      divisor: "",
      condition: "",
      target: 0,
      unit: "",
      isActive: false,
    },
  });

  useEffect(() => {
    handleFetchData();
  }, [id]);

  const handleFetchData = () => {
    Promise.all([
      fetchDataIndicatorById(id),
      fetchDataIndicatorReference(id),
      fetchDataIndicatorGuide(id),
      fetchDataEmployeeById(id),
      fetchDataIndicatorProgram(id),
    ]).then(([data, reference, guide, employee, indicatorPrograms]) => {
      setSelectedPrograms(indicatorPrograms);
      form.reset({
        mainid: data?.mainid,
        subid: data?.subid ?? 0,
        name: data?.name,
        resource: data?.resource,
        period: data?.period,
        dividend: data?.dividend,
        divisor: data?.divisor,
        condition: data?.condition,
        target: data?.target,
        unit: data?.unit,
        isActive: data?.isActive,
      });

      setReference(reference);
      setGuide(guide);
      setInputEmployee(employee);
      setLoading(false);
    });
  };

  const handleEdit = (data: Form) => {
    setLoading(true);
    startTransition(async () => {
      const res = await updateIndicator(
        data,
        reference,
        guide,
        inputEmployee,
        Number(id),
        selectedPrograms,
      );
      if (res?.errors) {
        setLoading(false);
        return Object.entries(res.errors).forEach(([fieldName, messages]) => {
          form.setError(fieldName as keyof typeof data, {
            message: messages?.[0],
          });
        });
      }
      if (res.status === true) {
        toast.success(res.messages);
        handleFetchData();
      } else {
        toast.error(res.messages);
      }
    });
  };

  const handleAddReference = () => {
    setReference((prev) => [...prev, inputRef]);
    setInputRef({ id: 0, name: null, url: null });
  };

  const handleDeleteReference = (index: number) => {
    setReference(reference.filter((_, i) => i !== index));
  };

  const handleAddGuide = () => {
    setGuide((prev) => [...prev, inputGuide]);
    setInputGuide({ id: 0, name: "" });
  };

  const handleDeleteGuide = (index: number) => {
    setGuide(guide.filter((_, i) => i !== index));
  };

  const handleAddUser = () => {
    const find = employees.find((item) => item.id === selectedEmployee);
    const exists = inputEmployee.some(
      (item) =>
        item.staff?.id === selectedEmployee &&
        item.programid === selectedEmployeeProgram,
    );
    if (find && !exists) {
      setInputEmployee((prev) => [
        ...prev,
        { staff: find, programid: selectedEmployeeProgram },
      ]);
    }
    setSelectedEmployee(undefined);
  };

  // หลักสูตรที่ติ๊กไว้ = ตัวเลือกหลักสูตรของผู้รับผิดชอบ
  const tickedPrograms = programs.filter((p) =>
    selectedPrograms.includes(p.id),
  );

  // เอาหลักสูตรออก = เอาผู้รับผิดชอบของหลักสูตรนั้นออกด้วย
  const handleProgramsChange = (value: number[]) => {
    setSelectedPrograms(value);
    setInputEmployee((prev) =>
      prev.filter(
        (item) => item.programid === 1 || value.includes(item.programid),
      ),
    );
    if (!value.includes(selectedEmployeeProgram)) {
      setSelectedEmployeeProgram(1);
    }
  };

  const handleDeleteUser = (index: number) => {
    setInputEmployee(inputEmployee.filter((_, i) => i !== index));
  };

  return (
    <form id="edit" onSubmit={form.handleSubmit(handleEdit)}>
      <FieldSet>
        <FieldGroup>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="mainid"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>หัวข้อหลัก</FieldLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="หัวข้อหลัก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>หัวข้อหลัก</SelectLabel>
                        {main.map((x) => (
                          <SelectItem key={x.id} value={x.id.toString()}>
                            {x.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="subid"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex justify-between">
                    <FieldLabel>หัวข้อย่อย</FieldLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-auto"
                      onClick={() => {
                        form.setValue("subid", 0);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <Select
                    value={field.value.toString()}
                    onValueChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="หัวข้อย่อย" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>หัวข้อย่อย</SelectLabel>
                        {sub.map((x) => (
                          <SelectItem key={x.id} value={x.id.toString()}>
                            {x.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>ชื่อตัวชี้วัด</FieldLabel>
                  <Input
                    {...field}
                    placeholder="ชื่อตัวชี้วัด"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="resource"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>ข้อมูลที่ต้องเก็บ</FieldLabel>
                  <Input
                    {...field}
                    placeholder="ข้อมูลที่ต้องเก็บ"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="period"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>รอบเวลา</FieldLabel>
                  <Select
                    // period เริ่มเป็น undefined ก่อนโหลดข้อมูล: "" ให้ Select เป็น controlled ตลอด
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="รอบเวลา" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>รอบเวลา</SelectLabel>
                        <SelectItem value="SEMESTER">รายภาคการศึกษา</SelectItem>
                        <SelectItem value="ANNUAL">รายปี</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="isActive"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>สถานะ</FieldLabel>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    <Label htmlFor="active">
                      {field.value ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </Label>
                  </div>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Controller
              name="dividend"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>ตัวตั้ง</FieldLabel>
                  <Input
                    {...field}
                    placeholder="ตัวตั้ง"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="divisor"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>ตัวหาร</FieldLabel>
                  <Input
                    {...field}
                    placeholder="ตัวหาร"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Controller
              name="condition"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>เงื่อนไข</FieldLabel>
                  <Select
                    value={field.value.toString()}
                    onValueChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เงื่อนไข" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>เงื่อนไข</SelectLabel>
                        <SelectItem value=">">มากกว่า</SelectItem>
                        <SelectItem value="<">น้อยกว่า</SelectItem>
                        <SelectItem value="=">เท่ากับ</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="target"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>ค่าที่ต้องการ</FieldLabel>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="ค่าที่ต้องการ"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="unit"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>หน่วย</FieldLabel>
                  <Input
                    {...field}
                    placeholder="หน่วย"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.error && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>
          <ProgramChecklist
            programs={programs}
            value={selectedPrograms}
            onChange={handleProgramsChange}
          />
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>ข้อมูลอ้างอิง</FieldLabel>
              <Input
                placeholder="ข้อมูลอ้างอิง"
                value={inputRef?.name || ""}
                onChange={(e) =>
                  setInputRef((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel>Link URL</FieldLabel>
              <Input
                placeholder="Link URL"
                value={inputRef?.url || ""}
                onChange={(e) =>
                  setInputRef((prev) => ({
                    ...prev,
                    url: e.target.value,
                  }))
                }
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                size={"sm"}
                className="w-full sm:w-20"
                onClick={() => handleAddReference()}
              >
                <Plus />
                เพิ่ม
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>ข้อมูลอ้างอิง</TableHead>
                  <TableHead>Link URL</TableHead>
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Array.from({ length: 4 }).map((_, colIndex) => (
                          <TableCell key={colIndex}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : reference.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.url}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant={"ghost"}
                            size={"sm"}
                            onClick={() => handleDeleteReference(index)}
                          >
                            <Trash2 className="text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          <Separator />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field>
              <FieldLabel>แนวทางการปฎิบัติ</FieldLabel>
              <Input
                placeholder="แนวทางการปฎิบัติ"
                value={inputGuide?.name || ""}
                onChange={(e) =>
                  setInputGuide((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
              />
            </Field>
            <div className="flex items-end">
              <Button
                type="button"
                size={"sm"}
                className="w-full sm:w-20"
                onClick={() => handleAddGuide()}
              >
                <Plus />
                เพิ่ม
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>แนวทางการปฎิบัติ</TableHead>
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Array.from({ length: 3 }).map((_, colIndex) => (
                          <TableCell key={colIndex}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : guide.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant={"ghost"}
                            size={"sm"}
                            onClick={() => handleDeleteGuide(index)}
                          >
                            <Trash2 className="text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            <div className="w-full sm:w-1/2 space-y-2 gap-2">
              <Field>
                <FieldLabel>ผู้รับผิดชอบ</FieldLabel>
                <Select
                  value={selectedEmployee?.toString() ?? ""}
                  onValueChange={(value) => setSelectedEmployee(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>ผู้รับผิดชอบ</SelectLabel>
                      {employees.map((item) => (
                        <SelectItem
                          key={item?.id ?? 0}
                          value={item?.id.toString() ?? "0"}
                        >
                          {item.first_name ?? ""} {item.last_name ?? ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {tickedPrograms.length > 0 && (
              <div className="w-full sm:w-1/4">
                <ProgramSelect
                  programs={tickedPrograms}
                  value={selectedEmployeeProgram}
                  onChange={setSelectedEmployeeProgram}
                />
              </div>
            )}
            <div className="flex items-end">
              <Button
                type="button"
                className="w-full sm:w-20"
                onClick={() => handleAddUser()}
              >
                <Plus />
                เพิ่ม
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>ผู้รับผิดชอบ</TableHead>
                  {tickedPrograms.length > 0 && <TableHead>หลักสูตร</TableHead>}
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {Array.from({ length: 3 }).map((_, colIndex) => (
                          <TableCell key={colIndex}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : inputEmployee.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          {item.staff?.first_name ?? ""}{" "}
                          {item.staff?.last_name ?? ""}
                        </TableCell>
                        {tickedPrograms.length > 0 && (
                          <TableCell>
                            {programLabel(programs, item.programid)}
                          </TableCell>
                        )}
                        <TableCell>
                          <Button
                            type="button"
                            variant={"ghost"}
                            size={"sm"}
                            onClick={() => handleDeleteUser(index)}
                          >
                            <Trash2 className="text-rose-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
          <Button type="submit" disabled={pending}>
            <Save />
            {pending ? <Spinner /> : "บันทึก"}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
