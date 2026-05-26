// src/actions/user.ts
"use server";
import prisma from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAllUsers() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      monthlySalary: true,
      leaveQuota: true,
      joinedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return users;
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "OWNER" | "ADMIN" | "EMPLOYEE";
  monthlySalary: number;
  leaveQuota: number;
  joinedAt?: string;
}) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      monthlySalary: data.monthlySalary,
      leaveQuota: data.leaveQuota,
      joinedAt: data.joinedAt ? new Date(data.joinedAt) : null,
    },
  });

  revalidatePath("/admin/users");
  return { success: true, user };
}

export async function updateUser(
  id: string,
  data: {
    name: string;
    email: string;
    role: "OWNER" | "ADMIN" | "EMPLOYEE";
    monthlySalary: number;
    leaveQuota: number;
    password?: string;
    joinedAt?: string | null;
  },
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const updateData: any = {
    name: data.name,
    email: data.email,
    role: data.role,
    monthlySalary: data.monthlySalary,
    leaveQuota: data.leaveQuota,
  };
  if (data.joinedAt !== undefined) {
    updateData.joinedAt = data.joinedAt ? new Date(data.joinedAt) : null;
  }
  if (data.password && data.password.trim() !== "") {
    updateData.password = await hashPassword(data.password);
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  revalidatePath("/admin/users");
  return { success: true, user };
}

export async function deleteUser(id: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  // Prevent deleting yourself
  if (id === session.userId) {
    throw new Error("You cannot delete your own account");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  return { success: true };
}
