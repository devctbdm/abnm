import { requireRole } from "@/lib/auth";
import { getAdminProfile } from "@/actions/admin-profile";
import { AdminAccountClient } from "./admin-account-client";

export default async function AdminAccountPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const profile = await getAdminProfile();
  if (!profile) throw new Error("Profile not found");
  return <AdminAccountClient session={session} profile={profile} />;
}
