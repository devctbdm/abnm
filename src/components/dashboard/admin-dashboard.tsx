// src/components/dashboard/admin-dashboard.tsx
"use client";

import { motion, easeOut } from "motion/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

import {
  Users,
  UserCheck,
  UserX,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/constants";
import { updateAdvanceStatus } from "@/actions/advance";
import { updateLeaveStatus } from "@/actions/leave";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardHover = {
  scale: 1.02,
  transition: { type: "spring" as const, stiffness: 300, damping: 20 },
};

interface AdminDashboardProps {
  session: { name: string; role: string };
  initialData: {
    stats: {
      totalEmployees: number;
      presentToday: number;
      absentToday: number;
      halfDayToday: number;
      attendanceRate: number;
    };
    pendingLeaves: Array<{
      id: string;
      user: { name: string; email: string };
      startDate: Date;
      endDate: Date;
      reason: string;
    }>;
    pendingAdvances: Array<{
      id: string;
      user: { name: string; monthlySalary: number };
      amount: number;
      reason: string;
    }>;
    recentEmployees: Array<{
      id: string;
      name: string;
      email: string;
      monthlySalary: number;
      createdAt: Date;
      joinedAt: Date | null;
    }>;
    monthlyAttendance: Array<{ date: Date; present: number; halfDays: number }>;
  };
}

export function AdminDashboard({ session, initialData }: AdminDashboardProps) {
  const [data, setData] = useState(initialData);
  const [loadingAdvances, setLoadingAdvances] = useState<Set<string>>(
    new Set(),
  );
  const [loadingLeaves, setLoadingLeaves] = useState<Set<string>>(new Set());

  async function handleAdvanceAction(
    id: string,
    status: "APPROVED" | "REJECTED",
  ) {
    setLoadingAdvances((prev) => new Set(prev).add(id));
    try {
      await updateAdvanceStatus(id, status);
      toast.success(`Advance ${status.toLowerCase()} successfully`);
      setData((prev) => ({
        ...prev,
        pendingAdvances: prev.pendingAdvances.filter((a) => a.id !== id),
      }));
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingAdvances((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  async function handleLeaveAction(
    id: string,
    status: "APPROVED" | "REJECTED",
  ) {
    setLoadingLeaves((prev) => new Set(prev).add(id));
    try {
      await updateLeaveStatus(id, status);
      toast.success(`Leave ${status.toLowerCase()} successfully`);
      setData((prev) => ({
        ...prev,
        pendingLeaves: prev.pendingLeaves.filter((l) => l.id !== id),
      }));
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoadingLeaves((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-6 p-4 md:p-6"
    >
      {/* Welcome Banner */}
      <motion.div
        variants={fadeInUp}
        className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white"
      >
        <h1 className="text-2xl font-bold md:text-3xl">
          Welcome back, {session.name} 👋
        </h1>
        <p className="mt-1 text-blue-100">
          Here's what's happening with your team today.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={fadeInUp} whileHover={cardHover}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.totalEmployees}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeInUp} whileHover={cardHover}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Present Today
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.stats.presentToday}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.stats.attendanceRate}% attendance
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeInUp} whileHover={cardHover}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Absent Today
              </CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data.stats.absentToday}
              </div>
              {data.stats.halfDayToday > 0 && (
                <p className="text-xs text-muted-foreground">
                  {data.stats.halfDayToday} half‑day
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={fadeInUp} whileHover={cardHover}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Requests
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.pendingLeaves.length + data.pendingAdvances.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.pendingLeaves.length} leaves,{" "}
                {data.pendingAdvances.length} advances
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Two Column Layout: Pending Leaves & Advances */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Leaves */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Leave Requests</CardTitle>
              <Link href="/admin/leave">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.pendingLeaves.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pending leave requests.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.pendingLeaves.map((leave, idx) => (
                    <motion.div
                      key={leave.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{leave.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(leave.startDate), "MMM dd")} –{" "}
                          {format(new Date(leave.endDate), "MMM dd")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {leave.reason}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={loadingLeaves.has(leave.id)}
                          onClick={() =>
                            handleLeaveAction(leave.id, "APPROVED")
                          }
                        >
                          {loadingLeaves.has(leave.id) ? (
                            "..."
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" /> Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingLeaves.has(leave.id)}
                          onClick={() =>
                            handleLeaveAction(leave.id, "REJECTED")
                          }
                        >
                          {loadingLeaves.has(leave.id) ? (
                            "..."
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" /> Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Pending Advances */}
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Pending Advance Salary</CardTitle>
              <Link href="/admin/advance">
                <Button variant="ghost" size="sm">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.pendingAdvances.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No pending advance requests.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.pendingAdvances.map((adv, idx) => (
                    <motion.div
                      key={adv.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between border-b pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{adv.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Amount: {formatCurrency(adv.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {adv.reason}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          disabled={loadingAdvances.has(adv.id)}
                          onClick={() =>
                            handleAdvanceAction(adv.id, "APPROVED")
                          }
                        >
                          {loadingAdvances.has(adv.id) ? (
                            "..."
                          ) : (
                            <>
                              <CheckCircle className="mr-1 h-3 w-3" /> Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingAdvances.has(adv.id)}
                          onClick={() =>
                            handleAdvanceAction(adv.id, "REJECTED")
                          }
                        >
                          {loadingAdvances.has(adv.id) ? (
                            "..."
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" /> Reject
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Employees Table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Recently Joined Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Monthly Salary</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentEmployees.map((emp, idx) => (
                  <motion.tr
                    key={emp.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>{formatCurrency(emp.monthlySalary)}</TableCell>
                    <TableCell>
                      {emp.joinedAt
                        ? format(new Date(emp.joinedAt), "MMM dd, yyyy")
                        : format(new Date(emp.createdAt), "MMM dd, yyyy")}
                    </TableCell>
                  </motion.tr>
                ))}
                {data.recentEmployees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No employees yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Simple Attendance Trend (last 7 days) */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-end gap-2">
              {data.monthlyAttendance.slice(-7).length > 0 ? (
                data.monthlyAttendance.slice(-7).map((day, idx) => (
                  <div
                    key={idx}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{
                        height: `${(day.present / Math.max(data.stats.totalEmployees, 1)) * 100}%`,
                      }}
                      transition={{ duration: 0.5, delay: idx * 0.05 }}
                      className="w-full bg-blue-500 rounded-t"
                      style={{
                        height: `${(day.present / Math.max(data.stats.totalEmployees, 1)) * 100}%`,
                        minHeight: day.present > 0 ? 4 : 0,
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(day.date), "EEE")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                  No attendance data available yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
