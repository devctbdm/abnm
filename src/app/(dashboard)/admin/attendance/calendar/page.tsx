import { requireRole } from "@/lib/auth";
import { getMonthlyAttendance } from "@/actions/attendance";
import { AdminAttendanceCalendar } from "./admin-attendance-calendar";

export default async function AdminAttendanceCalendarPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const now = new Date();
  const initialData = await getMonthlyAttendance(
    now.getFullYear(),
    now.getMonth(),
  );

  return (
    <AdminAttendanceCalendar
      session={session}
      initialData={initialData}
      year={now.getFullYear()}
      month={now.getMonth()}
    />
  );
}
