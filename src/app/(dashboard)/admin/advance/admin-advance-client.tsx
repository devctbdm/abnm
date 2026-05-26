"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  Plus,
  HandCoins,
} from "lucide-react";
import { format } from "date-fns";
import {
  updateAdvanceStatus,
  deleteAdvance,
  createAdvanceForUser,
} from "@/actions/advance";
import { formatCurrency } from "@/lib/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

type AdvanceWithUser = {
  id: string;
  amount: number;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  deductedInSalary: boolean;
  requestedAt: string;
  approvedAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    monthlySalary: number;
  };
};

interface AdminAdvanceClientProps {
  session: { userId: string; name: string; role: string };
  initialData: AdvanceWithUser[];
  employees: Array<{
    id: string;
    name: string;
    email: string;
    monthlySalary: number;
  }>;
}

export function AdminAdvanceClient({
  session,
  initialData,
  employees,
}: AdminAdvanceClientProps) {
  const [advances, setAdvances] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdvance, setSelectedAdvance] =
    useState<AdvanceWithUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "delete" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  // Create advance state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceReason, setAdvanceReason] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filteredAdvances = advances.filter(
    (adv) =>
      adv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adv.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (adv.reason &&
        adv.reason.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const pendingAdvances = filteredAdvances.filter(
    (a) => a.status === "PENDING",
  );
  const approvedAdvances = filteredAdvances.filter(
    (a) => a.status === "APPROVED",
  );
  const rejectedAdvances = filteredAdvances.filter(
    (a) => a.status === "REJECTED",
  );
  const paidAdvances = filteredAdvances.filter((a) => a.status === "PAID");

  const handleAction = async () => {
    if (!selectedAdvance || !actionType) return;
    setIsLoading(true);

    try {
      if (actionType === "approve") {
        await updateAdvanceStatus(selectedAdvance.id, "APPROVED");
        setAdvances((prev) =>
          prev.map((a) =>
            a.id === selectedAdvance.id
              ? {
                  ...a,
                  status: "APPROVED",
                  approvedAt: new Date().toISOString(),
                }
              : a,
          ),
        );
        toast.success(
          `Advance of ${formatCurrency(selectedAdvance.amount || 0)} approved`,
        );
      } else if (actionType === "reject") {
        await updateAdvanceStatus(selectedAdvance.id, "REJECTED");
        setAdvances((prev) =>
          prev.map((a) =>
            a.id === selectedAdvance.id ? { ...a, status: "REJECTED" } : a,
          ),
        );
        toast.info(`Advance request rejected`);
      } else if (actionType === "delete") {
        await deleteAdvance(selectedAdvance.id);
        setAdvances((prev) => prev.filter((a) => a.id !== selectedAdvance.id));
        toast.success(`Advance record deleted`);
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
      setSelectedAdvance(null);
      setActionType(null);
    }
  };

  const openDialog = (
    advance: AdvanceWithUser,
    type: "approve" | "reject" | "delete",
  ) => {
    setSelectedAdvance(advance);
    setActionType(type);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setSelectedUserId(employees.length > 0 ? employees[0].id : "");
    setAdvanceAmount("");
    setAdvanceReason("");
    setCreateDialogOpen(true);
  };

  const handleCreateAdvance = async () => {
    if (!selectedUserId) {
      toast.error("Please select an employee");
      return;
    }
    const amount = parseFloat(advanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setIsCreating(true);
    try {
      const result = await createAdvanceForUser(
        selectedUserId,
        amount,
        advanceReason,
      );
      const user = employees.find((e) => e.id === selectedUserId);
      const newAdvance: AdvanceWithUser = {
        id: result.advance.id,
        amount: result.advance.amount,
        reason: result.advance.reason,
        status: "APPROVED",
        deductedInSalary: false,
        requestedAt: result.advance.requestedAt,
        approvedAt: result.advance.approvedAt ?? new Date().toISOString(),
        user: {
          id: selectedUserId,
          name: user?.name ?? "",
          email: user?.email ?? "",
          monthlySalary: user?.monthlySalary ?? 0,
        },
      };
      setAdvances((prev) => [newAdvance, ...prev]);
      toast.success(
        `Advance of ${formatCurrency(amount)} created for ${user?.name}`,
      );
      setCreateDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create advance",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
          >
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
          >
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          >
            Rejected
          </Badge>
        );
      case "PAID":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          >
            Paid
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-4 md:p-6 space-y-6"
    >
      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Advance Salary Management</h1>
          <p className="text-muted-foreground">
            Review and manage employee advance requests
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" /> Create Advance
          </Button>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({pendingAdvances.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedAdvances.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedAdvances.length})
            </TabsTrigger>
            <TabsTrigger value="paid">Paid ({paidAdvances.length})</TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected", "paid"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {tab} Advance Requests
                  </CardTitle>
                  <CardDescription>
                    {tab === "pending"
                      ? "Requests waiting for your approval"
                      : tab === "approved"
                        ? "Approved advances (will be deducted from salary)"
                        : tab === "rejected"
                          ? "Requests that were declined"
                          : "Advances that have been paid out"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Requested On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {(() => {
                          let data: AdvanceWithUser[] = [];
                          if (tab === "pending") data = pendingAdvances;
                          else if (tab === "approved") data = approvedAdvances;
                          else if (tab === "rejected") data = rejectedAdvances;
                          else data = paidAdvances;

                          if (data.length === 0) {
                            return (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center text-muted-foreground"
                                >
                                  No {tab} advance requests
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return data.map((advance, idx) => (
                            <motion.tr
                              key={advance.id}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              transition={{ delay: idx * 0.02 }}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {advance.user.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {advance.user.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(advance.amount)}
                              </TableCell>
                              <TableCell>
                                <p className="max-w-[200px] truncate">
                                  {advance.reason || "—"}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(
                                  new Date(advance.requestedAt),
                                  "MMM dd, yyyy",
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(advance.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {advance.status === "PENDING" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() =>
                                          openDialog(advance, "approve")
                                        }
                                      >
                                        <CheckCircle className="mr-1 h-3 w-3" />{" "}
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          openDialog(advance, "reject")
                                        }
                                      >
                                        <XCircle className="mr-1 h-3 w-3" />{" "}
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {(advance.status === "APPROVED" ||
                                    advance.status === "REJECTED" ||
                                    advance.status === "PAID") && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        openDialog(advance, "delete")
                                      }
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </motion.tr>
                          ));
                        })()}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Advance Request"}
              {actionType === "reject" && "Reject Advance Request"}
              {actionType === "delete" && "Delete Advance Record"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" &&
                `Are you sure you want to approve ${formatCurrency(selectedAdvance?.amount || 0)} advance for ${selectedAdvance?.user.name}? This amount will be deducted from their next salary.`}
              {actionType === "reject" &&
                `Are you sure you want to reject the advance request of ${formatCurrency(selectedAdvance?.amount || 0)} for ${selectedAdvance?.user.name}?`}
              {actionType === "delete" &&
                `This action cannot be undone. The advance record for ${selectedAdvance?.user.name} will be permanently deleted.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant={
                actionType === "approve"
                  ? "default"
                  : actionType === "reject"
                    ? "destructive"
                    : "destructive"
              }
              onClick={handleAction}
              disabled={isLoading}
            >
              {isLoading
                ? "Processing..."
                : actionType === "approve"
                  ? "Approve"
                  : actionType === "reject"
                    ? "Reject"
                    : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Advance Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HandCoins className="h-5 w-5" /> Create Advance for Employee
            </DialogTitle>
            <DialogDescription>
              Create an approved advance request for a selected employee. The
              amount will be deducted from their next salary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Employee</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email}) —{" "}
                    {formatCurrency(emp.monthlySalary)}/mo
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-2">Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                min="1"
              />
            </div>
            <div>
              <Label className="mb-2">Reason (optional)</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Reason for advance"
                value={advanceReason}
                onChange={(e) => setAdvanceReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAdvance} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Advance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
