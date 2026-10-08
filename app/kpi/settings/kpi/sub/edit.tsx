import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, X } from "lucide-react";
import { useTransition, useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
  FieldSet,
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateIndicatorSub } from "./actions";
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

type Data = {
  id: number;
  name: string;
  isActive: boolean;
  kpiMain: {
    id: number;
    name: string;
  } | null;
};

type Main = {
  id: number;
  name: string;
};

const valuesForm: {
  id: number;
  name: string;
  mainid: number;
  isActive: boolean;
} = {
  id: 0,
  name: "",
  mainid: 0,
  isActive: false,
};

export default function KpiSettingsIndicatorSubEdit({
  open,
  setOpen,
  edit,
  setEdit,
  reload,
  main,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  edit: {
    id: number;
    name: string;
    kpiMain: {
      id: number;
      name: string;
    } | null;
    isActive: boolean;
  } | null;
  setEdit: (edit: Data | null) => void;
  reload: () => void;
  main: Main[];
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<{
    id: number;
    name: string;
    mainid: number;
    isActive: boolean;
  }>();

  useEffect(() => {
    if (edit) {
      form.reset({
        id: edit.id,
        name: edit.name,
        mainid: edit.kpiMain?.id,
        isActive: edit.isActive,
      });
    }
  }, [edit]);

  const handleUpdate = (data: {
    id: number;
    name: string;
    mainid: number;
    isActive: boolean;
  }) => {
    startTransition(async () => {
      const res = await updateIndicatorSub(data);
      if (res?.errors) {
        return Object.entries(res.errors).forEach(([fieldName, messages]) => {
          form.setError(fieldName as keyof typeof data, {
            message: messages?.[0],
          });
        });
      }
      if (res.status === true) {
        toast.success(res.messages);
        setOpen(false);
        setEdit(null);
        reload();
      } else {
        toast.error(res.messages);
      }
    });
  };

  const handleClose = () => {
    form.reset(valuesForm);
    setOpen(false);
    setEdit(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onInteractOutside={handleClose}
        onEscapeKeyDown={handleClose}
        showCloseButton={false}
      >
        <form id="edit" onSubmit={form.handleSubmit(handleUpdate)}>
          <DialogHeader>
            <DialogTitle>แก้ไขหัวข้อย่อย</DialogTitle>
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
                      <FieldLabel>ชื่อหัวข้อย่อย</FieldLabel>
                      <Input
                        {...field}
                        placeholder="ชื่อหัวข้อย่อย"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />{" "}
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
                          </SelectGroup>
                          {main.map((x) => (
                            <SelectItem key={x.id} value={x.id.toString()}>
                              {x.name}
                            </SelectItem>
                          ))}
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
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </div>
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              <X />
              ยกเลิก
            </Button>
            <Button type="submit" form="edit" disabled={pending}>
              <Save />
              {pending ? <Spinner /> : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
