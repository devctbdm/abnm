// src/actions/auth.ts
"use server";
import { login as authLogin } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const redirectTo = await authLogin(email, password);
    return { success: true, redirectTo };
  } catch (error: any) {
    return { error: error.message };
  }
}
