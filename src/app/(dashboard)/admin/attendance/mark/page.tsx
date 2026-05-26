import { requireRole } from "@/lib/auth";
import { getAllEmployees } from "@/actions/attendance";
import { AdminMarkAttendanceClient } from "./admin-mark-attendance-client";

export default async function AdminMarkAttendancePage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const employees = await getAllEmployees();
  return <AdminMarkAttendanceClient session={session} employees={employees} />;
}
