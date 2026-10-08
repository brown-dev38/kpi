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
import { useSearchParams } from "next/navigation";
import { useEffect, useTransition } from "react";
import { toast } from "sonner";
import { createAnswerIndicator } from "./actions";
import { Spinner } from "@/components/ui/spinner";

type Data = {
  name: string;
  resource: string;
  period: string;
  condition: string;
  target: number;
  unit: string;
  dividend: string;
  divisor: string;
  kpiMain: {
    name: string;
  } | null;
  kpiSub: {
    name: string;
  } | null;
  kpiIndicatorGuide: {
    id: number;
    name: string;
  }[];
  kpiIndicatorRefs: {
    id: number;
    name: string;
    url: string;
  }[];
  kpiIndicatorUser: {
    programid: number;
    program: { name: string };
    staff: {
      id: number;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }[];
  answers: {
    semester: number;
    programid: number;
    programName: string;
    dividend: number | null;
    divisor: number | null;
  }[];
};

type Form = {
  semester: number | null;
  answers: {
    programid: number;
    dividend: number | null;
    divisor: number | null;
  }[];
};

export default function KpiRegisterIndicatorDetail({
  data,
  indicator,
  setSelectedIndicator,
  onAnswered,
}: {
  data: Data | null;
  indicator: number;
  setSelectedIndicator: (indicatorid: number) => void;
  onAnswered: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const searchParams = useSearchParams();
  const year = Number(searchParams.get("year"));

  const form = useForm<Form>({
    defaultValues: { semester: null, answers: [] },
  });

  // รายปี = semester 0; รายภาคต้องเลือกภาคก่อนจึงแสดงค่าเดิมของภาคนั้น
  const semester = form.watch("semester");
  const currentSemester =
    data?.period === "SEMESTER" ? Number(semester ?? 0) : 0;
  const currentAnswers = (data?.answers ?? []).filter(
    (a) => a.semester === currentSemester,
  );

  useEffect(() => {
    form.reset({ semester: null, answers: [] });
  }, [data]);

  useEffect(() => {
    form.setValue(
      "answers",
      currentAnswers.map((a) => ({
        programid: a.programid,
        dividend: a.dividend,
        divisor: a.divisor,
      })),
    );
  }, [data, currentSemester]);

  const handleSubmit = (data: Form) => {
    startTransition(async () => {
      const res = await createAnswerIndicator({ ...data, year }, indicator);

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
        <div className=" w-full sm:w-1/2 space-y-2 mb-4">
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
        {data?.kpiIndicatorRefs.map((x) => (
          <span key={x.id} className="text-sm pl-4">
            -{" "}
            <a href={x.url} target="_blank" rel="noopener noreferrer">
              {x.name}
            </a>{" "}
          </span>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col w-full gap-2">
        <Label className="text-sm font-semibold">แนวทางปฏิบัติ</Label>
        {data?.kpiIndicatorGuide.map((x) => (
          <span key={x.id} className="text-sm pl-4">
            - {x.name}
          </span>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col w-full gap-2">
        <Label className="text-sm font-semibold">ผู้รับผิดชอบ</Label>
        {data?.kpiIndicatorUser.map((x) => (
          <span key={`${x.staff?.id}:${x.programid}`} className="text-sm pl-4">
            - {x.staff?.first_name} {x.staff?.last_name}
            {x.programid !== 1 && ` (${x.program.name})`}
          </span>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col w-full gap-2">
        <Label className="text-sm font-semibold">ลงข้อมูล</Label>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <FieldSet>
            <FieldGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data?.period === "SEMESTER" && (
                  <Controller
                    name="semester"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm">ภาคเรียน:</Label>
                        <Select
                          value={field.value?.toString() ?? ""}
                          onValueChange={field.onChange}
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="เลือกภาคเรียน" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>ภาคเรียน</SelectLabel>
                              <SelectItem value="1">ภาคเรียนที่ 1</SelectItem>
                              <SelectItem value="2">ภาคเรียนที่ 2</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                )}
              </div>
              {currentAnswers.map((a, i) => (
                <div key={a.programid} className="flex flex-col gap-2">
                  {a.programName && (
                    <Label className="text-sm font-semibold">
                      {a.programName}
                    </Label>
                  )}
                  <Controller
                    name={`answers.${i}.dividend`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm">
                          ตัวตั้ง: {data?.dividend}
                        </Label>
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
                  <Controller
                    name={`answers.${i}.divisor`}
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <Label className="text-sm">
                          ตัวหาร: {data?.divisor}
                        </Label>
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
                </div>
              ))}
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
