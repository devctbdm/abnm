import { requireRole } from "@/lib/auth";
import { getEmployeeAttendanceOverview } from "@/actions/attendance";
import { EmployeeAttendanceClient } from "./employee-attendance-client";

export default async function EmployeeAttendancePage() {
  const session = await requireRole(["EMPLOYEE"]);
  const data = await getEmployeeAttendanceOverview(session.userId);

  return <EmployeeAttendanceClient session={session} initialData={data} />;
}
