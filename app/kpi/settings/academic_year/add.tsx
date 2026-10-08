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
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useState, useTransition } from "react";
import { createAcademicYear } from "./actions";
import { toast } from "sonner";

type Form = {
  year: number;
  semester: number;
  description: string;
};

const valuesForm: Form = {
  year: "" as unknown as number,
  semester: "" as unknown as number,
  description: "",
};

export default function KpiSettingsAcademicYearAdd() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({
    defaultValues: valuesForm,
  });

  const handleSubmit = (data: Form) => {
    startTransition(async () => {
      const res = await createAcademicYear({
        year: Number(data.year),
        semester: Number(data.semester),
        description: data.description,
      });
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
          เพิ่มปีการศึกษา
        </Button>
      </DialogTrigger>
      <DialogContent
        onPointerDownOutside={() => form.reset(valuesForm)}
        onEscapeKeyDown={() => form.reset(valuesForm)}
        showCloseButton={false}
      >
        <form id="create" onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>เพิ่มปีการศึกษา</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลให้ครบถ้วน</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FieldSet>
              <FieldGroup>
                <Controller
                  name="year"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>ปีการศึกษา</FieldLabel>
                      <Input
                        {...field}
                        type="number"
                        placeholder="ปีการศึกษา เช่น 2567"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="semester"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>ภาคการศึกษา</FieldLabel>
                      <Input
                        {...field}
                        type="number"
                        placeholder="ภาคการศึกษา เช่น 1, 2, 3"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="description"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>คำอธิบาย</FieldLabel>
                      <Textarea
                        {...field}
                        placeholder="คำอธิบายเพิ่มเติม (ถ้ามี)"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
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
