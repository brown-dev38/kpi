"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  loginWithCredentials,
  type LoginState,
} from "@/app/login/actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="h-12 w-full shadow-lg shadow-primary/20" disabled={pending}>
      <LogIn />
      {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(
    loginWithCredentials,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="name@example.com"
          aria-invalid={Boolean(state.errors?.email)}
          required
          className="h-11"
        />
        {state.errors?.email?.[0] && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">รหัสผ่าน</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(state.errors?.password)}
          required
          className="h-11"
        />
        {state.errors?.password?.[0] && (
          <p className="text-sm text-destructive">
            {state.errors.password[0]}
          </p>
        )}
      </div>
      {state.message && (
        <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
