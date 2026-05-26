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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CalendarIcon, FileSpreadsheet, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  getAttendanceReport,
  getSalaryReport,
  getLeaveReport,
} from "@/actions/report";
import {
  exportAttendanceReport,
  exportSalaryReport,
  exportLeaveReport,
} from "@/lib/excel";
import { formatCurrency } from "@/lib/constants";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function AdminReportsClient() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [reportType, setReportType] = useState<
    "attendance" | "salary" | "leave"
  >("attendance");

  // Attendance form
  const [attendanceStart, setAttendanceStart] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [attendanceEnd, setAttendanceEnd] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );

  // Salary form
  const [salaryMonth, setSalaryMonth] = useState(format(new Date(), "MM"));
  const [salaryYear, setSalaryYear] = useState(format(new Date(), "yyyy"));

  // Leave form
  const [leaveStart, setLeaveStart] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [leaveEnd, setLeaveEnd] = useState(format(new Date(), "yyyy-MM-dd"));

  const generateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let data;
      if (reportType === "attendance") {
        data = await getAttendanceReport(attendanceStart, attendanceEnd);
      } else if (reportType === "salary") {
        data = await getSalaryReport(salaryMonth, salaryYear);
      } else {
        data = await getLeaveReport(leaveStart, leaveEnd);
      }
      setReportData(data);
      if (!data || data.length === 0) {
        toast.info("No records found for the selected criteria");
      } else {
        toast.success("Report generated successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData || reportData.length === 0) {
      toast.error("No data to export");
      return;
    }
    if (reportType === "attendance") {
      const start = new Date(attendanceStart);
      const end = new Date(attendanceEnd);
      exportAttendanceReport(reportData, start, end);
      toast.success("Attendance report exported");
    } else if (reportType === "salary") {
      const monthIdx = parseInt(salaryMonth) - 1;
      const year = parseInt(salaryYear);
      exportSalaryReport(reportData, monthIdx, year);
      toast.success("Salary report exported");
    } else {
      const start = new Date(leaveStart);
      const end = new Date(leaveEnd);
      exportLeaveReport(reportData, start, end);
      toast.success("Leave report exported");
    }
  };

  // Helper to display attendance preview
  const renderAttendancePreview = () => {
    if (!reportData || reportData.length === 0) return null;
    return (
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left p-2">Employee</th>
            <th className="text-left p-2">Present</th>
            <th className="text-left p-2">Half Days</th>
            <th className="text-left p-2">Holiday</th>
            <th className="text-left p-2">Absent</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((emp: any, idx: number) => (
            <tr key={idx} className="border-b">
              <td className="p-2 font-medium">{emp.name}</td>
              <td className="p-2">{emp.present}</td>
              <td className="p-2">{emp.halfDays}</td>
              <td className="p-2">{emp.holidays ?? 0}</td>
              <td className="p-2">{emp.absent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderSalaryPreview = () => {
    if (!reportData || reportData.length === 0) return null;
    const totals = reportData.reduce(
      (acc: any, rec: any) => {
        acc.gross += rec.grossSalary;
        acc.bonus += rec.eidBonus ?? 0;
        acc.absentDays += rec.absentDays ?? 0;
        acc.holidays += rec.holidays ?? 0;
        acc.deduction += rec.attendanceDeduction + rec.advanceDeduction;
        acc.net += rec.netPayable;
        return acc;
      },
      { gross: 0, bonus: 0, absentDays: 0, holidays: 0, deduction: 0, net: 0 },
    );
    return (
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left p-2">Employee</th>
            <th className="text-left p-2">Gross</th>
            <th className="text-left p-2">Bonus</th>
            <th className="text-left p-2">Absent</th>
            <th className="text-left p-2">Holiday</th>
            <th className="text-left p-2">Advance Salary Deduction</th>
            <th className="text-left p-2">Net Payable</th>
            <th className="text-left p-2">Net+Bonus</th>
            <th className="text-left p-2">Payment Status</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((rec: any, idx: number) => (
            <tr key={idx} className="border-b">
              <td className="p-2 font-medium">{rec.user.name}</td>
              <td className="p-2">{formatCurrency(rec.grossSalary)}</td>
              <td className="p-2">
                {rec.bonusPaid ? (
                  <span className="text-green-600 font-medium">
                    {formatCurrency(rec.eidBonus)}
                  </span>
                ) : rec.eidBonus > 0 ? (
                  formatCurrency(rec.eidBonus)
                ) : (
                  "—"
                )}
              </td>
              <td className="p-2">{rec.absentDays ?? 0}</td>
              <td className="p-2">{rec.holidays ?? 0}</td>
              <td className="p-2">
                {formatCurrency(rec.attendanceDeduction + rec.advanceDeduction)}
              </td>
              <td className="p-2">{formatCurrency(rec.netPayable)}</td>
              <td className="p-2 font-medium text-blue-600">
                {formatCurrency(rec.netPayable + (rec.eidBonus ?? 0))}
              </td>
              <td className="p-2">{rec.paid ? "Yes" : "No"}</td>
            </tr>
          ))}
          <tr className="border-t-2 font-bold bg-muted/50">
            <td className="p-2">Total</td>
            <td className="p-2">{formatCurrency(totals.gross)}</td>
            <td className="p-2">{formatCurrency(totals.bonus)}</td>
            <td className="p-2">{totals.absentDays}</td>
            <td className="p-2">{totals.holidays}</td>
            <td className="p-2">{formatCurrency(totals.deduction)}</td>
            <td className="p-2">{formatCurrency(totals.net)}</td>
            <td className="p-2 text-blue-600">
              {formatCurrency(totals.net + totals.bonus)}
            </td>
            <td className="p-2">—</td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderLeavePreview = () => {
    if (!reportData || reportData.length === 0) return null;
    return (
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left p-2">Employee</th>
            <th className="text-left p-2">Type</th>
            <th className="text-left p-2">Start</th>
            <th className="text-left p-2">End</th>
            <th className="text-left p-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {reportData.map((leave: any, idx: number) => (
            <tr key={idx} className="border-b">
              <td className="p-2 font-medium">{leave.user.name}</td>
              <td className="p-2">{leave.type}</td>
              <td className="p-2">
                {format(new Date(leave.startDate), "MMM dd")}
              </td>
              <td className="p-2">
                {format(new Date(leave.endDate), "MMM dd")}
              </td>
              <td className="p-2">{leave.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="p-4 md:p-6 space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Generate and export employee reports
        </p>
      </div>

      <Tabs
        defaultValue="attendance"
        onValueChange={(val) => {
          setReportType(val as any);
          setReportData(null);
        }}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Report</CardTitle>
              <CardDescription>Select date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={attendanceStart}
                    onChange={(e) => setAttendanceStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={attendanceEnd}
                    onChange={(e) => setAttendanceEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary Report</CardTitle>
              <CardDescription>Select month and year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Month</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={salaryMonth}
                    onChange={(e) => setSalaryMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m.toString().padStart(2, "0")}>
                        {format(new Date(2000, m - 1, 1), "MMMM")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    type="number"
                    value={salaryYear}
                    onChange={(e) => setSalaryYear(e.target.value)}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Report</CardTitle>
              <CardDescription>Select date range</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buttons - Always visible */}
        <div className="flex justify-between gap-4 mt-6">
          <Button
            onClick={generateReport}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarIcon className="mr-2 h-4 w-4" />
            )}
            Generate Report
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="flex-1"
            disabled={!reportData || reportData.length === 0}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>

        {/* Empty state message */}
        {reportData && reportData.length === 0 && (
          <Card className="mt-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              No records found for the selected criteria. Try a different date
              range or ensure data exists.
            </CardContent>
          </Card>
        )}

        {/* Preview Table */}
        {reportData && reportData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                {reportData.length} records found
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {reportType === "attendance" && renderAttendancePreview()}
              {reportType === "salary" && renderSalaryPreview()}
              {reportType === "leave" && renderLeavePreview()}
            </CardContent>
          </Card>
        )}
      </Tabs>
    </motion.div>
  );
}
