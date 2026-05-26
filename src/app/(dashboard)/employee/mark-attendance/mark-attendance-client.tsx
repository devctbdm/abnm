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
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Save, Calendar } from "lucide-react";
import { format } from "date-fns";
import { markAttendance } from "@/actions/attendance";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

interface MarkAttendanceClientProps {
  session: { userId: string; name: string; role: string };
  initialStatus: {
    status: "PRESENT" | "ABSENT" | "HOLIDAY" | null;
    halfDay: boolean;
    id: string | null;
  };
}

export function MarkAttendanceClient({
  session,
  initialStatus,
}: MarkAttendanceClientProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<
    "PRESENT" | "ABSENT" | "HOLIDAY" | null
  >(initialStatus.status);
  const [halfDay, setHalfDay] = useState(initialStatus.halfDay);
  const [loading, setLoading] = useState(false);

  const today = new Date();
  const alreadyMarked = initialStatus.status !== null;

  const handleSubmit = async () => {
    if (!selectedStatus) {
      toast.error("Please select Present or Absent");
      return;
    }
    setLoading(true);
    try {
      await markAttendance(
        today,
        selectedStatus,
        selectedStatus === "PRESENT" ? halfDay : false,
      );
      toast.success(
        `Attendance marked as ${selectedStatus}${selectedStatus === "PRESENT" && halfDay ? " (Half Day)" : ""}`,
      );
      router.refresh();
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
      variants={staggerContainer}
      className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4"
    >
      <motion.div variants={fadeInUp} className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Mark Attendance</CardTitle>
            <CardDescription>
              {format(today, "EEEE, MMMM dd, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {alreadyMarked ? (
              <div className="rounded-lg bg-muted p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  You have already marked attendance today.
                </p>
                <div
                  className="mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                  style={{
                    backgroundColor:
                      selectedStatus === "PRESENT"
                        ? halfDay
                          ? "#fef3c7"
                          : "#d1fae5"
                        : "#fee2e2",
                    color:
                      selectedStatus === "PRESENT"
                        ? halfDay
                          ? "#b45309"
                          : "#065f46"
                        : "#991b1b",
                  }}
                >
                  {halfDay ? "Half Day" : selectedStatus}
                </div>
                <Button
                  variant="outline"
                  className="mt-4 ml-2"
                  onClick={() => router.push("/employee")}
                >
                  Back to Dashboard
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Select your status for today
                  </p>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={
                        selectedStatus === "PRESENT" ? "default" : "outline"
                      }
                      onClick={() => setSelectedStatus("PRESENT")}
                      className="flex-1 gap-2"
                    >
                      <CheckCircle className="h-4 w-4" /> Present
                    </Button>
                    <Button
                      type="button"
                      variant={
                        selectedStatus === "ABSENT" ? "destructive" : "outline"
                      }
                      onClick={() => setSelectedStatus("ABSENT")}
                      className="flex-1 gap-2"
                    >
                      <XCircle className="h-4 w-4" /> Absent
                    </Button>
                  </div>
                </div>

                {selectedStatus === "PRESENT" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="halfDay"
                      checked={halfDay}
                      onChange={(e) => setHalfDay(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="halfDay" className="text-sm">
                      Half Day (only half day attendance)
                    </label>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={loading || !selectedStatus}
                  className="w-full gap-2"
                >
                  {loading ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {loading ? "Saving..." : "Save Attendance"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
