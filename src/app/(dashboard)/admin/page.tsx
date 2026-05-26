// src/app/(dashboard)/page.tsx
import { requireRole } from "@/lib/auth";
import { getAdminDashboardData } from "@/actions/dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function AdminDashboardPage() {
  // Owner or Admin only – redirects if employee
  const session = await requireRole(["OWNER", "ADMIN"]);
  const data = await getAdminDashboardData();

  return <AdminDashboard session={session} initialData={data} />;
}
