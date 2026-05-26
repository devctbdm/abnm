"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Save, User, Gift } from "lucide-react";
import { format } from "date-fns";
import {
  markAttendanceForUser,
  getAttendanceForUserOnDate,
} from "@/actions/attendance";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface AdminMarkAttendanceClientProps {
  session: { userId: string; name: string; role: string };
  employees: Employee[];
}

export function AdminMarkAttendanceClient({
  session,
  employees,
}: AdminMarkAttendanceClientProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [status, setStatus] = useState<"PRESENT" | "ABSENT" | "HOLIDAY">(
    "PRESENT",
  );
  const [halfDay, setHalfDay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState<{
    status: string;
    halfDay: boolean;
  } | null>(null);

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  useEffect(() => {
    async function fetchExisting() {
      if (!selectedEmployeeId) return;
      try {
        const att = await getAttendanceForUserOnDate(
          selectedEmployeeId,
          new Date(selectedDate),
        );
        if (att) {
          setExistingAttendance({ status: att.status, halfDay: att.halfDay });
        } else {
          setExistingAttendance(null);
        }
      } catch (error) {
        console.error(error);
      }
    }
    fetchExisting();
  }, [selectedEmployeeId, selectedDate]);

  const handleSubmit = async () => {
    if (!selectedEmployeeId) {
      toast.error("Please select an employee");
      return;
    }
    setLoading(true);
    try {
      await markAttendanceForUser(
        selectedEmployeeId,
        new Date(selectedDate),
        status,
        halfDay,
      );
      toast.success(
        `Attendance marked for ${selectedEmployee?.name} on ${format(new Date(selectedDate), "MMM dd, yyyy")}`,
      );
      // Refresh existing
      const att = await getAttendanceForUserOnDate(
        selectedEmployeeId,
        new Date(selectedDate),
      );
      setExistingAttendance(
        att ? { status: att.status, halfDay: att.halfDay } : null,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="p-4 md:p-6 max-w-2xl mx-auto"
    >
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold">Mark Attendance Management</h1>
        <p className="mt-2 text-sm text-gray-500">
          Override or set attendance for any employee (present/absent/half-day)
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance for Employee</CardTitle>
          <CardDescription>
            Override or set attendance for any employee
            (present/absent/half-day)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Select Employee</Label>
            <Select
              value={selectedEmployeeId}
              onValueChange={setSelectedEmployeeId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose employee..." />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp, i) => (
                  <SelectItem key={`${emp.id}-${i}`} value={emp.id}>
                    {emp.name} ({emp.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          {existingAttendance && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <span className="font-medium">Current status:</span>{" "}
              {existingAttendance.halfDay
                ? "Half Day"
                : existingAttendance.status}
              {" — will be overwritten."}
            </div>
          )}
          <div className="space-y-2">
            <Label>Attendance Status</Label>
            <div className="flex gap-4 flex-wrap">
              <Button
                type="button"
                variant={status === "PRESENT" ? "default" : "outline"}
                onClick={() => setStatus("PRESENT")}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" /> Present
              </Button>
              <Button
                type="button"
                variant={status === "ABSENT" ? "destructive" : "outline"}
                onClick={() => setStatus("ABSENT")}
                className="gap-2"
              >
                <XCircle className="h-4 w-4" /> Absent
              </Button>
              <Button
                type="button"
                variant={status === "HOLIDAY" ? "default" : "outline"}
                onClick={() => setStatus("HOLIDAY")}
                className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
              >
                <Gift className="h-4 w-4" /> Holiday
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="halfDay"
              checked={halfDay}
              onChange={(e) => setHalfDay(e.target.checked)}
              disabled={status !== "PRESENT"}
              className="h-4 w-4"
            />
            <Label htmlFor="halfDay">Half Day (only if Present)</Label>
          </div>
          {status === "HOLIDAY" && (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">Holiday</span> — Employee will be
              marked as on holiday. Salary will NOT be deducted for this day.
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedEmployeeId}
            className="w-full gap-2"
          >
            <Save className="h-4 w-4" />{" "}
            {loading ? "Saving..." : "Save Attendance"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
