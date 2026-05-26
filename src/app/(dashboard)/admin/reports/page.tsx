import { requireRole } from "@/lib/auth";
import { AdminReportsClient } from "./admin-reports-client";

export default async function AdminReportsPage() {
  await requireRole(["OWNER", "ADMIN"]);
  return <AdminReportsClient />;
}
