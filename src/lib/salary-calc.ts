// src/lib/salary-calc.ts
import prisma from "./prisma";

// ==================== Types ====================
export interface EmployeeSalaryInput {
  userId: string;
  monthlySalary: number;
  attendances: {
    status: "PRESENT" | "ABSENT" | "HOLIDAY";
    halfDay: boolean;
  }[];
  approvedAdvances: { amount: number }[];
  daysInMonth: number;
  eidBonus: number;
}

export interface SalaryCalculationResult {
  grossSalary: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  dailyRate: number;
  attendanceDeduction: number;
  advanceDeduction: number;
  eidBonus: number;
  netPayable: number;
}

// ==================== Core Calculation ====================
export function calculateEmployeeSalary(
  input: EmployeeSalaryInput,
): SalaryCalculationResult {
  const {
    monthlySalary,
    attendances,
    approvedAdvances,
    daysInMonth,
    eidBonus,
  } = input;

  // Count attendance types
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

  // Use standard 30-day month for daily rate (monthly salary system)
  const dailyRate = monthlySalary / 30;
  const attendanceDeduction =
    absentDays * dailyRate + halfDays * dailyRate * 0.5;
  const advanceDeduction = approvedAdvances.reduce(
    (sum, a) => sum + a.amount,
    0,
  );
  const netPayable =
    monthlySalary - attendanceDeduction - advanceDeduction + eidBonus;

  return {
    grossSalary: monthlySalary,
    presentDays,
    halfDays,
    absentDays,
    dailyRate,
    attendanceDeduction,
    advanceDeduction,
    eidBonus,
    netPayable,
  };
}

// ==================== Fetch Data and Calculate for a User ====================
export async function calculateUserSalaryForMonth(
  userId: string,
  year: number,
  month: number,
): Promise<SalaryCalculationResult> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // Get employee
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { monthlySalary: true },
  });
  if (!user) throw new Error(`User ${userId} not found`);

  // Get attendance for the month
  const attendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: startDate, lte: endDate },
    },
    select: { status: true, halfDay: true },
  });

  // Get approved advances not yet deducted
  const newAdvances = await prisma.advanceSalary.findMany({
    where: {
      userId,
      status: "APPROVED",
      deductedInSalary: false,
      requestedAt: { lte: endDate },
    },
    select: { amount: true },
  });

  // Use actual days in month for daily rate calculation
  const daysInMonth = endDate.getDate();

  // Use stored eidBonus + advance deduction from existing record if available
  const existingRecord = await prisma.salaryRecord.findUnique({
    where: { userId_month: { userId, month: startDate } },
    select: { eidBonus: true, advanceDeduction: true },
  });
  const eidBonus = existingRecord?.eidBonus ?? 0;
  const storedAdvance = existingRecord?.advanceDeduction ?? 0;
  const totalAdvance =
    storedAdvance + newAdvances.reduce((s, a) => s + a.amount, 0);

  return calculateEmployeeSalary({
    userId,
    monthlySalary: user.monthlySalary,
    attendances,
    approvedAdvances: totalAdvance > 0 ? [{ amount: totalAdvance }] : [],
    daysInMonth,
    eidBonus,
  });
}

// ==================== Batch Calculate for All Employees ====================
export async function calculateAllSalariesForMonth(
  year: number,
  month: number,
): Promise<Map<string, SalaryCalculationResult>> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  // Get all employees
  const employees = await prisma.user.findMany({
    where: {
      role: "EMPLOYEE",
      OR: [
        { joinedAt: null },
        { joinedAt: { lte: endDate } },
      ],
    },
    select: { id: true, monthlySalary: true },
  });

  // Get all attendance for the month
  const attendancesMap = new Map<
    string,
    { status: "PRESENT" | "ABSENT"; halfDay: boolean }[]
  >();
  const allAttendances = await prisma.attendance.findMany({
    where: {
      userId: { in: employees.map((e) => e.id) },
      date: { gte: startDate, lte: endDate },
    },
    select: { userId: true, status: true, halfDay: true },
  });
  for (const att of allAttendances) {
    if (!attendancesMap.has(att.userId)) attendancesMap.set(att.userId, []);
    attendancesMap.get(att.userId)!.push({
      status: att.status as "PRESENT" | "ABSENT",
      halfDay: att.halfDay,
    });
  }

  // Get all approved advances not deducted
  const advancesMap = new Map<string, { amount: number }[]>();
  const allAdvances = await prisma.advanceSalary.findMany({
    where: {
      userId: { in: employees.map((e) => e.id) },
      status: "APPROVED",
      deductedInSalary: false,
      requestedAt: { lte: endDate },
    },
    select: { userId: true, amount: true },
  });
  for (const adv of allAdvances) {
    if (!advancesMap.has(adv.userId)) advancesMap.set(adv.userId, []);
    advancesMap.get(adv.userId)!.push({ amount: adv.amount });
  }

  // Use actual days in month for daily rate calculation
  const daysInMonth = endDate.getDate();

  // Batch-fetch stored advance deduction + eidBonus for this month
  const thisMonthRecords = await prisma.salaryRecord.findMany({
    where: {
      userId: { in: employees.map((e) => e.id) },
      month: startDate,
    },
    select: { userId: true, eidBonus: true, advanceDeduction: true },
  });
  const eidBonusMap = new Map<string, number>();
  const storedAdvanceMap = new Map<string, number>();
  for (const r of thisMonthRecords) {
    if (r.eidBonus > 0) eidBonusMap.set(r.userId, r.eidBonus);
    storedAdvanceMap.set(r.userId, r.advanceDeduction);
  }

  const results = new Map<string, SalaryCalculationResult>();
  for (const emp of employees) {
    const eidBonus = eidBonusMap.get(emp.id) ?? 0;
    const storedAdvance = storedAdvanceMap.get(emp.id) ?? 0;
    const newAdvances = advancesMap.get(emp.id) || [];
    const totalAdvanceAmount =
      storedAdvance + newAdvances.reduce((s, a) => s + a.amount, 0);

    const attendances = attendancesMap.get(emp.id) || [];
    const result = calculateEmployeeSalary({
      userId: emp.id,
      monthlySalary: emp.monthlySalary,
      attendances,
      approvedAdvances: totalAdvanceAmount > 0
        ? [{ amount: totalAdvanceAmount }]
        : [],
      daysInMonth,
      eidBonus,
    });
    results.set(emp.id, result);
  }
  return results;
}

// ==================== Validation ====================
export function validateAdvanceAmount(
  amount: number,
  monthlySalary: number,
  maxPercentage: number = 50,
): boolean {
  const maxAmount = monthlySalary * (maxPercentage / 100);
  return amount <= maxAmount;
}

// ==================== Helper: Get Month Info ====================
export function getMonthDateRange(
  year: number,
  month: number,
): { start: Date; end: Date } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

// ==================== Helper: Get Working Days for Month ====================
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
