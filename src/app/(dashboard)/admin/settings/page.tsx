import { requireRole } from "@/lib/auth";
import { getAllSettings, getWorkingDaysForMonths } from "@/actions/settings";
import { getFestivalBonuses } from "@/actions/festival-bonus";
import { AdminSettingsClient } from "./admin-settings-client";

export default async function AdminSettingsPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const settings = await getAllSettings();
  const workingDaysHistory = await getWorkingDaysForMonths();
  const festivalBonuses = await getFestivalBonuses();

  return (
    <AdminSettingsClient
      session={session}
      initialSettings={settings}
      initialWorkingDays={workingDaysHistory}
      initialFestivalBonuses={festivalBonuses}
    />
  );
}
