// src/actions/advance.ts (extend existing)
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAdminAdvances() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const advances = await prisma.advanceSalary.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          monthlySalary: true,
        },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  return advances.map((adv) => ({
    ...adv,
    requestedAt: adv.requestedAt.toISOString(),
    approvedAt: adv.approvedAt?.toISOString() || null,
    salaryMonth: adv.salaryMonth?.toISOString() || null,
  }));
}

export async function updateAdvanceStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  await prisma.advanceSalary.update({
    where: { id },
    data: {
      status,
      approvedBy: session.userId,
      approvedAt: status === "APPROVED" ? new Date() : undefined,
    },
  });

  revalidatePath("/admin/advance");
  return { success: true };
}

export async function deleteAdvance(id: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  await prisma.advanceSalary.delete({ where: { id } });
  revalidatePath("/admin/advance");
  return { success: true };
}

// Get employee's advance requests
export async function getUserAdvances(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const advances = await prisma.advanceSalary.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" },
  });
  return advances.map((adv) => ({
    ...adv,
    requestedAt: adv.requestedAt.toISOString(),
    approvedAt: adv.approvedAt?.toISOString() || null,
    salaryMonth: adv.salaryMonth?.toISOString() || null,
  }));
}

export async function getCurrentMonthNetSalary(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlySalary: true },
  });
  if (!user) throw new Error("User not found");

  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    select: { status: true, halfDay: true },
  });

  const advances = await prisma.advanceSalary.findMany({
    where: {
      userId,
      status: "APPROVED",
      deductedInSalary: false,
      requestedAt: { lte: endDate },
    },
    select: { amount: true },
  });

  const daysInMonth = endDate.getDate();
  const dailyRate = user.monthlySalary / daysInMonth;

  let absentDays = 0;
  let halfDays = 0;
  for (const att of attendances) {
    if (att.status === "ABSENT") {
      absentDays++;
    } else if (att.halfDay) {
      halfDays++;
    }
  }

  const attendanceDeduction =
    absentDays * dailyRate + halfDays * dailyRate * 0.5;
  const advanceDeduction = advances.reduce((sum, a) => sum + a.amount, 0);
  const netSalary = user.monthlySalary - attendanceDeduction - advanceDeduction;

  return {
    monthlySalary: user.monthlySalary,
    netSalary,
    absentDays,
    halfDays,
    attendanceDeduction,
    advanceDeduction,
    daysInMonth,
    dailyRate,
  };
}

// Request advance salary
export async function requestAdvance(amount: number, reason: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { monthlySalary: true },
  });
  if (!user) throw new Error("User not found");

  // Read advance percentage from global settings (default 50%)
  const advanceSetting = await prisma.globalSetting.findUnique({
    where: { key: "advancePercentage" },
  });
  const advancePercentage = advanceSetting
    ? parseInt(advanceSetting.value)
    : 50;

  // Calculate current month net salary (after attendance & advance deductions)
  const netInfo = await getCurrentMonthNetSalary(session.userId);

  const maxAdvance = netInfo.netSalary * (advancePercentage / 100);
  if (amount > maxAdvance) {
    throw new Error(
      `Maximum advance limit is ${advancePercentage}% of net salary (Tk ${netInfo.netSalary.toLocaleString()}) = Tk ${maxAdvance.toLocaleString()}`,
    );
  }
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const advance = await prisma.advanceSalary.create({
    data: {
      userId: session.userId,
      amount,
      reason: reason || null,
      status: "PENDING",
      deductedInSalary: false,
    },
  });

  revalidatePath("/employee/advance");
  return { success: true, advance };
}

export async function createAdvanceForUser(
  userId: string,
  amount: number,
  reason: string,
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const advance = await prisma.advanceSalary.create({
    data: {
      userId,
      amount,
      reason: reason || null,
      status: "APPROVED",
      approvedBy: session.userId,
      approvedAt: new Date(),
      deductedInSalary: false,
    },
  });

  revalidatePath("/admin/advance");
  return {
    success: true,
    advance: {
      ...advance,
      requestedAt: advance.requestedAt.toISOString(),
      approvedAt: advance.approvedAt?.toISOString() ?? null,
      paidAt: advance.paidAt?.toISOString() ?? null,
      salaryMonth: advance.salaryMonth?.toISOString() ?? null,
    },
  };
}
