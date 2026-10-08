"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { credentialsSchema } from "@/lib/auth/schema";

export type LoginState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

export const loginWithCredentials = async (
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> => {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/kpi",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับชั่วคราว" };
    }
    throw error;
  }
};

export const loginWithMicrosoft = async () => {
  await signIn("microsoft-entra-id", { redirectTo: "/kpi" });
};
