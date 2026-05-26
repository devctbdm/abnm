// src/actions/report.ts
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getDaysInMonth } from "@/lib/salary-calc";

export async function getAttendanceReport(startDate: string, endDate: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: start, lte: end },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: [{ date: "asc" }, { user: { name: "asc" } }],
  });

  // Group by employee
  const reportMap = new Map();
  for (const att of attendances) {
    if (!reportMap.has(att.userId)) {
      reportMap.set(att.userId, {
        name: att.user.name,
        email: att.user.email,
        records: [],
        present: 0,
        absent: 0,
        halfDays: 0,
        holidays: 0,
      });
    }
    const emp = reportMap.get(att.userId);
    emp.records.push({
      date: att.date,
      status: att.status,
      halfDay: att.halfDay,
    });
    if (att.status === "HOLIDAY") {
      emp.holidays++;
    } else if (att.status === "PRESENT") {
      if (att.halfDay) emp.halfDays++;
      else emp.present++;
    } else {
      emp.absent++;
    }
  }
  return Array.from(reportMap.values()); // ✅ returns array
}

export async function getSalaryReport(month: string, year: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const monthIdx = parseInt(month) - 1;
  const yearNum = parseInt(year);
  const startDate = new Date(yearNum, monthIdx, 1);
  const endDate = new Date(yearNum, monthIdx + 1, 0);
  const daysInMonth = getDaysInMonth(yearNum, monthIdx);

  // Fetch all salary records for the month
  const salaryRecords = await prisma.salaryRecord.findMany({
    where: {
      month: { gte: startDate, lte: endDate },
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, monthlySalary: true },
      },
    },
  });

  // Fetch all attendance records for this month
  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      userId: { in: salaryRecords.map((r) => r.user.id) },
    },
    select: { userId: true, status: true, halfDay: true },
  });

  // Group attendance per employee
  const attendanceMap = new Map<string, { absentDays: number; halfDays: number; holidays: number }>();
  for (const att of attendances) {
    if (!attendanceMap.has(att.userId)) {
      attendanceMap.set(att.userId, { absentDays: 0, halfDays: 0, holidays: 0 });
    }
    const entry = attendanceMap.get(att.userId)!;
    if (att.status === "HOLIDAY") {
      entry.holidays++;
    } else if (att.status === "PRESENT") {
      if (att.halfDay) entry.halfDays++;
    } else {
      entry.absentDays++;
    }
  }

  // Fetch all pending advances for this month
  const advances = await prisma.advanceSalary.findMany({
    where: {
      userId: { in: salaryRecords.map((r) => r.user.id) },
      status: "APPROVED",
      deductedInSalary: false,
      requestedAt: { lte: endDate },
    },
    select: { userId: true, amount: true },
  });

  const advanceMap = new Map<string, number>();
  for (const adv of advances) {
    advanceMap.set(adv.userId, (advanceMap.get(adv.userId) ?? 0) + adv.amount);
  }

  // Fetch real bonus data from FestivalBonusPayment
  const bonusPayments = await prisma.festivalBonusPayment.findMany({
    where: { paid: true },
    select: {
      userId: true,
      amount: true,
      festival: { select: { bonusDate: true } },
    },
  });

  const paidBonusLookup = new Map<string, { amount: number }>();
  for (const bp of bonusPayments) {
    const key = `${bp.userId}:${bp.festival.bonusDate.getFullYear()}-${bp.festival.bonusDate.getMonth()}`;
    paidBonusLookup.set(key, { amount: bp.amount });
  }

  return salaryRecords.map((record) => {
    const monthKey = `${record.user.id}:${record.month.getFullYear()}-${record.month.getMonth()}`;
    const paidBonus = paidBonusLookup.get(monthKey);

    // Dynamic deductions
    const att = attendanceMap.get(record.user.id) ?? { absentDays: 0, halfDays: 0, holidays: 0 };
    const dailyRate = record.user.monthlySalary / daysInMonth;
    const attendanceDeduction =
      att.absentDays * dailyRate + att.halfDays * dailyRate * 0.5;
    const advanceDeduction = advanceMap.get(record.user.id) ?? 0;

    // Bonus
    const actualBonus = paidBonus ? paidBonus.amount : record.eidBonus;

    // Dynamic net payable
    const netPayable =
      record.user.monthlySalary - attendanceDeduction - advanceDeduction + (paidBonus ? 0 : actualBonus);

    return {
      user: {
        name: record.user.name,
        email: record.user.email,
        monthlySalary: record.user.monthlySalary,
      },
      grossSalary: record.grossSalary,
      absentDays: att.absentDays,
      halfDays: att.halfDays,
      holidays: att.holidays,
      attendanceDeduction,
      advanceDeduction,
      eidBonus: actualBonus,
      netPayable,
      paid: record.paid,
      bonusPaid: !!paidBonus,
    };
  }); // ✅ returns array
}

export async function getLeaveReport(startDate: string, endDate: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const leaves = await prisma.leave.findMany({
    where: {
      startDate: { lte: end },
      endDate: { gte: start },
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return leaves.map((leave) => ({
    user: {
      name: leave.user.name,
      email: leave.user.email,
    },
    type: leave.type,
    startDate: leave.startDate,
    endDate: leave.endDate,
    reason: leave.reason,
    status: leave.status,
  })); // ✅ returns array
}
