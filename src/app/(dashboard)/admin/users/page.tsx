import { requireRole } from "@/lib/auth";
import { getAllUsers } from "@/actions/user";
import { AdminUsersClient } from "./admin-users-client";

export default async function AdminUsersPage() {
  const session = await requireRole(["OWNER", "ADMIN"]);
  const initialUsers = await getAllUsers();

  return <AdminUsersClient session={session} initialUsers={initialUsers} />;
}
