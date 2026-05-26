// src/actions/settings.ts
"use server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getAllSettings() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const globalSettings = await prisma.globalSetting.findMany();
  const settingsMap: Record<string, string> = {};
  globalSettings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  // Default values if not set
  return {
    companyName: settingsMap.companyName || "AB‑Network",
    eidBonus: settingsMap.eidBonus ? parseFloat(settingsMap.eidBonus) : 5000,
    defaultWorkingDays: settingsMap.defaultWorkingDays
      ? parseInt(settingsMap.defaultWorkingDays)
      : 22,
    advancePercentage: settingsMap.advancePercentage
      ? parseInt(settingsMap.advancePercentage)
      : 50,
    ...settingsMap,
  };
}

export async function updateGlobalSetting(key: string, value: string) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  await prisma.globalSetting.upsert({
    where: { key },
    update: { value, updatedAt: new Date() },
    create: { key, value },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function getWorkingDaysForMonths() {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const records = await prisma.workingDaySetting.findMany({
    orderBy: { month: "desc" },
    take: 12,
  });
  return records.map((r) => ({
    id: r.id,
    month: r.month.toISOString(),
    daysCount: r.daysCount,
    notes: r.notes,
    setBy: r.setBy,
  }));
}

export async function setWorkingDays(
  month: string,
  daysCount: number,
  notes?: string,
) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    throw new Error("Unauthorized");
  }

  const [year, monthNum] = month.split("-").map(Number);
  const monthDate = new Date(Date.UTC(year, monthNum - 1, 1));
  const days = Number(daysCount);

  await prisma.workingDaySetting.upsert({
    where: { month: monthDate },
    update: { daysCount: days, notes: notes || null, setBy: session.userId },
    create: {
      month: monthDate,
      daysCount: days,
      notes: notes || null,
      setBy: session.userId,
    },
  });

  revalidatePath("/admin/settings");
  return { success: true };
}
