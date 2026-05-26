"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  TrendingUp,
  Loader2,
  Download,
  CheckCircle,
  Gift,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { runPayroll, markSalaryPaid } from "@/actions/salary";
import { markBonusPaid, markAllBonusesPaid } from "@/actions/festival-bonus";
import * as XLSX from "xlsx";
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

interface SalaryData {
  salaryData: Array<{
    userId: string;
    name: string;
    email: string;
    monthlySalary: number;
    presentDays: number;
    halfDays: number;
    absentDays: number;
    attendanceDeduction: number;
    advanceDeduction: number;
    eidBonus: number;
    netPayable: number;
  }>;
  daysInMonth: number;
  month: string;
}

interface SalaryRecord {
  id: string;
  userId: string;
  month: Date;
  grossSalary: number;
  absentDays: number;
  halfDays: number;
  attendanceDeduction: number;
  advanceDeduction: number;
  eidBonus: number;
  netPayable: number;
  paid: boolean;
  paidAt: Date | null;
  exportedAt: Date | null;
  user: { name: string; email: string };
}

interface BonusPaymentItem {
  id: string;
  festivalBonusId: string;
  userId: string;
  amount: number;
  paid: boolean;
  paidAt: Date | null;
  createdAt: Date;
  user: { id: string; name: string; email: string; monthlySalary: number };
}

interface AdminSalaryClientProps {
  session: { userId: string; name: string; role: string };
  currentMonthData: SalaryData;
  salaryHistory: SalaryRecord[];
  festivalBonuses: any[];
  bonusPaymentsMap: Record<string, BonusPaymentItem[]>;
  bonusLookup: Record<
    string,
    { amount: number; paid: boolean; paidAt: Date | null; festivalName: string }
  >;
  currentYear: number;
  currentMonth: number;
}

export function AdminSalaryClient({
  session,
  currentMonthData,
  salaryHistory,
  festivalBonuses,
  bonusPaymentsMap,
  bonusLookup,
  currentYear,
  currentMonth,
}: AdminSalaryClientProps) {
  const [salaryData, setSalaryData] = useState(currentMonthData);
  const [history, setHistory] = useState(salaryHistory);
  const [bonusPayments, setBonusPayments] =
    useState<Record<string, BonusPaymentItem[]>>(bonusPaymentsMap);
  const [loading, setLoading] = useState(false);
  const [bonusLoading, setBonusLoading] = useState<string | null>(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleRunPayroll = async () => {
    if (
      !confirm(
        "Run payroll for this month? This will create/update salary records and mark advances as deducted.",
      )
    )
      return;
    setPayrollLoading(true);
    try {
      await runPayroll(currentYear, currentMonth);
      // Refresh data
      const newData = await (
        await import("@/actions/salary")
      ).getSalaryData(currentYear, currentMonth);
      setSalaryData(newData as SalaryData);
      const newHistory = await (
        await import("@/actions/salary")
      ).getSalaryHistory();
      setHistory(newHistory as SalaryRecord[]);
      toast.success("Payroll calculated successfully");
    } catch (error) {
      toast.error("Failed to run payroll");
      console.error(error);
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleMarkPaid = async (recordId: string, employeeName: string) => {
    if (!confirm(`Mark salary as paid for ${employeeName}?`)) return;
    setLoading(true);
    try {
      await markSalaryPaid(recordId);
      const newHistory = await (
        await import("@/actions/salary")
      ).getSalaryHistory();
      setHistory(newHistory as SalaryRecord[]);
      toast.success(`Salary marked as paid for ${employeeName}`);
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const exportCurrentToExcel = () => {
    const worksheetData = salaryData.salaryData.map((emp) => ({
      Employee: emp.name,
      Email: emp.email,
      "Monthly Salary": emp.monthlySalary,
      "Present Days": emp.presentDays,
      "Half Days": emp.halfDays,
      "Absent Days": emp.absentDays,
      "Attendance Deduction": emp.attendanceDeduction,
      "Advance Deduction": emp.advanceDeduction,
      "Eid Bonus": emp.eidBonus,
      "Net Payable": emp.netPayable,
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Salary_${monthNames[currentMonth]}_${currentYear}`,
    );
    XLSX.writeFile(
      workbook,
      `salary_${currentYear}_${monthNames[currentMonth]}.xlsx`,
    );
    toast.success("Exported to Excel");
  };

  // Flatten all bonus payments into one list for the bonus tab
  const allBonusPayments = Object.values(bonusPayments).flat();

  const totalBonusPaid = allBonusPayments.filter((bp) => bp.paid).length;
  const totalBonusPending = allBonusPayments.filter((bp) => !bp.paid).length;
  const totalBonusAmount = allBonusPayments.reduce((s, bp) => s + bp.amount, 0);

  const refreshSalaryData = async () => {
    const newData = await (
      await import("@/actions/salary")
    ).getSalaryData(currentYear, currentMonth);
    setSalaryData(newData as SalaryData);
    const newHistory = await (
      await import("@/actions/salary")
    ).getSalaryHistory();
    setHistory(newHistory as SalaryRecord[]);
  };

  const handleMarkBonusPaid = async (paymentId: string, empName: string) => {
    if (!confirm(`Mark bonus as paid for ${empName}?`)) return;
    setBonusLoading(paymentId);
    try {
      await markBonusPaid(paymentId);
      setBonusPayments((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].map((bp) =>
            bp.id === paymentId
              ? { ...bp, paid: true, paidAt: new Date() }
              : bp,
          );
        }
        return next;
      });
      await refreshSalaryData();
      toast.success(`Bonus marked as paid for ${empName}`);
    } catch (error) {
      toast.error("Failed to mark bonus as paid");
    } finally {
      setBonusLoading(null);
    }
  };

  const handleMarkAllBonusesPaid = async (festivalId: string) => {
    if (!confirm("Mark all bonuses as paid for this festival?")) return;
    setBonusLoading(`all-${festivalId}`);
    try {
      const result = await markAllBonusesPaid(festivalId);
      setBonusPayments((prev) => {
        const next = { ...prev };
        if (next[festivalId]) {
          next[festivalId] = next[festivalId].map((bp) => ({
            ...bp,
            paid: true,
            paidAt: new Date(),
          }));
        }
        return next;
      });
      await refreshSalaryData();
      toast.success(`Marked ${result.count} bonuses as paid`);
    } catch (error) {
      toast.error("Failed to mark all bonuses as paid");
    } finally {
      setBonusLoading(null);
    }
  };

  // Override current month history netPayable with dynamically calculated values
  const currentMonthDynamic = new Map<string, number>();
  for (const emp of salaryData.salaryData) {
    currentMonthDynamic.set(emp.userId, emp.netPayable);
  }
  const displayHistory = history.map((record) => {
    const isCurrentMonth =
      new Date(record.month).getMonth() === currentMonth &&
      new Date(record.month).getFullYear() === currentYear;
    if (!isCurrentMonth) return record;
    const dynamicNet = currentMonthDynamic.get(record.userId);
    if (dynamicNet === undefined) return record;
    return { ...record, netPayable: dynamicNet };
  });

  // Calculate total paid (salary + bonus) for current month
  const currentMonthHistory = displayHistory.filter(
    (r) =>
      new Date(r.month).getMonth() === currentMonth &&
      new Date(r.month).getFullYear() === currentYear,
  );
  const totalSalaryPaid = currentMonthHistory
    .filter((r) => r.paid)
    .reduce((sum, r) => sum + r.netPayable, 0);
  const totalPaidBonusAmount = allBonusPayments
    .filter((bp) => bp.paid)
    .reduce((sum, bp) => sum + bp.amount, 0);
  const totalPaidThisMonth = totalSalaryPaid + totalPaidBonusAmount;

  const totalNetPayable = salaryData.salaryData.reduce(
    (sum, e) => sum + e.netPayable,
    0,
  );

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
          <h1 className="text-2xl font-bold">Salary Management</h1>
          <p className="text-muted-foreground">
            Run payroll, view employee salaries, and manage payments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCurrentToExcel}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button onClick={handleRunPayroll} disabled={payrollLoading}>
            {payrollLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="mr-2 h-4 w-4" />
            )}
            {payrollLoading ? "Calculating..." : "Run Payroll"}
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salaryData.salaryData.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Payable (Salary)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalNetPayable)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Total Paid This Month
              {totalPaidThisMonth > 0 && (
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  (salary + bonus)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalPaidThisMonth)}
            </div>
            {totalPaidThisMonth > 0 && (
              <div className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">
                  Salary: {formatCurrency(totalSalaryPaid)}
                </span>
                {totalPaidBonusAmount > 0 && (
                  <span className="ml-2 text-green-600">
                    + Bonus: {formatCurrency(totalPaidBonusAmount)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Days in Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salaryData.daysInMonth}</div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Month Salary Preview */}
      <motion.div variants={fadeInUp}>
        <Tabs defaultValue="current">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">
              Current Month ({monthNames[currentMonth]} {currentYear})
            </TabsTrigger>
            <TabsTrigger value="bonus">
              <Gift className="h-4 w-4 mr-1" />
              Bonus Payments
              {totalBonusPending > 0 && (
                <span className="ml-1 text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">
                  {totalBonusPending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Salary History</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
            <Card>
              <CardHeader>
                <CardTitle>Salary Breakdown</CardTitle>
                <CardDescription>
                  Calculated based on attendance and advance deductions
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Half</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Attendance Deduction</TableHead>
                      <TableHead>Advance Deduction</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Net Payable</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryData.salaryData.map((emp, idx) => (
                      <TableRow key={emp.userId}>
                        <TableCell className="font-medium">
                          {emp.name}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {emp.email}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(emp.monthlySalary)}
                        </TableCell>
                        <TableCell>{emp.presentDays}</TableCell>
                        <TableCell>{emp.halfDays}</TableCell>
                        <TableCell>{emp.absentDays}</TableCell>
                        <TableCell className="text-red-600">
                          -{formatCurrency(emp.attendanceDeduction)}
                        </TableCell>
                        <TableCell className="text-orange-600">
                          -{formatCurrency(emp.advanceDeduction)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {(() => {
                            const monthKey = `${emp.userId}:${currentYear}-${currentMonth}`;
                            const bp = bonusLookup[monthKey];
                            if (bp) {
                              return (
                                <span className="flex items-center gap-1">
                                  +{formatCurrency(bp.amount)}
                                  {bp.paid && (
                                    <Badge className="bg-green-100 text-green-700 text-[10px] px-1 py-0">
                                      Paid
                                    </Badge>
                                  )}
                                </span>
                              );
                            }
                            return "—";
                          })()}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(emp.netPayable)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bonus Payments Tab */}
          <TabsContent value="bonus">
            <motion.div variants={staggerContainer} className="space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Bonus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalBonusAmount)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-600">
                      Paid
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {totalBonusPaid}
                      <span className="text-sm text-muted-foreground ml-1">
                        / {allBonusPayments.length}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-yellow-600">
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      {totalBonusPending}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {festivalBonuses.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No festival bonuses have been processed yet. Go to Settings
                    &gt; Bonus to create and process a festival bonus.
                  </CardContent>
                </Card>
              ) : (
                (() => {
                  // Show only the latest processed festival bonus
                  const latestBonus = festivalBonuses.sort(
                    (a: any, b: any) =>
                      new Date(b.bonusDate).getTime() -
                      new Date(a.bonusDate).getTime(),
                  )[0];
                  const fb = latestBonus;
                  const payments = bonusPayments[fb.id] || [];
                  const paidCount = payments.filter(
                    (p: BonusPaymentItem) => p.paid,
                  ).length;

                  return (
                    <Card key={fb.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Gift className="h-5 w-5 text-green-600" />
                              {fb.name}
                            </CardTitle>
                            <CardDescription>
                              {format(new Date(fb.bonusDate), "MMMM dd, yyyy")}{" "}
                              &middot; {fb.bonusPercentage}% of salary
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                paidCount === payments.length &&
                                payments.length > 0
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }
                            >
                              {paidCount}/{payments.length} Paid
                            </Badge>
                            {payments.some(
                              (p: BonusPaymentItem) => !p.paid,
                            ) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkAllBonusesPaid(fb.id)}
                                disabled={bonusLoading === `all-${fb.id}`}
                              >
                                {bonusLoading === `all-${fb.id}` ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                )}
                                Pay All
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Employee</TableHead>
                              <TableHead>Monthly Salary</TableHead>
                              <TableHead>Bonus Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Paid At</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {payments.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center text-muted-foreground py-8"
                                >
                                  No eligible employees found for this bonus
                                  (may require 6+ months tenure).
                                </TableCell>
                              </TableRow>
                            ) : (
                              payments.map((payment: BonusPaymentItem) => (
                                <TableRow key={payment.id}>
                                  <TableCell>
                                    <span className="font-medium">
                                      {payment.user.name}
                                    </span>
                                    <br />
                                    <span className="text-xs text-muted-foreground">
                                      {payment.user.email}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {formatCurrency(payment.user.monthlySalary)}
                                  </TableCell>
                                  <TableCell className="text-green-600 font-medium">
                                    +{formatCurrency(payment.amount)}
                                  </TableCell>
                                  <TableCell>
                                    {payment.paid ? (
                                      <Badge className="bg-green-100 text-green-700">
                                        Paid
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="bg-yellow-50 text-yellow-700"
                                      >
                                        Pending
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {payment.paidAt
                                      ? format(
                                          new Date(payment.paidAt),
                                          "MMM dd, yyyy HH:mm",
                                        )
                                      : "—"}
                                  </TableCell>
                                  <TableCell>
                                    {!payment.paid && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          handleMarkBonusPaid(
                                            payment.id,
                                            payment.user.name,
                                          )
                                        }
                                        disabled={bonusLoading === payment.id}
                                      >
                                        {bonusLoading === payment.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                        ) : (
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                        )}
                                        Mark Paid
                                      </Button>
                                    )}
                                    {payment.paid && (
                                      <span className="text-xs text-green-600 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Paid
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  );
                })()
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Past Salary Records</CardTitle>
                <CardDescription>
                  View and manage historical payroll
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Advance Deduction</TableHead>
                      <TableHead>Bonus</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Paid At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total (Net + Bonus)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const totals = displayHistory.reduce(
                        (acc, r) => {
                          const monthKey = `${r.userId}:${new Date(r.month).getFullYear()}-${new Date(r.month).getMonth()}`;
                          const bp = bonusLookup[monthKey];
                          const bonus = bp?.amount ?? r.eidBonus ?? 0;
                          acc.gross += r.grossSalary;
                          acc.advance += r.advanceDeduction;
                          acc.bonus += bonus;
                          acc.net += r.netPayable;
                          return acc;
                        },
                        { gross: 0, advance: 0, bonus: 0, net: 0 },
                      );
                      return (
                        <>
                          {displayHistory.map((record) => {
                            const monthKey = `${record.userId}:${new Date(record.month).getFullYear()}-${new Date(record.month).getMonth()}`;
                            const bp = bonusLookup[monthKey];
                            const bonusCellContent = bp ? (
                              <span className="flex items-center gap-1">
                                +{formatCurrency(bp.amount)}
                                {bp.paid ? (
                                  <Badge className="bg-green-100 text-green-700 text-xs">
                                    Paid Bonus
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-50 text-yellow-700 text-xs"
                                  >
                                    Bonus Pending
                                  </Badge>
                                )}
                              </span>
                            ) : record.eidBonus > 0 ? (
                              formatCurrency(record.eidBonus)
                            ) : (
                              "—"
                            );
                            return (
                              <TableRow key={record.id}>
                                <TableCell>{record.user.name}</TableCell>
                                <TableCell>
                                  {format(new Date(record.month), "MMM yyyy")}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(record.grossSalary)}
                                </TableCell>
                                <TableCell className="text-orange-600">
                                  {record.advanceDeduction > 0
                                    ? `-${formatCurrency(record.advanceDeduction)}`
                                    : "—"}
                                </TableCell>
                                <TableCell>{bonusCellContent}</TableCell>
                                <TableCell className="font-medium">
                                  {formatCurrency(record.netPayable)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {record.paidAt
                                    ? format(
                                        new Date(record.paidAt),
                                        "MMM dd, yyyy",
                                      )
                                    : "—"}
                                </TableCell>
                                <TableCell>
                                  {record.paid ? (
                                    <Badge className="bg-green-100 text-green-700">
                                      Paid
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-50 text-yellow-700"
                                    >
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium text-blue-600">
                                  {formatCurrency(
                                    record.netPayable +
                                      (bp?.amount ?? record.eidBonus ?? 0),
                                  )}
                                </TableCell>
                                <TableCell>
                                  {!record.paid && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleMarkPaid(
                                          record.id,
                                          record.user.name,
                                        )
                                      }
                                      disabled={loading}
                                    >
                                      <CheckCircle className="mr-1 h-3 w-3" />{" "}
                                      Mark Paid
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          <TableRow className="border-t-2 font-bold bg-muted/50">
                            <TableCell colSpan={2}>Total</TableCell>
                            <TableCell>
                              {formatCurrency(totals.gross)}
                            </TableCell>
                            <TableCell className="text-orange-600">
                              {totals.advance > 0
                                ? `-${formatCurrency(totals.advance)}`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(totals.bonus)}
                            </TableCell>
                            <TableCell>{formatCurrency(totals.net)}</TableCell>
                            <TableCell
                              colSpan={2}
                              className="text-muted-foreground"
                            >
                              —
                            </TableCell>
                            <TableCell className="text-blue-600">
                              {formatCurrency(totals.net + totals.bonus)}
                            </TableCell>
                            <TableCell>—</TableCell>
                          </TableRow>
                        </>
                      );
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
