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
import { updateUser } from "./actions";
import { toast } from "sonner";
import { unstable_rethrow } from "next/navigation";
import { fetchDataUserById } from "./actions";
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
import { ChevronDown } from "lucide-react";

type Data = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  cid: string | null;
  roleid: number;
  depid: number | null;
  posid: number | null;
  isActive: boolean;
};

const valuesForm: Data = {
  id: 0,
  first_name: "",
  last_name: "",
  username: "",
  email: "",
  password: "",
  passwordConfirm: "",
  cid: "",
  depid: 0,
  roleid: 0,
  posid: 0,
  isActive: false,
};

export default function KpiSettingsUsersEdit({
  open,
  setOpen,
  edit,
  setEdit,
  reload,
  department,
  position,
  role,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  edit: number | null;
  setEdit: (edit: number | null) => void;
  reload: () => void;
  department: { id: number; name: string }[];
  position: { id: number; name: string }[];
  role: { id: number; name: string }[];
}) {
  const [selectDep, setSelectDep] = useState<boolean>(false);
  const [selectPos, setSelectPos] = useState<boolean>(false);
  const [selectRole, setSelectRole] = useState<boolean>(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<Data>();

  useEffect(() => {
    if (edit) {
      Promise.all([fetchDataUserById(edit)]).then(([data]) => {
        if (!data) return;
        form.reset({
          id: data.id,
          first_name: data.first_name ?? "",
          last_name: data.last_name ?? "",
          username: data.username,
          email: data.email ?? "",
          password: "",
          passwordConfirm: "",
          cid: data.cid ?? "",
          roleid: data.roleid ?? 0,
          depid: data.depid,
          posid: data.posid,
          isActive: data.isActive,
        });
      });
    }
  }, [edit]);

  const handleUpdate = (data: Data) => {
    startTransition(async () => {
      try {
        form.clearErrors();
        const res = await updateUser(data);
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
      } catch (error) {
        // ให้ redirect จาก server action (หมดสิทธิ์/หมด session) ทำงานต่อ ไม่ถูกกลืนเป็น toast
        unstable_rethrow(error);
        console.error("Unable to submit user credentials", error);
        toast.error(
          "ไม่สามารถติดต่อ Server Action ได้ กรุณารีเฟรชหน้าและลองใหม่อีกครั้ง",
        );
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
        className="max-h-[90vh] overflow-x-hidden sm:max-w-3xl"
      >
        <form id="edit" onSubmit={form.handleSubmit(handleUpdate)}>
          <DialogHeader>
            <DialogTitle>แก้ไขพนักงาน</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลให้ครบถ้วน</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FieldSet>
              <FieldGroup>
                <div className="grid flex-cols-1 sm:grid-cols-2 gap-4">
                  <Controller
                    name="username"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>ชื่อผู้ใช้งาน</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="ชื่อผู้ใช้งาน"
                          aria-invalid={fieldState.invalid}
                          readOnly
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="cid"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>รหัสประจำตัวประชาชน</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="รหัสประจำตัวประชาชน"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>อีเมลสำหรับเข้าสู่ระบบ</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="email"
                          autoComplete="off"
                          placeholder="name@example.com"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="password"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>กำหนดรหัสผ่านใหม่</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="password"
                          autoComplete="new-password"
                          placeholder="เว้นว่างหากไม่ต้องการเปลี่ยน"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="passwordConfirm"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>ยืนยันรหัสผ่านใหม่</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="password"
                          autoComplete="new-password"
                          placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="first_name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>ชื่อ</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="ชื่อ"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="last_name"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>นามสกุล</FieldLabel>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="นามสกุล"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.error && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </div>
                <div className="grid flex-cols-1 sm:grid-cols-3 gap-4">
                  <Controller
                    name="depid"
                    control={form.control}
                    render={({ field, fieldState }) => {
                      const current = field.value ?? "";
                      return (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>หน่วยงาน</FieldLabel>
                          <Popover open={selectDep} onOpenChange={setSelectDep}>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                role="combobox"
                                aria-expanded={selectDep}
                                className="w-full justify-between"
                              >
                                {form.getValues("depid")
                                  ? department?.find(
                                      (x) => x.id === form.getValues("depid"),
                                    )?.name
                                  : "กรุณาเลือกแผนก"}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <Command>
                                <CommandInput
                                  placeholder="กรุณาเลือกแผนก"
                                  className="h-9"
                                />
                                <CommandList
                                  onWheelCapture={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <CommandEmpty>ไม่มีแผนกที่ระบุ</CommandEmpty>
                                  <CommandGroup heading="แผนก">
                                    {department?.map((x) => (
                                      <CommandItem
                                        key={x.id}
                                        value={x.name ?? ""}
                                        onSelect={() => {
                                          field.onChange(
                                            x.id === current ? current : x.id,
                                          );
                                          setSelectDep(false);
                                        }}
                                      >
                                        {x.name}
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
                  <Controller
                    name="posid"
                    control={form.control}
                    render={({ field, fieldState }) => {
                      const current = field.value ?? "";
                      return (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>ตำแหน่ง</FieldLabel>
                          <Popover open={selectPos} onOpenChange={setSelectPos}>
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                role="combobox"
                                aria-expanded={selectPos}
                                className="w-full justify-between"
                              >
                                {form.getValues("posid")
                                  ? position?.find(
                                      (x) => x.id === form.getValues("posid"),
                                    )?.name
                                  : "กรุณาเลือกตำแหน่ง"}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <Command>
                                <CommandInput
                                  placeholder="กรุณาเลือกตำแหน่ง"
                                  className="h-9"
                                />
                                <CommandList
                                  onWheelCapture={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <CommandEmpty>
                                    ไม่มีตำแหน่งที่ระบุ
                                  </CommandEmpty>
                                  <CommandGroup heading="ตำแหน่ง">
                                    {position?.map((x) => (
                                      <CommandItem
                                        key={x.id}
                                        value={x.name ?? ""}
                                        onSelect={() => {
                                          field.onChange(
                                            x.id === current ? current : x.id,
                                          );
                                          setSelectPos(false);
                                        }}
                                      >
                                        {x.name}
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
                  <Controller
                    name="roleid"
                    control={form.control}
                    render={({ field, fieldState }) => {
                      const current = field.value ?? "";
                      return (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>สิทธิ์การใช้งาน</FieldLabel>
                          <Popover
                            open={selectRole}
                            onOpenChange={setSelectRole}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant={"outline"}
                                role="combobox"
                                aria-expanded={selectRole}
                                className="w-full justify-between"
                              >
                                {form.getValues("roleid")
                                  ? role?.find(
                                      (x) => x.id === form.getValues("roleid"),
                                    )?.name
                                  : "กรุณาเลือกสิทธิ์การใช้งาน"}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent>
                              <Command>
                                <CommandInput
                                  placeholder="กรุณาเลือกสิทธิ์การใช้งาน"
                                  className="h-9"
                                />
                                <CommandList
                                  onWheelCapture={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <CommandEmpty>
                                    ไม่มีสิทธิ์การใช้งานที่ระบุ
                                  </CommandEmpty>
                                  <CommandGroup heading="สิทธิ์การใช้งาน">
                                    {role?.map((x) => (
                                      <CommandItem
                                        key={x.id}
                                        value={x.name ?? ""}
                                        onSelect={() => {
                                          field.onChange(
                                            x.id === current ? current : x.id,
                                          );
                                          setSelectRole(false);
                                        }}
                                      >
                                        {x.name}
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
                </div>
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
