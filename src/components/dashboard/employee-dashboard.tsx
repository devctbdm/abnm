"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  CalendarCheck,
  FileText,
  HandCoins,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  Wallet,
  Gift,
} from "lucide-react";
import { formatCurrency } from "@/lib/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardHover = {
  scale: 1.02,
  transition: { type: "spring" as const, stiffness: 300, damping: 20 },
} as const;

interface DashboardData {
  name: string;
  email: string;
  monthlySalary: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveQuota: number;
  usedLeaves: number;
  leaveRemaining: number;
  totalAdvance: number;
  eidBonus: number;
  attendanceDeduction: number;
  netSalary: number;
}

interface EmployeeDashboardClientProps {
  session: { userId: string; name: string; role: string };
  initialData: DashboardData;
}

export function EmployeeDashboardClient({
  session,
  initialData,
}: EmployeeDashboardClientProps) {
  const data = initialData;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-4 md:p-6 space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={fadeInUp}>
        <div className="rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-2xl font-bold md:text-3xl">
            Welcome back, {data.name} 👋
          </h1>
          <p className="mt-1 text-blue-100">
            Here's your attendance and salary summary for this month.
          </p>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={fadeInUp} whileHover={cardHover}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Present Days
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {data.presentDays}
              </div>
              <p className="text-xs text-muted-foreground">
                Half days: {data.halfDays}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} whileHover={cardHover}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Absent Days</CardTitle>
              <UserX className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {data.absentDays}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} whileHover={cardHover}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Leave Remaining
              </CardTitle>
              <CalendarDays className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {data.leaveRemaining}
              </div>
              <p className="text-xs text-muted-foreground">
                Used: {data.usedLeaves} / {data.leaveQuota}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp} whileHover={cardHover}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Advance Taken
              </CardTitle>
              <HandCoins className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(data.totalAdvance)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your daily tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href="/employee/mark-attendance">
                <Button variant="default" className="gap-2">
                  <CalendarCheck className="h-4 w-4" /> Mark Attendance
                </Button>
              </Link>
              <Link href="/employee/leave">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" /> Apply Leave
                </Button>
              </Link>
              <Link href="/employee/advance">
                <Button variant="outline" className="gap-2">
                  <HandCoins className="h-4 w-4" /> Request Advance
                </Button>
              </Link>
              <Link href="/employee/stats">
                <Button variant="ghost" className="gap-2">
                  <TrendingUp className="h-4 w-4" /> Full Stats
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Salary Breakdown */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Salary Breakdown (This Month)</CardTitle>
            <CardDescription>
              Calculated based on attendance and advances
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Base Salary</span>
                <span className="font-medium">
                  {formatCurrency(data.monthlySalary)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">
                  Attendance Deduction
                </span>
                <span className="font-medium text-red-600">
                  -{formatCurrency(data.attendanceDeduction)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Advance Deduction</span>
                <span className="font-medium text-orange-600">
                  -{formatCurrency(data.totalAdvance)}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-mutedsm-foreground">Eid Bonus</span>
                <span className="font-medium text-green-600">
                  +{formatCurrency(data.eidBonus)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold">Net Salary</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(data.netSalary)}
                </span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground text-center mt-4">
              * Final salary may vary based on attendance and other adjustments.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
