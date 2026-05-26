import { requireRole } from "@/lib/auth";
import { getEmployeeDashboardData } from "@/actions/employee-dashboard";
import { EmployeeDashboardClient } from "@/components/dashboard/employee-dashboard";

export default async function EmployeeDashboardPage() {
  const session = await requireRole(["EMPLOYEE"]);
  const dashboardData = await getEmployeeDashboardData(session.userId);

  return (
    <EmployeeDashboardClient session={session} initialData={dashboardData} />
  );
}
