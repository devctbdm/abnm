"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
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

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarIcon, Loader2, TrendingUp } from "lucide-react";
import { getSalaryData, runPayroll } from "@/actions/salary";
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

interface PayrollClientProps {
  session: { userId: string; name: string; role: string };
  initialData: SalaryData;
  currentYear: number;
  currentMonth: number;
}

export function PayrollClient({
  session,
  initialData,
  currentYear,
  currentMonth,
}: PayrollClientProps) {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [salaryData, setSalaryData] = useState<SalaryData | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSalaryData(selectedYear, selectedMonth);
      setSalaryData(data as SalaryData);
    } catch (error) {
      toast.error("Failed to load salary data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRunPayroll = async () => {
    if (
      !confirm(
        `Run payroll for ${monthNames[selectedMonth]} ${selectedYear}? This will create/update salary records and mark advances as deducted.`,
      )
    )
      return;
    setProcessing(true);
    try {
      await runPayroll(selectedYear, selectedMonth);
      toast.success("Payroll processed successfully");
      router.push("/admin/salary");
    } catch (error) {
      toast.error("Failed to process payroll");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const totalNetPayable =
    salaryData?.salaryData.reduce((sum, e) => sum + e.netPayable, 0) || 0;

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
          <h1 className="text-2xl font-bold">Payroll Processing</h1>
          <p className="text-muted-foreground">
            Calculate and finalize employee salaries for a given month
          </p>
        </div>
      </motion.div>

      {/* Month/Year Selector */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle>Select Payroll Period</CardTitle>
            <CardDescription>
              Choose month and year to calculate salaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <div className="space-y-2">
                <Label>Month</Label>
                <select
                  className="flex h-10 w-48 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value));
                    loadData();
                  }}
                >
                  {monthNames.map((name, idx) => (
                    <option key={idx} value={idx}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    loadData();
                  }}
                  min={2020}
                  max={2030}
                  className="w-32"
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={loadData} disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarIcon className="mr-2 h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Salary Preview */}
      {salaryData && !loading && (
        <>
          <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Days in Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salaryData.daysInMonth}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Employees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salaryData.salaryData.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Net Payable</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalNetPayable)}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Salary Preview</CardTitle>
                <CardDescription>
                  Calculated based on attendance records and approved advances
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
                    {salaryData.salaryData.map((emp) => (
                      <TableRow key={emp.userId}>
                        <TableCell className="font-medium">
                          {emp.name}
                          <div className="text-xs text-muted-foreground">
                            {emp.email}
                          </div>
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
                          +{formatCurrency(emp.eidBonus)}
                        </TableCell>
                        <TableCell className="font-bold text-blue-600">
                          {formatCurrency(emp.netPayable)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeInUp} className="flex justify-end gap-4">
            <Button
              size="lg"
              onClick={handleRunPayroll}
              disabled={processing}
              className="gap-2"
            >
              {processing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <TrendingUp className="h-5 w-5" />
              )}
              {processing ? "Processing..." : "Run Payroll & Finalize"}
            </Button>
          </motion.div>
        </>
      )}

      {!loading && !salaryData && (
        <div className="text-center py-12 text-muted-foreground">
          No data available. Try selecting a different month/year.
        </div>
      )}
    </motion.div>
  );
}
