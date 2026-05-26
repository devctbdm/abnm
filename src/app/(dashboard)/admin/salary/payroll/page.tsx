import { requireRole } from "@/lib/auth";
import { getSalaryData } from "@/actions/salary";
import { PayrollClient } from "./payroll-client";

export default async function PayrollPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const now = new Date();
  const initialData = await getSalaryData(now.getFullYear(), now.getMonth());

  return (
    <PayrollClient
      session={session}
      initialData={initialData}
      currentYear={now.getFullYear()}
      currentMonth={now.getMonth()}
    />
  );
}
