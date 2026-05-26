"use server";

import prisma from "@/lib/prisma";
import {
  calculateAllSalariesForMonth,
  getDaysInMonth,
} from "@/lib/salary-calc";

export async function runPayroll(year: number, month: number) {
  const results = await calculateAllSalariesForMonth(year, month);
  const startDate = new Date(year, month, 1);

  for (const [userId, calc] of results.entries()) {
    // Check if record already exists
    const existing = await prisma.salaryRecord.findUnique({
      where: {
        userId_month: {
          userId,
          month: startDate,
        },
      },
    });

    if (existing) {
      // Update existing record
      await prisma.salaryRecord.update({
        where: { id: existing.id },
        data: {
          grossSalary: calc.grossSalary,
          absentDays: calc.absentDays,
          halfDays: calc.halfDays,
          attendanceDeduction: calc.attendanceDeduction,
          advanceDeduction: calc.advanceDeduction,
          eidBonus: calc.eidBonus,
          netPayable: calc.netPayable,
        },
      });
    } else {
      // Create new record
      await prisma.salaryRecord.create({
        data: {
          userId,
          month: startDate,
          grossSalary: calc.grossSalary,
          absentDays: calc.absentDays,
          halfDays: calc.halfDays,
          attendanceDeduction: calc.attendanceDeduction,
          advanceDeduction: calc.advanceDeduction,
          eidBonus: calc.eidBonus,
          netPayable: calc.netPayable,
        },
      });
    }

    // Mark advances as deducted
    await prisma.advanceSalary.updateMany({
      where: {
        userId,
        status: "APPROVED",
        deductedInSalary: false,
        requestedAt: { lte: new Date(year, month + 1, 0) },
      },
      data: { deductedInSalary: true },
    });
  }
}

export async function getSalaryData(year: number, month: number) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const daysInMonth = getDaysInMonth(year, month);

  const employees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      OR: [
        { joinedAt: null },
        { joinedAt: { lte: endDate } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      monthlySalary: true,
    },
  });

  // Batch-fetch stored salary data for this month (bonus + advance deduction + paid status)
  const thisMonthRecords = await prisma.salaryRecord.findMany({
    where: {
      userId: { in: employees.map((e) => e.id) },
      month: startDate,
    },
    select: {
      userId: true,
      id: true,
      eidBonus: true,
      advanceDeduction: true,
      paid: true,
      paidAt: true,
    },
  });
  const storedEidBonusMap = new Map<string, number>();
  const storedAdvanceMap = new Map<string, number>();
  const storedRecordMap = new Map<
    string,
    { id: string; paid: boolean; paidAt: Date | null }
  >();
  for (const r of thisMonthRecords) {
    if (r.eidBonus > 0) storedEidBonusMap.set(r.userId, r.eidBonus);
    storedAdvanceMap.set(r.userId, r.advanceDeduction);
    storedRecordMap.set(r.userId, { id: r.id, paid: r.paid, paidAt: r.paidAt });
  }

  // Check which bonuses have been paid separately
  const nextMonth = new Date(year, month + 1, 1);
  const paidBonusUserIds = new Set<string>();
  const paidBonuses = await prisma.festivalBonusPayment.findMany({
    where: {
      paid: true,
      festival: { bonusDate: { gte: startDate, lt: nextMonth } },
    },
    select: { userId: true },
  });
  for (const pb of paidBonuses) {
    paidBonusUserIds.add(pb.userId);
  }

  const salaryData = await Promise.all(
    employees.map(async (emp) => {
      const attendances = await prisma.attendance.findMany({
        where: {
          userId: emp.id,
          date: { gte: startDate, lte: endDate },
        },
        select: { status: true, halfDay: true },
      });

      let presentDays = 0;
      let halfDays = 0;
      let absentDays = 0;

      for (const att of attendances) {
        if (att.status === "PRESENT" || att.status === "HOLIDAY") {
          if (att.halfDay) {
            halfDays++;
          } else {
            presentDays++;
          }
        } else {
          absentDays++;
        }
      }

      // Count days without any attendance record as absent
      const daysWithRecords = presentDays + halfDays + absentDays;
      const daysWithoutRecords = daysInMonth - daysWithRecords;
      if (daysWithoutRecords > 0) {
        absentDays += daysWithoutRecords;
      }

      // Advance deduction = stored (from payroll) + any new undeducted advances
      const storedAdvance = storedAdvanceMap.get(emp.id) ?? 0;
      const newAdvances = await prisma.advanceSalary.findMany({
        where: {
          userId: emp.id,
          status: "APPROVED",
          deductedInSalary: false,
          requestedAt: { lte: endDate },
        },
        select: { amount: true },
      });
      const newAdvanceTotal = newAdvances.reduce(
        (sum, a) => sum + a.amount,
        0,
      );
      const advanceDeduction = storedAdvance + newAdvanceTotal;

      // Use standard 30-day month for daily rate (monthly salary system)
      const dailyRate = emp.monthlySalary / 30;
      const attendanceDeduction =
        absentDays * dailyRate + halfDays * dailyRate * 0.5;

      const rawEidBonus = storedEidBonusMap.get(emp.id) ?? 0;
      // Exclude bonus from netPayable if already paid separately
      const eidBonus = paidBonusUserIds.has(emp.id) ? 0 : rawEidBonus;

      const netPayable =
        emp.monthlySalary - attendanceDeduction - advanceDeduction + eidBonus;

      const stored = storedRecordMap.get(emp.id);

      return {
        userId: emp.id,
        name: emp.name,
        email: emp.email,
        monthlySalary: emp.monthlySalary,
        presentDays,
        halfDays,
        absentDays,
        attendanceDeduction,
        advanceDeduction,
        eidBonus,
        netPayable,
        recordId: stored?.id ?? null,
        paid: stored?.paid ?? false,
        paidAt: stored?.paidAt ?? null,
      };
    }),
  );

  return {
    salaryData,
    daysInMonth,
    month: startDate.toISOString(),
  };
}

export async function getSalaryHistory() {
  const records = await prisma.salaryRecord.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      month: "desc",
    },
  });

  // Fetch all paid bonus payments to adjust netPayable
  const paidBonuses = await prisma.festivalBonusPayment.findMany({
    where: { paid: true },
    select: {
      userId: true,
      amount: true,
      festival: { select: { bonusDate: true } },
    },
  });

  // Build lookup: key = "userId:year-month" → total paid bonus amount
  const paidBonusLookup = new Map<string, number>();
  for (const pb of paidBonuses) {
    const key = `${pb.userId}:${pb.festival.bonusDate.getFullYear()}-${pb.festival.bonusDate.getMonth()}`;
    const current = paidBonusLookup.get(key) ?? 0;
    paidBonusLookup.set(key, current + pb.amount);
  }

  // Dynamically fetch advance deductions for records where stored value is 0
  const recordsNeedingAdvances = records.filter(
    (r) => !r.advanceDeduction || r.advanceDeduction === 0,
  );
  const advanceLookup = new Map<string, number>();
  if (recordsNeedingAdvances.length > 0) {
    const neededUsers = [...new Set(recordsNeedingAdvances.map((r) => r.userId))];
    const allAdvances = await prisma.advanceSalary.findMany({
      where: {
        status: "APPROVED",
        userId: { in: neededUsers },
      },
      select: { userId: true, amount: true, requestedAt: true },
    });
    for (const adv of allAdvances) {
      // Map advance to its requested month
      const monthKey = `${adv.userId}:${adv.requestedAt.getFullYear()}-${adv.requestedAt.getMonth()}`;
      advanceLookup.set(monthKey, (advanceLookup.get(monthKey) ?? 0) + adv.amount);
    }
  }

  // Adjust netPayable by excluding paid bonuses and fill missing advance deductions
  const adjusted = records.map((record) => {
    const monthKey = `${record.userId}:${record.month.getFullYear()}-${record.month.getMonth()}`;
    const paidBonusAmount = paidBonusLookup.get(monthKey) ?? 0;

    let advanceDeduction = record.advanceDeduction;
    if (!advanceDeduction) {
      advanceDeduction = advanceLookup.get(monthKey) ?? 0;
    }

    let netPayable = record.netPayable;
    if (paidBonusAmount > 0) {
      netPayable -= paidBonusAmount;
    }
    if (!record.advanceDeduction && advanceDeduction > 0) {
      netPayable -= advanceDeduction;
    }

    return {
      ...record,
      advanceDeduction,
      netPayable,
      eidBonus: paidBonusAmount > 0 ? 0 : record.eidBonus,
    };
  });

  return adjusted;
}

export async function markSalaryPaid(recordId: string) {
  await prisma.salaryRecord.update({
    where: { id: recordId },
    data: {
      paid: true,
      paidAt: new Date(),
    },
  });
}
