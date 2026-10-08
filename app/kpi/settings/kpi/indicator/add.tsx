"use client";

import { Button } from "@/components/ui/button";
import { Plus, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useState, useTransition } from "react";
import { createIndicatorMain } from "./actions";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { period } from "@/lib/generated/prisma/enums";

type Form = {
  mainid: number;
  subid: number;
  name: string;
  resource: string;
  reference: string;
  period: period;
  dividend: string;
  divisor: string;
  condition: string;
  target: number;
  unit: string;
};

const valuesForm: Form = {
  mainid: 0,
  subid: 0,
  name: "",
  resource: "",
  reference: "",
  period: period.SEMESTER,
  dividend: "",
  divisor: "",
  condition: "",
  target: 0,
  unit: "",
};

export default function KpiSettingsKPIIndicatorAdd({
  main,
  sub,
}: {
  main: { id: number; name: string }[];
  sub: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({
    defaultValues: valuesForm,
  });

  const handleSubmit = (data: Form) => {
    startTransition(async () => {
      const res = await createIndicatorMain(data);
      if (res?.errors) {
        return Object.entries(res.errors).forEach(([fieldName, messages]) => {
          form.setError(fieldName as keyof typeof data, {
            message: messages?.[0],
          });
        });
      }

      if (res.status === true) {
        toast.success(res.messages);
        form.reset();
        setOpen(false);
      } else {
        toast.error(res.messages);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          เพิ่มตัวชี้วัด
        </Button>
      </DialogTrigger>
      <DialogContent
        onPointerDownOutside={() => form.reset(valuesForm)}
        onEscapeKeyDown={() => form.reset(valuesForm)}
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
      >
        <form id="create" onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>เพิ่มตัวชี้วัด</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลให้ครบถ้วน</DialogDescription>
          </DialogHeader>
          <div className="py-4">
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
                        <FieldLabel>หัวข้อย่อย</FieldLabel>
                        <Select
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
                    name="reference"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>ข้อมูลอ้างอิง</FieldLabel>
                        <Input
                          {...field}
                          placeholder="ข้อมูลอ้างอิง"
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
                        <FieldLabel>รอบวัด</FieldLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="รอบวัด" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>รอบวัด</SelectLabel>
                              <SelectItem value={period.SEMESTER}>รายภาคเรียน</SelectItem>
                              <SelectItem value={period.ANNUAL}>รายปี</SelectItem>
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
              </FieldGroup>
            </FieldSet>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                form.reset(valuesForm);
                setOpen(false);
              }}
            >
              <X />
              ยกเลิก
            </Button>
            <Button type="submit" form="create" disabled={pending}>
              <Save />
              {pending ? <Spinner /> : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
