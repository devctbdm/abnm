// src/actions/leave.ts (add these functions)
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAllLeaves() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const leaves = await prisma.leave.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          leaveQuota: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return leaves.map((leave) => ({
    ...leave,
    startDate: leave.startDate.toISOString(),
    endDate: leave.endDate.toISOString(),
    createdAt: leave.createdAt.toISOString(),
    updatedAt: leave.updatedAt.toISOString(),
  }));
}

export async function updateLeaveStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  await prisma.leave.update({
    where: { id },
    data: {
      status,
      approvedBy: session.userId,
      updatedAt: new Date(),
    },
  });

  revalidatePath("/admin/leave");
  return { success: true };
}

export async function deleteLeave(id: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  await prisma.leave.delete({ where: { id } });
  revalidatePath("/admin/leave");
  return { success: true };
}

// Get user's leave requests
export async function getUserLeaves(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const leaves = await prisma.leave.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return leaves.map((leave) => ({
    ...leave,
    startDate: leave.startDate.toISOString(),
    endDate: leave.endDate.toISOString(),
    createdAt: leave.createdAt.toISOString(),
  }));
}

// Get leave quota and used leaves for current year
export async function getLeaveQuota(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { leaveQuota: true },
  });
  if (!user) throw new Error("User not found");

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const usedLeaves = await prisma.leave.count({
    where: {
      userId,
      status: "APPROVED",
      startDate: { gte: startOfYear },
    },
  });

  return {
    total: user.leaveQuota,
    used: usedLeaves,
    remaining: user.leaveQuota - usedLeaves,
  };
}

// Apply for leave
export async function applyLeave(data: {
  type: "SICK" | "CASUAL" | "ANNUAL";
  startDate: string;
  endDate: string;
  reason: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (start > end) throw new Error("End date must be after start date");

  const leave = await prisma.leave.create({
    data: {
      userId: session.userId,
      type: data.type,
      startDate: start,
      endDate: end,
      reason: data.reason,
      status: "PENDING",
    },
  });

  revalidatePath("/employee/leave");
  return {
    success: true,
    leave: {
      ...leave,
      startDate: leave.startDate.toISOString(),
      endDate: leave.endDate.toISOString(),
      createdAt: leave.createdAt.toISOString(),
      updatedAt: leave.updatedAt.toISOString(),
    },
  };
}
