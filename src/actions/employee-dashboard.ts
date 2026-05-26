// src/actions/employee-dashboard.ts
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getEmployeeDashboardData(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get employee details
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      monthlySalary: true,
      leaveQuota: true,
    },
  });
  if (!user) throw new Error("User not found");

  // Get attendance for current month
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });
  const presentDays = attendances.filter(
    (a) => a.status === "PRESENT" && !a.halfDay,
  ).length;
  const halfDays = attendances.filter((a) => a.halfDay).length;
  const absentDays = attendances.filter((a) => a.status === "ABSENT").length;

  // Get used leaves this year (approved)
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const usedLeaves = await prisma.leave.count({
    where: {
      userId,
      status: "APPROVED",
      startDate: { gte: startOfYear },
    },
  });
  const leaveRemaining = user.leaveQuota - usedLeaves;

  // Get pending advance requests not yet deducted
  const advances = await prisma.advanceSalary.findMany({
    where: {
      userId,
      status: "APPROVED",
      deductedInSalary: false,
    },
  });
  const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

  // Check for festival bonus
  // 1. First check FestivalBonusPayment — this covers both paid-separately and unpaid-processed bonuses
  let eidBonus = 0;
  let bonusPaidSeparately = false;

  const bonusPayment = await prisma.festivalBonusPayment.findFirst({
    where: {
      userId,
      festival: {
        bonusDate: { gte: startOfMonth, lte: endOfMonth },
      },
    },
    select: { amount: true, paid: true },
  });

  if (bonusPayment) {
    eidBonus = bonusPayment.amount;
    bonusPaidSeparately = bonusPayment.paid;
  }

  // 2. Fallback to SalaryRecord (e.g., if bonus was processed before FestivalBonusPayment model existed)
  if (eidBonus === 0) {
    const existingRecord = await prisma.salaryRecord.findUnique({
      where: { userId_month: { userId, month: startOfMonth } },
      select: { eidBonus: true },
    });
    eidBonus = existingRecord?.eidBonus ?? 0;
  }

  // Use actual days in month for daily rate calculation
  const daysInMonth = endOfMonth.getDate();
  const dailyRate = user.monthlySalary / daysInMonth;

  // Calculate deductions
  const attendanceDeduction =
    absentDays * dailyRate + halfDays * dailyRate * 0.5;
  // Only add eidBonus to netSalary if NOT already paid separately
  const netSalary =
    user.monthlySalary - attendanceDeduction - totalAdvance + (bonusPaidSeparately ? 0 : eidBonus);

  return {
    name: user.name,
    email: user.email,
    monthlySalary: user.monthlySalary,
    presentDays,
    absentDays,
    halfDays,
    leaveQuota: user.leaveQuota,
    usedLeaves,
    leaveRemaining,
    totalAdvance,
    eidBonus,
    attendanceDeduction,
    netSalary,
  };
}
