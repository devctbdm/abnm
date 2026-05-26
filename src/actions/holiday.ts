"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getHolidays(year: number, month: number) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "OWNER" && session.role !== "ADMIN" && session.role !== "EMPLOYEE")
  ) {
    throw new Error("Unauthorized");
  }

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const holidays = await prisma.holiday.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });

  return holidays;
}

export async function getAllHolidays() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const holidays = await prisma.holiday.findMany({
    orderBy: { date: "desc" },
  });

  return holidays;
}

export async function createHoliday(name: string, date: Date) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized – Only admin/owner can manage holidays");
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const existing = await prisma.holiday.findUnique({
    where: { name_date: { name, date: targetDate } },
  });

  if (existing) {
    throw new Error(`Holiday "${name}" already exists on this date`);
  }

  await prisma.holiday.create({
    data: {
      name,
      date: targetDate,
    },
  });

  revalidatePath("/admin/attendance/holiday");
  revalidatePath("/admin/attendance");
  return { success: true };
}

export async function deleteHoliday(id: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized – Only admin/owner can manage holidays");
  }

  await prisma.holiday.delete({
    where: { id },
  });

  revalidatePath("/admin/attendance/holiday");
  revalidatePath("/admin/attendance");
  return { success: true };
}

export async function markHolidayAttendance(
  userId: string,
  date: Date,
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized – Only admin/owner can mark attendance");
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(targetDate.getDate() + 1);

  const existing = await prisma.attendance.findFirst({
    where: {
      userId,
      date: { gte: targetDate, lt: nextDay },
    },
  });

  if (existing) {
    await prisma.attendance.update({
      where: { id: existing.id },
      data: { status: "HOLIDAY", halfDay: false },
    });
  } else {
    await prisma.attendance.create({
      data: {
        userId,
        date: targetDate,
        status: "HOLIDAY",
        halfDay: false,
      },
    });
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin/attendance/mark");
  return { success: true };
}
