"use server";
import prisma from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAdminProfile() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return user;
}

export async function updateAdminProfile(data: {
  name: string;
  password?: string;
}) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }
  const updateData: any = { name: data.name };
  if (data.password && data.password.trim() !== "") {
    updateData.password = await hashPassword(data.password);
  }
  await prisma.user.update({ where: { id: session.userId }, data: updateData });
  revalidatePath("/admin/account");
  return { success: true };
}
