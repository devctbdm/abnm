"use client";

import { useState, useCallback } from "react";
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
import { toast } from "sonner";
import {
  CalendarIcon,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { getAdminAttendanceView } from "@/actions/attendance";
import { exportAdminAttendanceView } from "@/lib/excel";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.1 },
  },
};

type UserSummary = {
  id: string;
  name: string;
  email: string;
  joinedAt: Date | null;
  attendance: Array<{
    dateStr: string;
    status: string | null;
    halfDay: boolean;
  }>;
  summary: { present: number; halfDays: number; holidays: number; absent: number };
};

type AttendanceViewData = {
  dates: Array<{ dateStr: string; day: number; weekday: string }>;
  employees: UserSummary[];
  totalDays: number;
};

interface AttendanceClientProps {
  session: { userId: string; name: string; role: string };
  employees: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    joinedAt: Date | null;
  }>;
  initialData: AttendanceViewData;
}

export function AttendanceClient({
  session,
  employees,
  initialData,
}: AttendanceClientProps) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    initialData.employees.map((e) => e.id),
  );
  const [fromDate, setFromDate] = useState(
    initialData.dates.length > 0
      ? initialData.dates[0].dateStr
      : format(new Date(), "yyyy-MM-01"),
  );
  const [toDate, setToDate] = useState(
    initialData.dates.length > 0
      ? initialData.dates[initialData.dates.length - 1].dateStr
      : format(new Date(), "yyyy-MM-dd"),
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const showSelectedCount = selectedUserIds.length;

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );
  };

  const selectAll = () => {
    setSelectedUserIds(employees.map((e) => e.id));
  };

  const deselectAll = () => {
    setSelectedUserIds([]);
  };

  const generateReport = useCallback(async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }
    if (!fromDate || !toDate) {
      toast.error("Please select date range");
      return;
    }
    if (fromDate > toDate) {
      toast.error("Start date cannot be after end date");
      return;
    }
    setLoading(true);
    try {
      const result = await getAdminAttendanceView(selectedUserIds, fromDate, toDate);
      setData(result);
      toast.success("Attendance data loaded");
    } catch (error) {
      toast.error("Failed to load attendance data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedUserIds, fromDate, toDate]);

  // Aggregate stats across selected employees
  const aggregateStats = data.employees.reduce(
    (acc, emp) => {
      acc.present += emp.summary.present;
      acc.halfDays += emp.summary.halfDays;
      acc.holidays += emp.summary.holidays;
      acc.absent += emp.summary.absent;
      return acc;
    },
    { present: 0, halfDays: 0, holidays: 0, absent: 0 },
  );

  const totalMarked =
    aggregateStats.present +
    aggregateStats.halfDays +
    aggregateStats.holidays +
    aggregateStats.absent;

  const totalPossible = data.employees.length * data.totalDays;

  const getStatusColor = (status: string | null, halfDay: boolean) => {
    if (!status) return "bg-gray-100 dark:bg-gray-800 text-gray-400";
    if (halfDay) return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
    if (status === "HOLIDAY") return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
    if (status === "PRESENT") return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
    if (status === "ABSENT") return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
    return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
  };

  const getStatusIcon = (status: string | null, halfDay: boolean) => {
    if (!status) return "—";
    if (halfDay) return "½";
    if (status === "HOLIDAY") return "H";
    if (status === "PRESENT") return "✓";
    if (status === "ABSENT") return "✗";
    return "?";
  };

  const monthLabel = (() => {
    if (data.dates.length === 0) return "";
    const first = new Date(data.dates[0].dateStr);
    const last = new Date(data.dates[data.dates.length - 1].dateStr);
    if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
      return format(first, "MMMM yyyy");
    }
    return `${format(first, "MMM dd")} – ${format(last, "MMM dd, yyyy")}`;
  })();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-4 md:p-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">
            View and filter employee attendance records
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
          <CalendarIcon className="h-4 w-4" />
          <span>{monthLabel}</span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date Range */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div>
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            {/* User Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Employees ({showSelectedCount} selected)</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Clear
                  </Button>
                </div>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md p-1 space-y-0.5">
                {filteredEmployees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(emp.id)}
                      onChange={() => toggleUser(emp.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="font-medium">{emp.name}</span>
                    <span className="text-muted-foreground text-xs ml-auto">
                      {emp.joinedAt
                        ? `Joined ${format(new Date(emp.joinedAt), "MMM yy")}`
                        : ""}
                    </span>
                  </label>
                ))}
                {filteredEmployees.length === 0 && (
                  <p className="text-xs text-muted-foreground p-2 text-center">
                    No employees found
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={generateReport} disabled={loading} className="flex-1">
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                {loading ? "Loading..." : "Generate View"}
              </Button>
              <Button
                onClick={() => {
                  if (data.employees.length === 0) {
                    toast.error("No data to export");
                    return;
                  }
                  exportAdminAttendanceView(
                    data.employees.map((e) => ({
                      name: e.name,
                      summary: e.summary,
                      totalDays: data.totalDays,
                    })),
                    fromDate,
                    toDate,
                  );
                  toast.success("Attendance exported");
                }}
                variant="outline"
                disabled={data.employees.length === 0}
                className="flex-1"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      {data.employees.length > 0 && (
        <motion.div variants={fadeInUp} className="flex gap-4 justify-center flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs">Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs">Half Day</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-xs">Holiday</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs">Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300" />
            <span className="text-xs">No Record</span>
          </div>
        </motion.div>
      )}

      {/* Attendance Grid */}
      {data.employees.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Attendance Grid — {data.employees.length} employee{data.employees.length > 1 ? "s" : ""}
              </CardTitle>
              <CardDescription>
                {data.totalDays} days shown
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="min-w-[600px]">
                  {/* Header row */}
                  <div
                    className="grid sticky top-0 bg-background z-10"
                    style={{
                      gridTemplateColumns: `180px repeat(${data.dates.length}, 36px)`,
                    }}
                  >
                    <div className="p-2 font-semibold text-sm border-b">Employee</div>
                    {data.dates.map((d, idx) => (
                      <div
                        key={idx}
                        className="p-1 text-center text-xs font-medium border-b"
                        title={d.dateStr}
                      >
                        <div>{d.day}</div>
                        <div className="text-muted-foreground text-[10px]">{d.weekday}</div>
                      </div>
                    ))}
                  </div>

                  {/* Employee rows */}
                  <AnimatePresence>
                    {data.employees.map((emp, empIdx) => (
                      <motion.div
                        key={emp.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: empIdx * 0.01 }}
                        className="grid items-center border-b hover:bg-muted/30"
                        style={{
                          gridTemplateColumns: `180px repeat(${data.dates.length}, 36px)`,
                        }}
                      >
                        <div className="p-2 truncate text-sm font-medium">
                          {emp.name}
                        </div>
                        {emp.attendance.map((att, dateIdx) => (
                          <div
                            key={dateIdx}
                            className={`flex items-center justify-center p-1 m-0.5 rounded text-xs font-medium transition-all ${getStatusColor(att.status, att.halfDay)}`}
                          >
                            {getStatusIcon(att.status, att.halfDay)}
                          </div>
                        ))}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Summary Stats */}
      {data.employees.length > 0 && (
        <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-green-600" /> Present
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{aggregateStats.present}</div>
              <p className="text-xs text-muted-foreground">
                {totalPossible > 0
                  ? `${Math.round((aggregateStats.present / totalPossible) * 100)}% of total`
                  : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-yellow-600" /> Half Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{aggregateStats.halfDays}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5 text-yellow-600" /> Holidays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{aggregateStats.holidays}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-600" /> Absent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{aggregateStats.absent}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Per-employee summary table */}
      {data.employees.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Employee Summary</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-2 font-medium">Employee</th>
                    <th className="text-center p-2 font-medium">Present</th>
                    <th className="text-center p-2 font-medium">Half</th>
                    <th className="text-center p-2 font-medium">Holiday</th>
                    <th className="text-center p-2 font-medium">Absent</th>
                    <th className="text-center p-2 font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.map((emp) => {
                    const marked =
                      emp.summary.present +
                      emp.summary.halfDays +
                      emp.summary.holidays +
                      emp.summary.absent;
                    const rate = data.totalDays > 0 ? Math.round((marked / data.totalDays) * 100) : 0;
                    return (
                      <tr key={emp.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{emp.name}</td>
                        <td className="p-2 text-center text-green-600 font-medium">{emp.summary.present}</td>
                        <td className="p-2 text-center text-yellow-600">{emp.summary.halfDays}</td>
                        <td className="p-2 text-center text-yellow-600">{emp.summary.holidays}</td>
                        <td className="p-2 text-center text-red-600">{emp.summary.absent}</td>
                        <td className="p-2 text-center font-medium">{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Empty state */}
      {data.employees.length === 0 && (
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Select employees and date range, then click Generate View</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
