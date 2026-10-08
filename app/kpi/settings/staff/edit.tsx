"use client";

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
import { useTransition, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Field, FieldGroup, FieldSet } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateStaff } from "./actions";
import { toast } from "sonner";

type StaffRow = {
  id: number;
  isActive: boolean;
  staffDetail: {
    id: number;
    first_name: string | null;
    last_name: string | null;
    department: { name: string } | null;
    position: { name: string } | null;
  } | null;
};

type Form = {
  id: number;
  isActive: boolean;
};

const valuesForm: Form = { id: 0, isActive: false };

export default function KpiSettingsStaffEdit({
  open,
  setOpen,
  edit,
  setEdit,
  reload,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  edit: StaffRow | null;
  setEdit: (edit: StaffRow | null) => void;
  reload: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({ defaultValues: valuesForm });

  useEffect(() => {
    if (edit) {
      form.reset({ id: edit.id, isActive: edit.isActive });
    }
  }, [edit]);

  const handleUpdate = (data: Form) => {
    startTransition(async () => {
      const res = await updateStaff(data);
      if (res?.errors) {
        return Object.entries(res.errors).forEach(([fieldName, messages]) => {
          form.setError(fieldName as keyof Form, { message: messages?.[0] });
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
        <form id="edit-staff" onSubmit={form.handleSubmit(handleUpdate)}>
          <DialogHeader>
            <DialogTitle>แก้ไขเจ้าหน้าที่</DialogTitle>
            <DialogDescription>
              {edit?.staffDetail?.first_name ?? ""}{" "}
              {edit?.staffDetail?.last_name ?? ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FieldSet>
              <FieldGroup>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="staff-active"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="staff-active">
                          {field.value ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                        </Label>
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
            <Button type="submit" form="edit-staff" disabled={pending}>
              <Save />
              {pending ? <Spinner /> : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
