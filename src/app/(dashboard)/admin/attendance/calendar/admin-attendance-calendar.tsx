"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getMonthlyAttendance } from "@/actions/attendance";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.02, delayChildren: 0.1 },
  },
};

const cellVariants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};

type AttendanceData = {
  year: number;
  month: number;
  dates: Array<{ date: Date; dateStr: string; day: number; weekday: string }>;
  employees: Array<{
    id: string;
    name: string;
    email: string;
    attendance: Array<{
      dateStr: string;
      status: string | null;
      halfDay: boolean;
    }>;
  }>;
};

interface AdminAttendanceCalendarProps {
  session: { userId: string; name: string; role: string };
  initialData: AttendanceData;
  year: number;
  month: number;
}

export function AdminAttendanceCalendar({
  session,
  initialData,
  year: initialYear,
  month: initialMonth,
}: AdminAttendanceCalendarProps) {
  const [data, setData] = useState(initialData);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [loading, setLoading] = useState(false);

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

  const loadMonth = async (year: number, month: number) => {
    setLoading(true);
    try {
      const newData = await getMonthlyAttendance(year, month);
      setData(newData as AttendanceData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    loadMonth(newYear, newMonth);
  };

  const nextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    loadMonth(newYear, newMonth);
  };

  const getStatusColor = (status: string | null, halfDay: boolean) => {
    if (!status)
      return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
    if (halfDay)
      return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
    if (status === "HOLIDAY")
      return "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300";
    if (status === "PRESENT")
      return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
    if (status === "ABSENT")
      return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
    return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
  };

  const getStatusText = (status: string | null, halfDay: boolean) => {
    if (!status) return "—";
    if (halfDay) return "½";
    if (status === "HOLIDAY") return "H";
    if (status === "PRESENT") return "✓";
    if (status === "ABSENT") return "✗";
    return "?";
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
        className="flex flex-col sm:flex-row justify-between items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Attendance Calendar</h1>
          <p className="text-muted-foreground">
            View monthly attendance for all employees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            disabled={loading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-md">
            <CalendarIcon className="h-4 w-4" />
            <span className="font-medium">
              {monthNames[currentMonth]} {currentYear}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            disabled={loading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="flex gap-4 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-xs">Present</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs">Half Day</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-xs">Holiday</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-xs">Absent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
          <span className="text-xs">No Record</span>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Grid</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="min-w-[800px]">
              {/* Header row: dates */}
              <div
                className="grid sticky top-0 bg-background z-10"
                style={{
                  gridTemplateColumns: `200px repeat(${data.dates.length}, 48px)`,
                }}
              >
                <div className="p-2 font-semibold border-b">Employee</div>
                {data.dates.map((date, idx) => (
                  <div
                    key={idx}
                    className="p-1 text-center text-xs font-medium border-b"
                  >
                    <div>{date.day}</div>
                    <div className="text-muted-foreground">{date.weekday}</div>
                  </div>
                ))}
              </div>

              {/* Employee rows */}
              <AnimatePresence>
                {data.employees.map((employee, empIdx) => (
                  <motion.div
                    key={employee.id}
                    variants={cellVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: empIdx * 0.01 }}
                    className="grid items-center border-b hover:bg-muted/30"
                    style={{
                      gridTemplateColumns: `200px repeat(${data.dates.length}, 48px)`,
                    }}
                  >
                    <div className="p-2 truncate">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-medium cursor-default">
                              {employee.name}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{employee.email}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {employee.attendance.map((att, dateIdx) => (
                      <div
                        key={dateIdx}
                        className={`flex items-center justify-center p-1 m-0.5 rounded text-sm font-medium transition-all ${getStatusColor(att.status, att.halfDay)}`}
                      >
                        <span className="text-center w-full">
                          {getStatusText(att.status, att.halfDay)}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards (optional) */}
      <motion.div variants={fadeInUp} className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Present Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                let totalRecords = 0;
                let presentCount = 0;
                for (const emp of data.employees) {
                  for (const att of emp.attendance) {
                    totalRecords++;
                    if ((att.status === "PRESENT" || att.status === "HOLIDAY") && !att.halfDay)
                      presentCount++;
                    else if (att.status === "PRESENT" && att.halfDay)
                      presentCount += 0.5;
                  }
                }
                const rate =
                  totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;
                return `${Math.round(rate)}%`;
              })()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Half Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.employees.reduce(
                (sum, emp) =>
                  sum + emp.attendance.filter((a) => a.halfDay).length,
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
