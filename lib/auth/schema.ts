import { z } from "zod";

export const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .max(191, "อีเมลยาวเกินไป")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
    .max(128, "รหัสผ่านยาวเกินไป"),
});

export const adminCredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .max(191, "อีเมลยาวเกินไป")
    .or(z.literal(""))
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .max(128, "รหัสผ่านยาวเกินไป")
    .refine((value) => value.length === 0 || value.length >= 8, {
      message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
    }),
});
