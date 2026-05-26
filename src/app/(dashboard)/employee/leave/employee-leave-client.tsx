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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { applyLeave } from "@/actions/leave";

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

type Leave = {
  id: string;
  type: "SICK" | "CASUAL" | "ANNUAL";
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

interface EmployeeLeaveClientProps {
  session: { userId: string; name: string; role: string };
  initialLeaves: Leave[];
  initialQuota: { total: number; used: number; remaining: number };
}

export function EmployeeLeaveClient({
  session,
  initialLeaves,
  initialQuota,
}: EmployeeLeaveClientProps) {
  const [leaves, setLeaves] = useState(initialLeaves);
  const [quota, setQuota] = useState(initialQuota);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "CASUAL" as "SICK" | "CASUAL" | "ANNUAL",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    reason: "",
  });
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (formData.startDate > formData.endDate) {
      toast.error("End date must be after start date");
      return;
    }
    const days =
      differenceInDays(
        new Date(formData.endDate),
        new Date(formData.startDate),
      ) + 1;
    if (days > quota.remaining) {
      toast.error(`You only have ${quota.remaining} leave days remaining`);
      return;
    }
    setLoading(true);
    try {
      const result = await applyLeave(formData);
      if (result.success) {
        const newLeave = result.leave;
        setLeaves((prev) => [
          {
            id: newLeave.id,
            type: newLeave.type,
            startDate: newLeave.startDate,
            endDate: newLeave.endDate,
            reason: newLeave.reason,
            status: "PENDING",
            createdAt: newLeave.createdAt,
          },
          ...prev,
        ]);
        toast.success("Leave request submitted successfully");
        setDialogOpen(false);
        setFormData({
          type: "CASUAL",
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: format(new Date(), "yyyy-MM-dd"),
          reason: "",
        });
      }
    } catch (error) {
      toast.error("Failed to submit leave request");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Pending
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Approved
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "SICK":
        return <Badge className="bg-blue-100 text-blue-700">Sick</Badge>;
      case "CASUAL":
        return <Badge className="bg-purple-100 text-purple-700">Casual</Badge>;
      case "ANNUAL":
        return <Badge className="bg-orange-100 text-orange-700">Annual</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getDaysCount = (start: string, end: string) =>
    differenceInDays(new Date(end), new Date(start)) + 1;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-4 md:p-6 space-y-6 min-h-[calc(100vh-9rem)]"
    >
      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">My Leave Requests</h1>
          <p className="text-muted-foreground">
            Apply for leave and track your requests
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          disabled={quota.remaining <= 0}
        >
          <Plus className="mr-2 h-4 w-4" /> Apply Leave
        </Button>
      </motion.div>

      {/* Leave Quota Card */}
      <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Quota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quota.total} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Used Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {quota.used} days
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quota.remaining} days
            </div>
            <Progress
              value={(quota.used / quota.total) * 100}
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Leave History */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
            <CardDescription>All your leave requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {leaves.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No leave requests found.
                </div>
              ) : (
                leaves.map((leave, idx) => (
                  <motion.div
                    key={leave.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 last:border-0"
                  >
                    <div className="flex flex-wrap gap-2 items-center">
                      {getTypeBadge(leave.type)}
                      {getStatusBadge(leave.status)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">
                        {format(new Date(leave.startDate), "MMM dd")} –{" "}
                        {format(new Date(leave.endDate), "MMM dd")} (
                        {getDaysCount(leave.startDate, leave.endDate)} days)
                      </p>
                      {leave.reason && (
                        <p className="text-xs text-muted-foreground">
                          {leave.reason}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(leave.createdAt), "MMM dd, yyyy")}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Apply Leave Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
            <DialogDescription>Fill in the details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select
                value={formData.type}
                onValueChange={(val: any) =>
                  setFormData((prev) => ({ ...prev, type: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SICK">Sick Leave</SelectItem>
                  <SelectItem value="CASUAL">Casual Leave</SelectItem>
                  <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                rows={3}
                placeholder="Optional: reason for leave"
                value={formData.reason}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
              />
            </div>
            <div className="text-sm text-muted-foreground">
              Total days: {getDaysCount(formData.startDate, formData.endDate)}{" "}
              days
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
