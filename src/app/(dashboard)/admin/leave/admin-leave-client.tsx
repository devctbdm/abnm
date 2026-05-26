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
import { toast } from "sonner";
import { CheckCircle, XCircle, Trash2, Search } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { updateLeaveStatus, deleteLeave } from "@/actions/leave";

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

type LeaveWithUser = {
  id: string;
  type: "SICK" | "CASUAL" | "ANNUAL";
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    leaveQuota: number;
  };
};

interface AdminLeaveClientProps {
  session: { userId: string; name: string; role: string };
  initialData: LeaveWithUser[];
}

export function AdminLeaveClient({
  session,
  initialData,
}: AdminLeaveClientProps) {
  const [leaves, setLeaves] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeave, setSelectedLeave] = useState<LeaveWithUser | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "delete" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredLeaves = leaves.filter(
    (leave) =>
      leave.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (leave.reason &&
        leave.reason.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const pendingLeaves = filteredLeaves.filter((l) => l.status === "PENDING");
  const approvedLeaves = filteredLeaves.filter((l) => l.status === "APPROVED");
  const rejectedLeaves = filteredLeaves.filter((l) => l.status === "REJECTED");

  const handleAction = async () => {
    if (!selectedLeave || !actionType) return;
    setIsLoading(true);

    try {
      if (actionType === "approve") {
        await updateLeaveStatus(selectedLeave.id, "APPROVED");
        setLeaves((prev) =>
          prev.map((l) =>
            l.id === selectedLeave.id ? { ...l, status: "APPROVED" } : l,
          ),
        );
        toast.success(`Leave request approved for ${selectedLeave.user.name}`);
      } else if (actionType === "reject") {
        await updateLeaveStatus(selectedLeave.id, "REJECTED");
        setLeaves((prev) =>
          prev.map((l) =>
            l.id === selectedLeave.id ? { ...l, status: "REJECTED" } : l,
          ),
        );
        toast.info(`Leave request rejected`);
      } else if (actionType === "delete") {
        await deleteLeave(selectedLeave.id);
        setLeaves((prev) => prev.filter((l) => l.id !== selectedLeave.id));
        toast.success(`Leave record deleted`);
      }
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsLoading(false);
      setDialogOpen(false);
      setSelectedLeave(null);
      setActionType(null);
    }
  };

  const openDialog = (
    leave: LeaveWithUser,
    type: "approve" | "reject" | "delete",
  ) => {
    setSelectedLeave(leave);
    setActionType(type);
    setDialogOpen(true);
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "SICK":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Sick
          </Badge>
        );
      case "CASUAL":
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            Casual
          </Badge>
        );
      case "ANNUAL":
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
            Annual
          </Badge>
        );
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getDaysCount = (start: string, end: string) => {
    return differenceInDays(new Date(end), new Date(start)) + 1;
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
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-muted-foreground">
            Review and manage employee leave requests
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedLeaves.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({rejectedLeaves.length})
            </TabsTrigger>
          </TabsList>

          {["pending", "approved", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">
                    {tab} Leave Requests
                  </CardTitle>
                  <CardDescription>
                    {tab === "pending"
                      ? "Leave requests awaiting your decision"
                      : tab === "approved"
                        ? "Approved leaves (deducted from quota)"
                        : "Declined leave requests"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       <AnimatePresence>
                        {(() => {
                          let data: LeaveWithUser[] = [];
                          if (tab === "pending") data = pendingLeaves;
                          else if (tab === "approved") data = approvedLeaves;
                          else data = rejectedLeaves;

                          if (data.length === 0) {
                            return (
                              <TableRow>
                                <TableCell
                                  colSpan={8}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No {tab} leave requests
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return data.map((leave, idx) => (
                            <motion.tr
                              key={leave.id}
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
                                    {leave.user.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {leave.user.email}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{getTypeBadge(leave.type)}</TableCell>
                              <TableCell className="text-sm">
                                {format(new Date(leave.startDate), "MMM dd")} –{" "}
                                {format(new Date(leave.endDate), "MMM dd")}
                              </TableCell>
                              <TableCell className="text-sm font-medium">
                                {getDaysCount(leave.startDate, leave.endDate)}{" "}
                                days
                              </TableCell>
                              <TableCell>
                                <p className="max-w-[200px] truncate">
                                  {leave.reason || "—"}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {format(
                                  new Date(leave.createdAt),
                                  "MMM dd, yyyy",
                                )}
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(leave.status)}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {leave.status === "PENDING" && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() =>
                                          openDialog(leave, "approve")
                                        }
                                      >
                                        <CheckCircle className="mr-1 h-3 w-3" />{" "}
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          openDialog(leave, "reject")
                                        }
                                      >
                                        <XCircle className="mr-1 h-3 w-3" />{" "}
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {(leave.status === "APPROVED" ||
                                    leave.status === "REJECTED") && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        openDialog(leave, "delete")
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

      {/* Quick stats cards */}
      <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leaves.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Approved Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaves.length
                ? Math.round((approvedLeaves.length / leaves.length) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingLeaves.length}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Leave Request"}
              {actionType === "reject" && "Reject Leave Request"}
              {actionType === "delete" && "Delete Leave Record"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" &&
                `Are you sure you want to approve ${selectedLeave?.user.name}'s leave request from ${selectedLeave ? format(new Date(selectedLeave.startDate), "MMM dd") : ""} to ${selectedLeave ? format(new Date(selectedLeave.endDate), "MMM dd") : ""}?`}
              {actionType === "reject" &&
                `Are you sure you want to reject ${selectedLeave?.user.name}'s leave request?`}
              {actionType === "delete" &&
                `This action cannot be undone. The leave record for ${selectedLeave?.user.name} will be permanently deleted.`}
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
              variant={actionType === "approve" ? "default" : "destructive"}
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
    </motion.div>
  );
}
