"use client";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Controller, useForm } from "react-hook-form";
import { Field, FieldError, FieldGroup, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { createAnswerResearch } from "./actions";
import { Spinner } from "@/components/ui/spinner";

type Data = {
  name: string;
  resource: string;
  period: string;
  condition: string;
  target: number;
  unit: string;
  dividend: string;
  divisor: string | null;
  answer: { dividend: number; divisor: number | null } | null;
  kpiResearchGuides: { id: number; name: string }[];
  kpiResearchRefs: { id: number; name: string; url: string }[];
  kpiResearchUsers: {
    staff: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[];
};

type Form = {
  dividend: number | null;
  divisor: number | null;
};

export default function KpiRegisterResearchDetail({
  data,
  fiscalYear,
  main,
  indicator,
  setSelectedIndicator,
  onAnswered,
}: {
  data: Data | null;
  fiscalYear: number;
  main: number;
  indicator: number;
  setSelectedIndicator: (indicatorid: number) => void;
  onAnswered: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const hasDivisor = Boolean(data?.divisor);

  const form = useForm<Form>({
    defaultValues: { dividend: null, divisor: null },
  });

  useEffect(() => {
    form.reset({
      dividend: data?.answer?.dividend ?? null,
      divisor: data?.answer?.divisor ?? null,
    });
  }, [data]);

  const handleSubmit = (formData: Form) => {
    startTransition(async () => {
      const res = await createAnswerResearch(
        {
          dividend: formData.dividend,
          divisor: hasDivisor ? formData.divisor : null,
          year: fiscalYear,
        },
        main,
        indicator,
      );

      if (res.status === true) {
        toast.success(res.messages);
        form.reset();
        setSelectedIndicator(0);
        onAnswered();
      } else {
        toast.error(res.messages);
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
      <div className="flex w-full justify-between gap-2 py-4 mb-4">
        <Label>รายละเอียด</Label>
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap w-full">
        <div className="w-full sm:w-1/2 space-y-2 mb-4">
          <Label className="text-sm font-semibold">ชื่อตัวชี้วัด:</Label>
          <span className="text-sm pl-4">- {data?.name}</span>
        </div>
        <div className="w-full sm:w-1/2 space-y-2 mb-4">
          <Label className="text-sm font-semibold">ข้อมูลที่ต้องเก็บ:</Label>
          <span className="text-sm pl-4">- {data?.resource}</span>
        </div>
        <div className="w-full sm:w-1/2 space-y-2 mb-4">
          <Label className="text-sm font-semibold">รอบวัด:</Label>
          <span className="text-sm pl-4">
            - {data?.period === "SEMESTER" ? "รายภาคการศึกษา" : "รายปี"}
          </span>
        </div>
        <div className="w-full sm:w-1/2">
          <Label className="text-sm font-semibold">เงื่อนไข:</Label>
          <span className="text-sm pl-4">
            {data?.condition}
            {data?.target}
            {data?.unit}
          </span>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col w-full gap-2">
        <Label className="text-sm font-semibold">แหล่งข้อมูลอ้างอิง</Label>
        {data?.kpiResearchRefs.map((x) => (
          <span key={x.id} className="text-sm pl-4">
            -{" "}
            <a href={x.url} target="_blank" rel="noopener noreferrer">
              {x.name}
            </a>
          </span>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col w-full gap-2">
        <Label className="text-sm font-semibold">แนวทางปฏิบัติ</Label>
        {data?.kpiResearchGuides.map((x) => (
          <span key={x.id} className="text-sm pl-4">
            - {x.name}
          </span>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col w-full gap-2">
        <Label className="text-sm font-semibold">ผู้รับผิดชอบ</Label>
        {data?.kpiResearchUsers.map((x) => (
          <span key={x.staff?.id} className="text-sm pl-4">
            - {x.staff?.first_name} {x.staff?.last_name}
          </span>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col w-full gap-2">
        <Label className="text-sm font-semibold">
          ลงข้อมูล (ปีงบประมาณ {fiscalYear})
        </Label>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldSet>
            <FieldGroup>
              <Controller
                name="dividend"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Label className="text-sm">ตัวตั้ง: {data?.dividend}</Label>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      aria-invalid={fieldState.invalid}
                      placeholder="กรุณากรอกตัวตั้ง"
                    />
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {hasDivisor && (
                <Controller
                  name="divisor"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <Label className="text-sm">ตัวหาร: {data?.divisor}</Label>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        aria-invalid={fieldState.invalid}
                        placeholder="กรุณากรอกตัวหาร"
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
              <Button type="submit" className="w-full" disabled={pending}>
                <Save />
                {pending ? <Spinner /> : "บันทึก"}
              </Button>
            </FieldGroup>
          </FieldSet>
        </form>
      </div>
    </div>
  );
}
