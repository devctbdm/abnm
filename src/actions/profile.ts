// src/actions/profile.ts
"use server";
import prisma from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getEmployeeProfile() {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYEE") {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      monthlySalary: true,
      leaveQuota: true,
      createdAt: true,
    },
  });
  return user;
}

export async function updateEmployeeProfile(data: {
  name: string;
  password?: string;
}) {
  const session = await getSession();
  if (!session || session.role !== "EMPLOYEE") {
    throw new Error("Unauthorized");
  }

  const updateData: any = { name: data.name };
  if (data.password && data.password.trim() !== "") {
    updateData.password = await hashPassword(data.password);
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: updateData,
  });

  revalidatePath("/employee/settings");
  return { success: true };
}
