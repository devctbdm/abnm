import { requireRole } from "@/lib/auth";
import { getAllHolidays } from "@/actions/holiday";
import { AdminHolidayClient } from "./admin-holiday-client";

export default async function AdminHolidayPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const holidays = await getAllHolidays();
  return <AdminHolidayClient session={session} initialHolidays={holidays} />;
}
