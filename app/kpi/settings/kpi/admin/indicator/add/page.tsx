"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import Link from "next/link";
import {
  createAdminIndicator,
  fetchDataAdminMain,
  fetchDataAdminIndicatorUser,
} from "./actions";
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
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

type Form = {
  mainid: number;
  name: string;
  resource: string;
  period: string;
  dividend: string;
  divisor: string;
  condition: string;
  target: number;
  unit: string;
};

type Main = { id: number; name: string };
type User = { id: number; first_name: string | null; last_name: string | null };
type Reference = { name: string | null; url: string | null };
type Guide = { name: string };

const defaultValues: Form = {
  mainid: 0,
  name: "",
  resource: "",
  period: "",
  dividend: "",
  divisor: "",
  condition: "",
  target: 0,
  unit: "",
};

export default function KpiSettingsAdminIndicatorAddPage() {
  const [main, setMain] = useState<Main[]>([]);
  const [user, setUser] = useState<User[]>([]);
  const [reference, setReference] = useState<Reference[]>([]);
  const [inputRef, setInputRef] = useState<Reference>({ name: null, url: null });
  const [guide, setGuide] = useState<Guide[]>([]);
  const [inputGuide, setInputGuide] = useState<Guide>({ name: "" });
  const [selectedUser, setSelectedUser] = useState<number | undefined>();
  const [inputUser, setInputUser] = useState<User[]>([]);
  const [pending, startTransition] = useTransition();

  const form = useForm<Form>({ defaultValues });

  useEffect(() => {
    Promise.all([fetchDataAdminMain(), fetchDataAdminIndicatorUser()]).then(
      ([main, user]) => {
        setMain(main);
        setUser(user);
      }
    );
  }, []);

  const handleSubmit = (data: Form) => {
    startTransition(async () => {
      const res = await createAdminIndicator(data, inputUser, reference, guide);
      if (res?.errors) {
        return Object.entries(res.errors).forEach(([fieldName, messages]) => {
          form.setError(fieldName as keyof typeof data, {
            message: messages?.[0],
          });
        });
      }
      if (res.status === true) {
        toast.success(res.messages);
        form.reset(defaultValues);
        setInputUser([]);
        setInputRef({ name: null, url: null });
        setInputGuide({ name: "" });
        setReference([]);
        setGuide([]);
      } else {
        toast.error(res.messages);
      }
    });
  };

  const handleAddReference = () => {
    setReference((prev) => [...prev, inputRef]);
    setInputRef({ name: null, url: null });
  };

  const handleDeleteReference = (index: number) => {
    setReference((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddGuide = () => {
    setGuide((prev) => [...prev, inputGuide]);
    setInputGuide({ name: "" });
  };

  const handleDeleteGuide = (index: number) => {
    setGuide((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddUser = () => {
    const find = user.find((item) => item.id === selectedUser);
    if (find) setInputUser((prev) => [...prev, find]);
    setSelectedUser(undefined);
  };

  const handleDeleteUser = (index: number) => {
    setInputUser((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <main className="p-5">
      <Card>
        <CardHeader>
          <CardTitle>เพิ่มตัวชี้วัดบริหารทั่วไป</CardTitle>
          <CardDescription>กรุณากรอกข้อมูลให้ครบถ้วน</CardDescription>
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
          <form id="create" onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldSet>
              <FieldGroup>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="mainid"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>หัวข้อหลัก</FieldLabel>
                        <Select onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกหัวข้อหลัก" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>หัวข้อหลัก</SelectLabel>
                              {main.map((item) => (
                                <SelectItem key={item.id} value={item.id.toString()}>
                                  {item.name}
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
                          value={field.value}
                          onValueChange={field.onChange}
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกรอบเวลา" />
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
                        <FieldLabel>เป้าหมาย</FieldLabel>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          inputMode="decimal"
                          placeholder="เป้าหมาย"
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
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel>ข้อมูลอ้างอิง</FieldLabel>
                    <Input
                      placeholder="ข้อมูลอ้างอิง"
                      value={inputRef?.name || ""}
                      onChange={(e) =>
                        setInputRef((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Link URL</FieldLabel>
                    <Input
                      placeholder="Link URL"
                      value={inputRef?.url || ""}
                      onChange={(e) =>
                        setInputRef((prev) => ({ ...prev, url: e.target.value }))
                      }
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      size={"sm"}
                      className="w-full sm:w-20"
                      onClick={handleAddReference}
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
                      {reference.map((item, index) => (
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
                        setInputGuide((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      size={"sm"}
                      className="w-full sm:w-20"
                      onClick={handleAddGuide}
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
                      {guide.map((item, index) => (
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
                        value={selectedUser?.toString() ?? ""}
                        onValueChange={(value) => setSelectedUser(Number(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>ผู้รับผิดชอบ</SelectLabel>
                            {user.map((item) => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.first_name} {item.last_name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      className="w-full sm:w-20"
                      onClick={handleAddUser}
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
                        <TableHead>จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputUser.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            {item.first_name} {item.last_name}
                          </TableCell>
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
        </CardContent>
      </Card>
    </main>
  );
}
