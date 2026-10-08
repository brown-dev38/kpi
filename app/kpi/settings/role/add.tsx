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
import { createRole } from "./actions";
import { toast } from "sonner";

type Form = {
  name: string;
};

const valuesForm: Form = {
  name: "",
};

export default function KpiSettingsRoleAdd() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({
    defaultValues: valuesForm,
  });

  const handleSubmit = (data: Form) => {
    startTransition(async () => {
      const res = await createRole(data);
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
          เพิ่มสิทธิ์
        </Button>
      </DialogTrigger>
      <DialogContent
        onPointerDownOutside={() => form.reset(valuesForm)}
        onEscapeKeyDown={() => form.reset(valuesForm)}
        showCloseButton={false}
      >
        <form id="create" onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>เพิ่มสิทธิ์</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลให้ครบถ้วน</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FieldSet>
              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>ชื่อสิทธิ์</FieldLabel>
                      <Input
                        {...field}
                        placeholder="ชื่อสิทธิ์"
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
