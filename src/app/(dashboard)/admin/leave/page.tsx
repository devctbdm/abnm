import { requireRole } from "@/lib/auth";
import { getAllLeaves } from "@/actions/leave";
import { AdminLeaveClient } from "./admin-leave-client";

export default async function AdminLeavePage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const initialData = await getAllLeaves();

  return <AdminLeaveClient session={session} initialData={initialData} />;
}
