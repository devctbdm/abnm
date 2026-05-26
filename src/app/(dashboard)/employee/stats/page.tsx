import { requireRole } from "@/lib/auth";
import { getEmployeeStats } from "@/actions/employee-stats";
import { EmployeeStatsClient } from "./employee-stats-client";

export default async function EmployeeStatsPage() {
  const session = await requireRole(["EMPLOYEE"]);
  const data = await getEmployeeStats(session.userId);

  return <EmployeeStatsClient session={session} initialData={data} />;
}
