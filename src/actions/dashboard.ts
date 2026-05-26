// src/actions/dashboard.ts
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getAdminDashboardData() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's attendance summary
  const todayAttendance = await prisma.attendance.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    include: { user: { select: { name: true, role: true } } },
  });

  const totalEmployees = await prisma.user.count({
    where: { role: "EMPLOYEE" },
  });
  const presentCount = todayAttendance.filter(
    (a) => a.status === "PRESENT",
  ).length;
  const absentCount = totalEmployees - presentCount;
  const halfDayCount = todayAttendance.filter((a) => a.halfDay).length;

  // Pending leave requests
  const pendingLeaves = await prisma.leave.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Pending advance requests
  const pendingAdvances = await prisma.advanceSalary.findMany({
    where: { status: "PENDING" },
    include: { user: { select: { name: true, monthlySalary: true } } },
    orderBy: { requestedAt: "desc" },
    take: 5,
  });

  // Recent employees (last 5 by joinedAt, fallback to createdAt)
  const recentEmployees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    orderBy: [{ joinedAt: "desc" }, { createdAt: "desc" }],
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      monthlySalary: true,
      createdAt: true,
      joinedAt: true,
    },
  });

  // Monthly attendance trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const last30DaysAttendance = await prisma.attendance.findMany({
    where: { date: { gte: thirtyDaysAgo } },
    select: { date: true, status: true, halfDay: true },
  });

  const grouped = last30DaysAttendance.reduce<
    Record<string, { date: Date; present: number; halfDays: number }>
  >((acc, record) => {
    const dateStr = record.date.toISOString().split("T")[0];
    if (!acc[dateStr]) {
      acc[dateStr] = { date: record.date, present: 0, halfDays: 0 };
    }
    if (record.status === "PRESENT") acc[dateStr].present++;
    if (record.halfDay) acc[dateStr].halfDays++;
    return acc;
  }, {});

  const monthlyAttendance = Object.values(grouped).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  return {
    stats: {
      totalEmployees,
      presentToday: presentCount,
      absentToday: absentCount,
      halfDayToday: halfDayCount,
      attendanceRate: totalEmployees
        ? Math.round((presentCount / totalEmployees) * 100)
        : 0,
    },
    pendingLeaves: pendingLeaves.map((leave) => ({
      id: leave.id,
      user: leave.user,
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason ?? "",
    })),
    pendingAdvances: pendingAdvances.map((advance) => ({
      id: advance.id,
      user: advance.user,
      amount: advance.amount,
      reason: advance.reason ?? "",
    })),
    recentEmployees,
    monthlyAttendance,
  };
}
