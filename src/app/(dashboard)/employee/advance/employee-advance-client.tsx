"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Plus, HandCoins, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { requestAdvance } from "@/actions/advance";
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

type Advance = {
  id: string;
  amount: number;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
  deductedInSalary: boolean;
  requestedAt: string;
  approvedAt: string | null;
};

interface NetSalaryInfo {
  monthlySalary: number;
  netSalary: number;
  absentDays: number;
  halfDays: number;
  attendanceDeduction: number;
  advanceDeduction: number;
  daysInMonth: number;
  dailyRate: number;
}

interface EmployeeAdvanceClientProps {
  session: { userId: string; name: string; role: string };
  initialAdvances: Advance[];
  advancePercentage: number;
  netSalaryInfo: NetSalaryInfo;
}

export function EmployeeAdvanceClient({
  session,
  initialAdvances,
  advancePercentage,
  netSalaryInfo,
}: EmployeeAdvanceClientProps) {
  const [advances, setAdvances] = useState(initialAdvances);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const maxAdvance = netSalaryInfo.netSalary * (advancePercentage / 100);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (numAmount > maxAdvance) {
      toast.error(`Maximum advance limit is Tk ${maxAdvance.toLocaleString()}`);
      return;
    }
    setLoading(true);
    try {
      const result = await requestAdvance(numAmount, reason);
      if (result.success) {
        const newAdvance = result.advance;
        setAdvances((prev) => [
          {
            id: newAdvance.id,
            amount: newAdvance.amount,
            reason: newAdvance.reason,
            status: "PENDING",
            deductedInSalary: false,
            requestedAt: newAdvance.requestedAt.toISOString(),
            approvedAt: null,
          },
          ...prev,
        ]);
        toast.success("Advance request submitted");
        setDialogOpen(false);
        setAmount("");
        setReason("");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit request");
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
      case "PAID":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Paid
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto min-h-[calc(100vh-10rem)]"
    >
      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Advance Salary</h1>
          <p className="text-muted-foreground">
            Request advance against your salary
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Request Advance
        </Button>
      </motion.div>

      {/* Info Card */}
      <motion.div variants={fadeInUp}>
        <Card className="bg-muted/30">
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Gross Monthly Salary
                </p>
                <p className="text-xl font-bold">
                  {formatCurrency(netSalaryInfo.monthlySalary)}
                </p>
              </div>
              {(netSalaryInfo.absentDays > 0 || netSalaryInfo.halfDays > 0) && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Deductions (Absent: {netSalaryInfo.absentDays}d, Half:{" "}
                    {netSalaryInfo.halfDays}d)
                  </p>
                  <p className="text-lg font-semibold text-red-500">
                    - {formatCurrency(netSalaryInfo.attendanceDeduction)}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">
                  Current Month Net Salary
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(netSalaryInfo.netSalary)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Max Advance ({advancePercentage}% of net)
                </p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(maxAdvance)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground border-t pt-3">
              <AlertCircle className="h-3 w-3" /> Approved advances will be
              deducted from future salary
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Request History */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
            <CardDescription>All your advance requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {advances.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No advance requests found.
                </div>
              ) : (
                advances.map((adv, idx) => (
                  <motion.div
                    key={adv.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <HandCoins className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatCurrency(adv.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {adv.reason || "No reason"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(adv.status)}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(adv.requestedAt), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Advance Salary</DialogTitle>
            <DialogDescription>
              Enter amount and reason (optional). Maximum {advancePercentage}%
              of your monthly salary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (Tk)</Label>
              <Input
                type="number"
                placeholder="e.g., 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                rows={3}
                placeholder="Brief reason for advance"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Maximum allowed: Tk {maxAdvance.toLocaleString()} (
              {advancePercentage}% of net salary)
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
