import { requireRole } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSalaryData, getSalaryHistory } from "@/actions/salary";
import {
  getFestivalBonuses,
  getBonusPayments,
  ensureBonusPayments,
} from "@/actions/festival-bonus";
import { AdminSalaryClient } from "./admin-salary-client";

export default async function AdminSalaryPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const now = new Date();
  const currentMonthData = await getSalaryData(
    now.getFullYear(),
    now.getMonth(),
  );
  const salaryHistory = await getSalaryHistory();
  const festivalBonuses = await getFestivalBonuses();

  // Get bonus payments for processed bonuses (backfill missing payment records)
  const processedBonuses = festivalBonuses.filter((b) => b.processed);
  const bonusPaymentsMap: Record<
    string,
    Awaited<ReturnType<typeof getBonusPayments>>
  > = {};
  for (const bonus of processedBonuses) {
    await ensureBonusPayments(bonus.id);
    bonusPaymentsMap[bonus.id] = await getBonusPayments(bonus.id);
  }

  // Build a lookup: key = "userId:month" → bonus payment info
  const allBonusPayments = Object.values(bonusPaymentsMap).flat();
  const bonusLookup: Record<
    string,
    { amount: number; paid: boolean; paidAt: Date | null; festivalName: string }
  > = {};
  for (const bp of allBonusPayments) {
    const festival = processedBonuses.find(
      (f: any) => f.id === bp.festivalBonusId,
    );
    if (!festival) continue;
    const monthKey = `${bp.userId}:${new Date(festival.bonusDate).getFullYear()}-${new Date(festival.bonusDate).getMonth()}`;
    bonusLookup[monthKey] = {
      amount: bp.amount,
      paid: bp.paid,
      paidAt: bp.paidAt,
      festivalName: festival.name,
    };
  }

  return (
    <AdminSalaryClient
      session={session}
      currentMonthData={currentMonthData}
      salaryHistory={salaryHistory}
      festivalBonuses={processedBonuses}
      bonusPaymentsMap={bonusPaymentsMap}
      bonusLookup={bonusLookup}
      currentYear={now.getFullYear()}
      currentMonth={now.getMonth()}
    />
  );
}
