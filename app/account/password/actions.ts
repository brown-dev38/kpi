"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import {
  changeUserPassword,
  setInitialPasswordFromMicrosoft,
} from "@/lib/auth/user";

export type ChangePasswordState = {
  message?: string;
  errors?: Record<string, string[]>;
};

const schema = z
  .object({
    currentPassword: z.string().max(128, "รหัสผ่านปัจจุบันยาวเกินไป"),
    newPassword: z
      .string()
      .min(8, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร")
      .max(128, "รหัสผ่านใหม่ยาวเกินไป"),
    confirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่านใหม่"),
  })
  .superRefine((value, context) => {
    if (value.newPassword !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "การยืนยันรหัสผ่านไม่ตรงกัน",
      });
    }
    if (
      value.currentPassword &&
      value.currentPassword === value.newPassword
    ) {
      context.addIssue({
        code: "custom",
        path: ["newPassword"],
        message: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน",
      });
    }
  });

export const changePasswordAction = async (
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const canSetInitialPassword =
    session.user.authProvider === "microsoft-entra-id" &&
    !session.user.hasPassword;

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  if (!canSetInitialPassword && !parsed.data.currentPassword) {
    return {
      errors: { currentPassword: ["กรุณากรอกรหัสผ่านปัจจุบัน"] },
    };
  }

  if (canSetInitialPassword) {
    let created = false;
    try {
      created = await setInitialPasswordFromMicrosoft({
        userId: Number(session.user.id),
        newPassword: parsed.data.newPassword,
      });
    } catch (error) {
      console.error("Unable to set initial credential password", error);
      return {
        message: "ไม่สามารถกำหนดรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง",
      };
    }

    if (!created) {
      return {
        message:
          "ไม่สามารถกำหนดรหัสผ่านได้ บัญชีอาจมีรหัสผ่านอยู่แล้ว กรุณารีเฟรชหน้า",
      };
    }
    redirect("/kpi");
  }

  let changed = false;
  try {
    changed = await changeUserPassword({
      userId: Number(session.user.id),
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });
  } catch (error) {
    console.error("Unable to change credential password", error);
    return { message: "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง" };
  }

  if (!changed) return { message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  redirect("/kpi");
};
