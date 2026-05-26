// src/actions/employee-stats.ts
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getEmployeeStats(
  userId: string,
  year?: number,
  month?: number,
) {
  const session = await getSession();
  if (!session || session.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  const targetYear = year ?? now.getFullYear();
  const targetMonth = month ?? now.getMonth();
  const startDate = new Date(targetYear, targetMonth, 1);
  const endDate = new Date(targetYear, targetMonth + 1, 0);

  // Employee details
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

  // Attendance for the month
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
  });
  const presentDays = attendances.filter(
    (a) => a.status === "PRESENT" && !a.halfDay,
  ).length;
  const halfDays = attendances.filter((a) => a.halfDay).length;
  const absentDays = attendances.filter((a) => a.status === "ABSENT").length;

  // Leave usage (approved leaves this year)
  const startOfYear = new Date(targetYear, 0, 1);
  const usedLeaves = await prisma.leave.count({
    where: {
      userId,
      status: "APPROVED",
      startDate: { gte: startOfYear },
    },
  });
  const leaveRemaining = user.leaveQuota - usedLeaves;

  // Approved advances (not yet deducted)
  const advances = await prisma.advanceSalary.findMany({
    where: {
      userId,
      status: "APPROVED",
      deductedInSalary: false,
      requestedAt: { lte: endDate },
    },
    select: { amount: true, reason: true, requestedAt: true, status: true },
  });
  const totalAdvance = advances.reduce((sum, a) => sum + a.amount, 0);

  // Check if admin already processed a festival bonus for this month
  const existingRecord = await prisma.salaryRecord.findUnique({
    where: { userId_month: { userId, month: startDate } },
    select: { eidBonus: true, paid: true, paidAt: true },
  });
  const eidBonus = existingRecord?.eidBonus ?? 0;
  const salaryPaid = existingRecord?.paid ?? false;
  const salaryPaidAt = existingRecord?.paidAt ?? null;

  // Check festival bonus payment status
  const thisMonth = new Date(targetYear, targetMonth, 1);
  const nextMonth = new Date(targetYear, targetMonth + 1, 1);
  const bonusPayment = await prisma.festivalBonusPayment.findFirst({
    where: {
      userId,
      festival: { bonusDate: { gte: thisMonth, lt: nextMonth } },
    },
    select: { paid: true, paidAt: true, amount: true, festival: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Use actual days in month for daily rate calculation
  const daysInMonth = endDate.getDate();
  const dailyRate = user.monthlySalary / daysInMonth;

  // Deductions
  const attendanceDeduction =
    absentDays * dailyRate + halfDays * dailyRate * 0.5;
  const netSalary =
    user.monthlySalary - attendanceDeduction - totalAdvance + eidBonus;

  // Recent salary history (last 3 months)
  const salaryHistory = await prisma.salaryRecord.findMany({
    where: { userId },
    orderBy: { month: "desc" },
    take: 6,
    select: {
      month: true,
      netPayable: true,
      paid: true,
      eidBonus: true,
      paidAt: true,
    },
  });

  return {
    name: user.name,
    email: user.email,
    monthlySalary: user.monthlySalary,
    presentDays,
    absentDays,
    halfDays,
    daysInMonth,
    dailyRate,
    leaveQuota: user.leaveQuota,
    usedLeaves,
    leaveRemaining,
    totalAdvance,
    advanceList: advances,
    eidBonus,
    eidBonusPaid: bonusPayment?.paid ?? false,
    eidBonusPaidAt: bonusPayment?.paidAt ?? null,
    eidBonusFestivalName: bonusPayment?.festival.name ?? null,
    salaryPaid,
    salaryPaidAt,
    attendanceDeduction,
    netSalary,
    salaryHistory: salaryHistory.map((h) => ({
      month: h.month.toISOString(),
      netPayable: h.netPayable,
      eidBonus: h.eidBonus,
      paid: h.paid,
      paidAt: h.paidAt?.toISOString() ?? null,
    })),
    year: targetYear,
    month: targetMonth,
  };
}
