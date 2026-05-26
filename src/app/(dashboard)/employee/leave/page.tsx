import { requireRole } from "@/lib/auth";
import { getUserLeaves, getLeaveQuota } from "@/actions/leave";
import { EmployeeLeaveClient } from "./employee-leave-client";

export default async function EmployeeLeavePage() {
  const session = await requireRole(["EMPLOYEE"]);
  const leaves = await getUserLeaves(session.userId);
  const quota = await getLeaveQuota(session.userId);

  return (
    <EmployeeLeaveClient
      session={session}
      initialLeaves={leaves}
      initialQuota={quota}
    />
  );
}
