"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getBonusPayments(festivalBonusId: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  return prisma.festivalBonusPayment.findMany({
    where: { festivalBonusId },
    include: {
      user: {
        select: { id: true, name: true, email: true, monthlySalary: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function markBonusPaid(paymentId: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const payment = await prisma.festivalBonusPayment.findUnique({
    where: { id: paymentId },
    include: { festival: true },
  });
  if (!payment) throw new Error("Payment not found");

  // Separate bonus from salary record — bonus paid separately
  const bonusMonth = new Date(
    payment.festival.bonusDate.getFullYear(),
    payment.festival.bonusDate.getMonth(),
    1,
  );
  const salaryRecord = await prisma.salaryRecord.findUnique({
    where: { userId_month: { userId: payment.userId, month: bonusMonth } },
  });
  if (salaryRecord) {
    const newEidBonus = Math.max(0, salaryRecord.eidBonus - payment.amount);
    const newNetPayable = salaryRecord.netPayable - payment.amount;
    await prisma.salaryRecord.update({
      where: { id: salaryRecord.id },
      data: { eidBonus: newEidBonus, netPayable: newNetPayable },
    });
  }

  await prisma.festivalBonusPayment.update({
    where: { id: paymentId },
    data: { paid: true, paidAt: new Date() },
  });

  revalidatePath("/admin/salary");
  return { success: true };
}

export async function markAllBonusesPaid(festivalBonusId: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const festival = await prisma.festivalBonus.findUnique({
    where: { id: festivalBonusId },
    include: {
      payments: {
        where: { paid: false },
        include: { festival: true },
      },
    },
  });
  if (!festival) throw new Error("Festival bonus not found");

  const bonusMonth = new Date(
    festival.bonusDate.getFullYear(),
    festival.bonusDate.getMonth(),
    1,
  );

  for (const payment of festival.payments) {
    const salaryRecord = await prisma.salaryRecord.findUnique({
      where: { userId_month: { userId: payment.userId, month: bonusMonth } },
    });
    if (salaryRecord) {
      const newEidBonus = Math.max(0, salaryRecord.eidBonus - payment.amount);
      const newNetPayable = salaryRecord.netPayable - payment.amount;
      await prisma.salaryRecord.update({
        where: { id: salaryRecord.id },
        data: { eidBonus: newEidBonus, netPayable: newNetPayable },
      });
    }
  }

  const result = await prisma.festivalBonusPayment.updateMany({
    where: { festivalBonusId, paid: false },
    data: { paid: true, paidAt: new Date() },
  });

  revalidatePath("/admin/salary");
  return { success: true, count: result.count };
}

export async function getUnprocessedBonusPayments() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const unprocessed = await prisma.festivalBonusPayment.findMany({
    where: { paid: false },
    include: {
      festival: { select: { name: true, bonusDate: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return unprocessed;
}

export async function ensureBonusPayments(festivalId: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const festival = await prisma.festivalBonus.findUnique({
    where: { id: festivalId },
    include: { payments: true },
  });
  if (!festival || !festival.processed) return;
  if (festival.payments.length > 0) return;

  const bonusMonth = new Date(festival.bonusDate.getFullYear(), festival.bonusDate.getMonth(), 1);

  const salaryRecords = await prisma.salaryRecord.findMany({
    where: { month: bonusMonth, eidBonus: { gt: 0 } },
    select: { userId: true, eidBonus: true },
  });

  for (const record of salaryRecords) {
    await prisma.festivalBonusPayment.upsert({
      where: {
        festivalBonusId_userId: { festivalBonusId: festivalId, userId: record.userId },
      },
      update: { amount: record.eidBonus },
      create: {
        festivalBonusId: festivalId,
        userId: record.userId,
        amount: record.eidBonus,
        paid: false,
      },
    });
  }
}

export async function getFestivalBonuses() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  return prisma.festivalBonus.findMany({
    orderBy: { bonusDate: "desc" },
  });
}

export async function createFestivalBonus(data: {
  name: string;
  bonusDate: string;
  bonusPercentage?: number;
}) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const bonus = await prisma.festivalBonus.create({
    data: {
      name: data.name,
      bonusDate: new Date(data.bonusDate),
      bonusPercentage: data.bonusPercentage ?? 50,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true, bonus };
}

export async function deleteFestivalBonus(id: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const festival = await prisma.festivalBonus.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!festival) throw new Error("Festival bonus not found");

  const bonusMonth = new Date(festival.bonusDate.getFullYear(), festival.bonusDate.getMonth(), 1);

  // Reset eidBonus and netPayable in salary records
  // Handle both with-payments and without-payments (pre-migration) cases
  if (festival.payments.length > 0) {
    for (const payment of festival.payments) {
      const record = await prisma.salaryRecord.findUnique({
        where: { userId_month: { userId: payment.userId, month: bonusMonth } },
      });
      if (record) {
        const newEidBonus = Math.max(0, record.eidBonus - payment.amount);
        const newNetPayable = record.netPayable - payment.amount;
        await prisma.salaryRecord.update({
          where: { id: record.id },
          data: {
            eidBonus: newEidBonus,
            netPayable: newNetPayable,
          },
        });
      }
    }
  } else {
    // No payment records (pre-migration) — reset all salary records for this month
    const salaryRecords = await prisma.salaryRecord.findMany({
      where: { month: bonusMonth, eidBonus: { gt: 0 } },
      select: { id: true, eidBonus: true, netPayable: true },
    });
    for (const record of salaryRecords) {
      await prisma.salaryRecord.update({
        where: { id: record.id },
        data: {
          eidBonus: 0,
          netPayable: record.netPayable - record.eidBonus,
        },
      });
    }
  }

  await prisma.festivalBonus.delete({ where: { id } });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/salary");
  return { success: true };
}

export async function processFestivalBonus(festivalId: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const festival = await prisma.festivalBonus.findUnique({
    where: { id: festivalId },
  });
  if (!festival) throw new Error("Festival bonus not found");
  if (festival.processed) throw new Error("Already processed");

  const bonusYear = festival.bonusDate.getFullYear();
  const bonusMonth = festival.bonusDate.getMonth();
  const monthStart = new Date(bonusYear, bonusMonth, 1);

  // Get all employees
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, monthlySalary: true, createdAt: true, joinedAt: true },
  });

  let processed = 0;

  for (const emp of employees) {
    // Check 6+ months tenure (use joinedAt if set, fallback to createdAt)
    const joinDate = emp.joinedAt ?? emp.createdAt;
    const monthsSinceJoining =
      (bonusYear - joinDate.getFullYear()) * 12 +
      (bonusMonth - joinDate.getMonth());
    if (monthsSinceJoining < 6) continue;

    const bonusAmount = emp.monthlySalary * (festival.bonusPercentage / 100);

    // Upsert salary record for the festival month with eid bonus
    await prisma.salaryRecord.upsert({
      where: {
        userId_month: { userId: emp.id, month: monthStart },
      },
      update: {
        eidBonus: bonusAmount,
        netPayable: { increment: bonusAmount },
      },
      create: {
        userId: emp.id,
        month: monthStart,
        grossSalary: emp.monthlySalary,
        absentDays: 0,
        halfDays: 0,
        attendanceDeduction: 0,
        advanceDeduction: 0,
        eidBonus: bonusAmount,
        netPayable: emp.monthlySalary + bonusAmount,
      },
    });

    // Create or update FestivalBonusPayment record
    await prisma.festivalBonusPayment.upsert({
      where: {
        festivalBonusId_userId: { festivalBonusId: festival.id, userId: emp.id },
      },
      update: { amount: bonusAmount },
      create: {
        festivalBonusId: festival.id,
        userId: emp.id,
        amount: bonusAmount,
        paid: false,
      },
    });

    processed++;
  }

  // Mark festival as processed
  await prisma.festivalBonus.update({
    where: { id: festivalId },
    data: { processed: true, processedAt: new Date() },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/salary");
  return { success: true, totalEmployees: employees.length, processed };
}
