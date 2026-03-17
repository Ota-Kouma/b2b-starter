import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export const inviteSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  name: z.string().optional(),
  role: z.enum([
    "COMPANY_ADMIN",
    "COMPANY_MANAGER",
    "COMPANY_AUDITOR",
    "EMPLOYEE",
  ]),
});

export const signupSchema = z.object({
  companyName: z.string().min(1, "会社名を入力してください"),
  name: z.string().min(1, "名前を入力してください"),
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
