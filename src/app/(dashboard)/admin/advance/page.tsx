// src/app/(dashboard)/admin/advance/page.tsx
import { requireRole } from "@/lib/auth";
import { getAdminAdvances } from "@/actions/advance";
import { getAllUsers } from "@/actions/user";
import { AdminAdvanceClient } from "./admin-advance-client";

export default async function AdminAdvancePage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const initialData = await getAdminAdvances();
  const employees = await getAllUsers();

  return (
    <AdminAdvanceClient
      session={session}
      initialData={initialData}
      employees={employees.filter((u) => u.role === "EMPLOYEE")}
    />
  );
}
