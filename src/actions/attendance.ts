// src/actions/attendance.ts (add)
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function markAttendanceForUser(
  userId: string,
  date: Date,
  status: "PRESENT" | "ABSENT" | "HOLIDAY",
  halfDay: boolean,
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error(
      "Unauthorized – Only admin/owner can mark attendance for others",
    );
  }

  // Holiday cannot be half-day
  if (status === "HOLIDAY") {
    halfDay = false;
  }

  // Normalise date to start of day
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(targetDate.getDate() + 1);

  // Check existing
  const existing = await prisma.attendance.findFirst({
    where: {
      userId,
      date: { gte: targetDate, lt: nextDay },
    },
  });

  if (existing) {
    await prisma.attendance.update({
      where: { id: existing.id },
      data: { status, halfDay },
    });
  } else {
    await prisma.attendance.create({
      data: {
        userId,
        date: targetDate,
        status,
        halfDay,
      },
    });
  }

  revalidatePath("/admin/attendance");
  return { success: true };
}

export async function markAttendance(
  date: Date,
  status: "PRESENT" | "ABSENT" | "HOLIDAY",
  halfDay: boolean,
) {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Normalise date to start of day
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(targetDate.getDate() + 1);

  // Check existing
  const existing = await prisma.attendance.findFirst({
    where: {
      userId: session.userId,
      date: { gte: targetDate, lt: nextDay },
    },
  });

  if (existing) {
    await prisma.attendance.update({
      where: { id: existing.id },
      data: { status, halfDay },
    });
  } else {
    await prisma.attendance.create({
      data: {
        userId: session.userId,
        date: targetDate,
        status,
        halfDay,
      },
    });
  }

  revalidatePath("/admin/attendance");
  return { success: true };
}

export async function getAllEmployees() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  return employees;
}

export async function getAttendanceForUserOnDate(userId: string, date: Date) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(targetDate.getDate() + 1);

  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      date: { gte: targetDate, lt: nextDay },
    },
    select: { status: true, halfDay: true, id: true },
  });
  return attendance;
}

export async function getEmployeeAttendance(
  userId: string,
  year: number,
  month: number,
) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "OWNER" &&
      session.role !== "ADMIN" &&
      session.role !== "EMPLOYEE")
  ) {
    throw new Error("Unauthorized");
  }

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  // Create a map of date strings to attendance records
  const attendanceMap = new Map();
  attendanceRecords.forEach((record) => {
    const dateStr = toLocalDateStr(record.date);
    attendanceMap.set(dateStr, record);
  });

  // Generate all days in the month
  const daysInMonth = endDate.getDate();
  const dates = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = toLocalDateStr(date);
    const record = attendanceMap.get(dateStr);
    dates.push({
      date,
      dateStr,
      day,
      status: record?.status || null,
      halfDay: record?.halfDay || false,
      id: record?.id || null,
    });
  }

  // Get today's status
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const todayRecord = attendanceMap.get(todayStr);

  return {
    year,
    month,
    dates,
    todayStatus: todayRecord?.status || null,
    todayHalfDay: todayRecord?.halfDay || false,
    todayId: todayRecord?.id || null,
  };
}

export async function getMonthlyAttendance(year: number, month: number) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  const daysInMonth = endDate.getDate();

  // Build the date list
  const dates: Array<{ date: Date; dateStr: string; day: number; weekday: string }> = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    dates.push({
      date,
      dateStr: toLocalDateStr(date),
      day,
      weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()],
    });
  }

  // Get all employees
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // Get all attendance for the month
  const allAttendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    select: {
      userId: true,
      date: true,
      status: true,
      halfDay: true,
    },
  });

  // Build attendance map: userId -> dateStr -> attendance
  const attendanceMap = new Map<string, Map<string, { status: string; halfDay: boolean }>>();
  for (const att of allAttendances) {
    if (!attendanceMap.has(att.userId)) {
      attendanceMap.set(att.userId, new Map());
    }
    const dateStr = toLocalDateStr(att.date);
    attendanceMap.get(att.userId)!.set(dateStr, {
      status: att.status,
      halfDay: att.halfDay,
    });
  }

  // Map employees with their attendance
  const employeesWithAttendance = employees.map((emp) => {
    const empAttendance = attendanceMap.get(emp.id) || new Map();
    const attendance = dates.map((d) => ({
      dateStr: d.dateStr,
      status: empAttendance.get(d.dateStr)?.status || null,
      halfDay: empAttendance.get(d.dateStr)?.halfDay || false,
    }));
    return { ...emp, attendance };
  });

  return {
    year,
    month,
    dates,
    employees: employeesWithAttendance,
  };
}

export async function getAttendanceData(startDate: Date, endDate: Date) {
  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return attendances;
}

// Get today's attendance for an employee
export async function getTodayAttendance(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const attendance = await prisma.attendance.findFirst({
    where: {
      userId,
      date: { gte: today, lt: tomorrow },
    },
    select: { status: true, halfDay: true, id: true },
  });

  return {
    status: attendance?.status || null,
    halfDay: attendance?.halfDay || false,
    id: attendance?.id || null,
  };
}

// Mark attendance (already exists, but ensure it's there)
export async function EmployeeMarkAttendance(
  date: Date,
  status: "PRESENT" | "ABSENT" | "HOLIDAY",
  halfDay: boolean,
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);
  if (inputDate.getTime() !== today.getTime()) {
    throw new Error("Can only mark attendance for today");
  }

  const existing = await prisma.attendance.findFirst({
    where: {
      userId: session.userId,
      date: { gte: inputDate, lt: new Date(inputDate.getTime() + 86400000) },
    },
  });

  if (existing) {
    await prisma.attendance.update({
      where: { id: existing.id },
      data: { status, halfDay },
    });
  } else {
    await prisma.attendance.create({
      data: {
        userId: session.userId,
        date: inputDate,
        status,
        halfDay,
      },
    });
  }

  revalidatePath("/employee/markAttendance");
  return { success: true };
}

export async function getEmployeeAttendanceOverview(userId: string) {
  const session = await getSession();
  if (!session || session.userId !== userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, joinedAt: true, createdAt: true },
  });
  if (!user) throw new Error("User not found");

  const joinDate = user.joinedAt ?? user.createdAt;
  const now = new Date();

  // Get attendance for current month
  const currentMonthData = await getEmployeeAttendance(
    userId,
    now.getFullYear(),
    now.getMonth(),
  );

  // Get all-time attendance stats since join date
  const allAttendances = await prisma.attendance.findMany({
    where: {
      userId,
      date: { gte: joinDate },
    },
    select: { status: true, halfDay: true },
  });

  let totalPresent = 0;
  let totalHalf = 0;
  let totalAbsent = 0;
  let totalHoliday = 0;

  for (const att of allAttendances) {
    if (att.status === "HOLIDAY") totalHoliday++;
    else if (att.status === "PRESENT" && att.halfDay) totalHalf++;
    else if (att.status === "PRESENT") totalPresent++;
    else if (att.status === "ABSENT") totalAbsent++;
  }

  const totalDays = totalPresent + totalHalf + totalAbsent + totalHoliday;

  return {
    name: user.name,
    joinDate: joinDate.toISOString(),
    currentMonth: currentMonthData,
    stats: {
      totalDays,
      present: totalPresent,
      halfDays: totalHalf,
      absent: totalAbsent,
      holiday: totalHoliday,
      attendanceRate:
        totalDays > 0
          ? Math.round(
              ((totalPresent + totalHalf * 0.5 + totalHoliday) / totalDays) *
                100,
            )
          : 0,
    },
  };
}

export async function getTodayAttendanceSummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, name: true },
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: today, lt: tomorrow },
      userId: { in: employees.map((e) => e.id) },
    },
    select: { userId: true, status: true, halfDay: true },
  });

  const attendanceMap = new Map(
    attendances.map((a) => [a.userId, { status: a.status, halfDay: a.halfDay }]),
  );

  return employees.map((emp) => {
    const att = attendanceMap.get(emp.id);
    const isHoliday = att?.status === "HOLIDAY";
    return {
      name: emp.name,
      status: isHoliday ? "HOLIDAY" : (att?.status ?? "ABSENT"),
      halfDay: att?.halfDay ?? false,
    };
  });
}

export async function getAdminAttendanceView(
  userIds: string[],
  fromDate: string,
  toDate: string,
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const [sy, sm, sd] = fromDate.split("-").map(Number);
  const [ey, em, ed] = toDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

  const employees = await prisma.user.findMany({
    where: { id: { in: userIds }, role: "EMPLOYEE" },
    select: { id: true, name: true, email: true, joinedAt: true },
    orderBy: { name: "asc" },
  });

  const allAttendances = await prisma.attendance.findMany({
    where: {
      userId: { in: userIds },
      date: { gte: start, lte: end },
    },
    select: {
      userId: true,
      date: true,
      status: true,
      halfDay: true,
    },
    orderBy: { date: "asc" },
  });

  // Group by user then by date
  const attendanceMap = new Map<string, Map<string, { status: string; halfDay: boolean }>>();
  for (const att of allAttendances) {
    if (!attendanceMap.has(att.userId)) {
      attendanceMap.set(att.userId, new Map());
    }
    const dateStr = toLocalDateStr(att.date);
    attendanceMap.get(att.userId)!.set(dateStr, {
      status: att.status,
      halfDay: att.halfDay,
    });
  }

  // Build date list for the range
  const dates: Array<{ dateStr: string; day: number; weekday: string }> = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const dateStr = toLocalDateStr(cursor);
    dates.push({
      dateStr,
      day: cursor.getDate(),
      weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][cursor.getDay()],
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const employeesWithAttendance = employees.map((emp) => {
    const empAttendance = attendanceMap.get(emp.id) || new Map();
    const attendance = dates.map((d) => ({
      dateStr: d.dateStr,
      status: empAttendance.get(d.dateStr)?.status || null,
      halfDay: empAttendance.get(d.dateStr)?.halfDay || false,
    }));
    // Summary
    let present = 0, halfDays = 0, holidays = 0, absent = 0;
    for (const att of attendance) {
      if (att.status === "HOLIDAY") holidays++;
      else if (att.status === "PRESENT") {
        if (att.halfDay) halfDays++;
        else present++;
      } else if (!att.status) { /* future/no record */ }
      else absent++;
    }
    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      joinedAt: emp.joinedAt,
      attendance,
      summary: { present, halfDays, holidays, absent },
    };
  });

  return {
    dates,
    employees: employeesWithAttendance,
    totalDays: dates.length,
  };
}
