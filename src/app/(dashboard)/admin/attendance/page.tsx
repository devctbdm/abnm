import { requireRole } from "@/lib/auth";
import { getAllUsers } from "@/actions/user";
import { getAdminAttendanceView } from "@/actions/attendance";
import { AttendanceClient } from "./attendance-client";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default async function AdminAttendancePage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const users = await getAllUsers();
  const employees = users.filter((u) => u.role === "EMPLOYEE");

  const now = new Date();
  const fromDate = format(startOfMonth(now), "yyyy-MM-dd");
  const toDate = format(endOfMonth(now), "yyyy-MM-dd");

  const initialData = await getAdminAttendanceView(
    employees.map((e) => e.id),
    fromDate,
    toDate,
  );

  return (
    <AttendanceClient
      session={session}
      employees={employees}
      initialData={initialData}
    />
  );
}
