import { requireRole } from "@/lib/auth";
import { getTodayAttendance } from "@/actions/attendance";
import { MarkAttendanceClient } from "./mark-attendance-client";

export default async function MarkAttendancePage() {
  const session = await requireRole(["EMPLOYEE"]);
  const todayStatus = await getTodayAttendance(session.userId);

  return <MarkAttendanceClient session={session} initialStatus={todayStatus} />;
}
