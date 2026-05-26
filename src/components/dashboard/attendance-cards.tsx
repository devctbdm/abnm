// src/components/dashboard/attendance-cards.tsx
"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTodayAttendanceSummary } from "@/actions/attendance";

export function AttendanceCards() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    getTodayAttendanceSummary().then(setData).catch(console.error);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((emp, idx) => (
        <motion.div
          key={emp.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{emp.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    emp.status === "PRESENT"
                      ? "bg-green-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                />
                <span className="font-medium">
                  {emp.status === "PRESENT"
                    ? emp.halfDay
                      ? "Half Day"
                      : "Present"
                    : "Absent"}
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
