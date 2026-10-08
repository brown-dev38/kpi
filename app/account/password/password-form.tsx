"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePasswordAction,
  type ChangePasswordState,
} from "@/app/account/password/actions";

const initialState: ChangePasswordState = {};

function SubmitButton({ isInitialSetup }: { isInitialSetup: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending
        ? "กำลังบันทึก..."
        : isInitialSetup
          ? "กำหนดรหัสผ่าน"
          : "เปลี่ยนรหัสผ่าน"}
    </Button>
  );
}

export default function PasswordForm({
  isInitialSetup,
}: {
  isInitialSetup: boolean;
}) {
  const [state, formAction] = useActionState(changePasswordAction, initialState);
  const fields = [
    ...(!isInitialSetup
      ? [["currentPassword", "รหัสผ่านปัจจุบัน", "current-password"] as const]
      : []),
    ["newPassword", "รหัสผ่านใหม่", "new-password"],
    ["confirmPassword", "ยืนยันรหัสผ่านใหม่", "new-password"],
  ] as const;

  return (
    <form action={formAction} className="space-y-4">
      {fields.map(([name, label, autoComplete]) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>{label}</Label>
          <Input
            id={name}
            name={name}
            type="password"
            autoComplete={autoComplete}
            aria-invalid={Boolean(state.errors?.[name])}
            required
          />
          {state.errors?.[name]?.[0] && (
            <p className="text-sm text-destructive">
              {state.errors[name][0]}
            </p>
          )}
        </div>
      ))}
      {state.message && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}
      <SubmitButton isInitialSetup={isInitialSetup} />
    </form>
  );
}
