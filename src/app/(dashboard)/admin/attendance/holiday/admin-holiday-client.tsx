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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Gift, Plus, Trash2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { createHoliday, deleteHoliday } from "@/actions/holiday";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface HolidayRecord {
  id: string;
  name: string;
  date: Date;
  createdAt: Date;
}

interface AdminHolidayClientProps {
  session: { userId: string; name: string; role: string };
  initialHolidays: HolidayRecord[];
}

export function AdminHolidayClient({
  session,
  initialHolidays,
}: AdminHolidayClientProps) {
  const [holidays, setHolidays] = useState<HolidayRecord[]>(initialHolidays);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [saving, setSaving] = useState(false);

  const handleAddHoliday = async () => {
    if (!holidayName.trim()) {
      toast.error("Please enter a holiday name");
      return;
    }
    setSaving(true);
    try {
      await createHoliday(holidayName.trim(), new Date(holidayDate));
      toast.success(`Holiday "${holidayName}" created`);
      setShowAddDialog(false);
      setHolidayName("");
      setHolidayDate(format(new Date(), "yyyy-MM-dd"));
      // Refresh
      const { getAllHolidays } = await import("@/actions/holiday");
      const updated = await getAllHolidays();
      setHolidays(updated);
    } catch (error: any) {
      toast.error(error.message || "Failed to create holiday");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday(id);
      toast.success("Holiday deleted");
      const { getAllHolidays } = await import("@/actions/holiday");
      const updated = await getAllHolidays();
      setHolidays(updated);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete holiday");
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="p-4 md:p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Holidays</h1>
          <p className="text-muted-foreground">
            Manage company holidays. Employees marked as Holiday will not have
            salary deducted.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Holiday
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" /> All Holidays
          </CardTitle>
          <CardDescription>
            {holidays.length === 0
              ? "No holidays defined yet."
              : `${holidays.length} holiday(s) configured`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holidays.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No holidays yet. Click &quot;Add Holiday&quot; to create one.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Holiday Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-yellow-500" />
                        {holiday.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(holiday.date), "MMM dd, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteHoliday(holiday.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Holiday</DialogTitle>
            <DialogDescription>
              Create a new company holiday. Employees marked as Holiday on this
              date will not have salary deducted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Holiday Name</Label>
              <Input
                placeholder="e.g. Independence Day"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={holidayDate}
                onChange={(e) => setHolidayDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddHoliday} disabled={saving}>
              {saving ? "Saving..." : "Save Holiday"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
