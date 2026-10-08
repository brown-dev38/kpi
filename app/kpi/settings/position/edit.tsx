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
import { updatePosition } from "./actions";
import { toast } from "sonner";

type Data = {
  id: number;
  name: string;
  isActive: boolean;
};

const valuesForm: Data = {
  id: 0,
  name: "",
  isActive: false,
};

export default function KpiSettingsPositionEdit({
  open,
  setOpen,
  edit,
  setEdit,
  reload,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  edit: Data | null;
  setEdit: (edit: Data | null) => void;
  reload: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<Data>();

  useEffect(() => {
    if (edit) {
      form.reset(edit);
    }
  }, [edit]);

  const handleUpdate = (data: Data) => {
    startTransition(async () => {
      const res = await updatePosition(data);
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
            <DialogTitle>แก้ไขตำแหน่ง</DialogTitle>
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
                      <FieldLabel>ชื่อตำแหน่ง</FieldLabel>
                      <Input
                        {...field}
                        placeholder="ชื่อตำแหน่ง"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />{" "}
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
