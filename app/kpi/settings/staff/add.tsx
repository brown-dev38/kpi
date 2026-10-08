"use client";

import { Button } from "@/components/ui/button";
import { Plus, Save, X, ChevronDown } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { useForm, Controller } from "react-hook-form";
import { Spinner } from "@/components/ui/spinner";
import { useState, useTransition } from "react";
import { createStaff } from "./actions";
import { toast } from "sonner";

type Employee = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  department: { name: string } | null;
  position: { name: string } | null;
};

type Form = {
  staffid: number;
};

const valuesForm: Form = { staffid: 0 };

export default function KpiSettingsStaffAdd({
  employees,
}: {
  employees: Employee[];
}) {
  const [open, setOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({ defaultValues: valuesForm });

  const handleSubmit = (formData: Form) => {
    startTransition(async () => {
      const res = await createStaff(formData);
      if (res?.errors) {
        return Object.entries(res.errors).forEach(([fieldName, messages]) => {
          form.setError(fieldName as keyof Form, { message: messages?.[0] });
        });
      }
      if (res.status === true) {
        toast.success(res.messages);
        form.reset(valuesForm);
        setOpen(false);
      } else {
        toast.error(res.messages);
      }
    });
  };

  const handleClose = () => {
    form.reset(valuesForm);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          เพิ่มเจ้าหน้าที่
        </Button>
      </DialogTrigger>
      <DialogContent
        onPointerDownOutside={handleClose}
        onEscapeKeyDown={handleClose}
        showCloseButton={false}
      >
        <form id="create-staff" onSubmit={form.handleSubmit(handleSubmit)}>
          <DialogHeader>
            <DialogTitle>เพิ่มเจ้าหน้าที่</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลให้ครบถ้วน</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FieldSet>
              <FieldGroup>
                <Controller
                  name="staffid"
                  control={form.control}
                  render={({ field, fieldState }) => {
                    const selected = employees.find((e) => e.id === field.value);
                    return (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>ชื่อเจ้าหน้าที่</FieldLabel>
                        <Popover open={selectOpen} onOpenChange={setSelectOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={selectOpen}
                              className="w-full justify-between"
                            >
                              {selected
                                ? `${selected.first_name ?? ""} ${selected.last_name ?? ""}`.trim()
                                : "กรุณาเลือกเจ้าหน้าที่"}
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0">
                            <Command>
                              <CommandInput placeholder="ค้นหาเจ้าหน้าที่" className="h-9" />
                              <CommandList onWheelCapture={(e) => e.stopPropagation()}>
                                <CommandEmpty>ไม่พบเจ้าหน้าที่</CommandEmpty>
                                <CommandGroup heading="เจ้าหน้าที่">
                                  {employees.map((e) => (
                                    <CommandItem
                                      key={e.id}
                                      value={`${e.first_name ?? ""} ${e.last_name ?? ""}`}
                                      onSelect={() => {
                                        field.onChange(e.id);
                                        setSelectOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span>{`${e.first_name ?? ""} ${e.last_name ?? ""}`.trim()}</span>
                                        {(e.department || e.position) && (
                                          <span className="text-xs text-muted-foreground">
                                            {[e.department?.name, e.position?.name]
                                              .filter(Boolean)
                                              .join(" · ")}
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
            </FieldSet>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose}>
              <X />
              ยกเลิก
            </Button>
            <Button type="submit" form="create-staff" disabled={pending}>
              <Save />
              {pending ? <Spinner /> : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
