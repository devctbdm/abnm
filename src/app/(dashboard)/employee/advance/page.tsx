import { requireRole } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getUserAdvances, getCurrentMonthNetSalary } from "@/actions/advance";
import { EmployeeAdvanceClient } from "./employee-advance-client";

export default async function EmployeeAdvancePage() {
  const session = await requireRole(["EMPLOYEE"]);
  const advances = await getUserAdvances(session.userId);

  const advanceSetting = await prisma.globalSetting.findUnique({
    where: { key: "advancePercentage" },
  });
  const advancePercentage = advanceSetting
    ? parseInt(advanceSetting.value)
    : 50;

  const netSalaryInfo = await getCurrentMonthNetSalary(session.userId);

  return (
    <EmployeeAdvanceClient
      session={session}
      initialAdvances={advances}
      advancePercentage={advancePercentage}
      netSalaryInfo={netSalaryInfo}
    />
  );
}
