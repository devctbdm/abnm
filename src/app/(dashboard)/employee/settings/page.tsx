import { requireRole } from "@/lib/auth";
import { getEmployeeProfile } from "@/actions/profile";
import { EmployeeSettingsClient } from "./employee-settings-client";

export default async function EmployeeSettingsPage() {
  const session = await requireRole(["EMPLOYEE"]);
  const profile = await getEmployeeProfile();
  if (!profile) throw new Error("Profile not found");

  return <EmployeeSettingsClient session={session} profile={profile} />;
}
