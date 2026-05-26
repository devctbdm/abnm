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
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getEmployeeAttendance } from "@/actions/attendance";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cellVariants = {
  hidden: { scale: 0.85, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.25 } },
};

const statCardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface AttendanceDay {
  date: Date;
  dateStr: string;
  day: number;
  status: string | null;
  halfDay: boolean;
  id: string | null;
}

interface MonthData {
  year: number;
  month: number;
  dates: AttendanceDay[];
  todayStatus: string | null;
  todayHalfDay: boolean;
  todayId: string | null;
}

interface Stats {
  totalDays: number;
  present: number;
  halfDays: number;
  absent: number;
  holiday: number;
  attendanceRate: number;
}

interface OverviewData {
  name: string;
  joinDate: string;
  currentMonth: MonthData;
  stats: Stats;
}

interface EmployeeAttendanceClientProps {
  session: { userId: string; name: string; role: string };
  initialData: OverviewData;
}

export function EmployeeAttendanceClient({
  session,
  initialData,
}: EmployeeAttendanceClientProps) {
  const [data, setData] = useState<OverviewData>(initialData);
  const [monthData, setMonthData] = useState<MonthData>(initialData.currentMonth);
  const [year, setYear] = useState(initialData.currentMonth.year);
  const [month, setMonth] = useState(initialData.currentMonth.month);
  const [loading, setLoading] = useState(false);

  const joinDate = parseISO(data.joinDate);
  const isFutureMonth =
    year > new Date().getFullYear() ||
    (year === new Date().getFullYear() && month > new Date().getMonth());
  const isPastJoin =
    year < joinDate.getFullYear() ||
    (year === joinDate.getFullYear() && month < joinDate.getMonth());

  const canGoNext = !isFutureMonth;
  const canGoPrev = !isPastJoin;

  const loadMonth = useCallback(async (y: number, m: number) => {
    setLoading(true);
    try {
      const result = await getEmployeeAttendance(session.userId, y, m);
      setMonthData(result as MonthData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session.userId]);

  const goPrevious = () => {
    let newMonth = month - 1;
    let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setYear(newYear);
    setMonth(newMonth);
    loadMonth(newYear, newMonth);
  };

  const goNext = () => {
    let newMonth = month + 1;
    let newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setYear(newYear);
    setMonth(newMonth);
    loadMonth(newYear, newMonth);
  };

  const goToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    loadMonth(now.getFullYear(), now.getMonth());
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const getStatusColor = (status: string | null, halfDay: boolean) => {
    if (!status) return "bg-muted text-muted-foreground";
    if (halfDay) return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400";
    if (status === "HOLIDAY") return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400";
    if (status === "PRESENT") return "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400";
    if (status === "ABSENT") return "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400";
    return "bg-muted text-muted-foreground";
  };

  const getStatusIcon = (status: string | null, halfDay: boolean) => {
    if (!status) return null;
    if (halfDay) return <Clock className="h-3 w-3" />;
    if (status === "HOLIDAY") return <Gift className="h-3 w-3" />;
    if (status === "PRESENT") return <CheckCircle className="h-3 w-3" />;
    if (status === "ABSENT") return <XCircle className="h-3 w-3" />;
    return null;
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
          <p className="text-muted-foreground">
            Joined {format(joinDate, "MMM dd, yyyy")} &middot;{" "}
            {data.stats.totalDays} days recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday} className="gap-1">
            <Calendar className="h-4 w-4" /> Today
          </Button>
        </div>
      </motion.div>

      {/* Lifetime Stats */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Lifetime Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Total Days", value: data.stats.totalDays, color: "", icon: CalendarDays },
                { label: "Present", value: data.stats.present, color: "text-green-600", icon: CheckCircle },
                { label: "Half Days", value: data.stats.halfDays, color: "text-yellow-600", icon: Clock },
                { label: "Holiday", value: data.stats.holiday, color: "text-yellow-500", icon: Gift },
                { label: "Absent", value: data.stats.absent, color: "text-red-600", icon: XCircle },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={statCardVariants}
                  className="rounded-lg border p-3 text-center"
                >
                  <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-muted-foreground truncate">{stat.label}</div>
                </motion.div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              Attendance Rate: <span className="font-semibold text-foreground">{data.stats.attendanceRate}%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Monthly Calendar */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {monthNames[month]} {year}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goPrevious}
                  disabled={!canGoPrev || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goNext}
                  disabled={!canGoNext || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>
              {data.stats.totalDays > 0
                ? `${monthData.dates.filter((d) => d.status === "PRESENT" && !d.halfDay).length} present, ${monthData.dates.filter((d) => d.halfDay).length} half, ${monthData.dates.filter((d) => d.status === "HOLIDAY").length} holiday, ${monthData.dates.filter((d) => d.status === "ABSENT").length} absent this month`
                : "No attendance records yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <AnimatePresence>
                <motion.div
                  key={`${year}-${month}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayHeaders.map((d) => (
                      <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {monthData.dates.map((date, idx) => {
                      const isCurrentDay = date.dateStr === todayStr && month === new Date().getMonth() && year === new Date().getFullYear();
                      const isFutureDate = new Date(date.dateStr) > new Date();
                      return (
                        <motion.div
                          key={date.dateStr}
                          variants={cellVariants}
                          initial="hidden"
                          animate="visible"
                          transition={{ delay: idx * 0.015 }}
                          className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all
                            ${isCurrentDay ? "ring-2 ring-primary ring-offset-2" : ""}
                            ${isFutureDate ? "opacity-30" : ""}
                            ${getStatusColor(date.status, date.halfDay)}
                          `}
                        >
                          <span>{date.day}</span>
                          {date.status && !isFutureDate && (
                            <span className="mt-0.5">
                              {getStatusIcon(date.status, date.halfDay)}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Legend */}
      <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-100 dark:bg-green-900/40" /> Present</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-100 dark:bg-yellow-900/40" /> Half Day</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-100 dark:bg-yellow-900/40" /> Holiday</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-100 dark:bg-red-900/40" /> Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-muted" /> No Record</span>
      </motion.div>
    </motion.div>
  );
}
