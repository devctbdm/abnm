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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Save,
  CalendarDays,
  Gift,
  Plus,
  Trash2,
  Play,
  HandCoins,
} from "lucide-react";
import { format } from "date-fns";
import { updateGlobalSetting } from "@/actions/settings";
import {
  createFestivalBonus,
  deleteFestivalBonus,
  processFestivalBonus,
} from "@/actions/festival-bonus";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

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

interface WorkingDayRecord {
  id: string;
  month: string;
  daysCount: number;
  notes: string | null;
  setBy: string;
}

interface FestivalBonusRecord {
  id: string;
  name: string;
  bonusDate: Date;
  bonusPercentage: number;
  processed: boolean;
  processedAt: Date | null;
  createdAt: Date;
}

interface AdminSettingsClientProps {
  session: { userId: string; name: string; role: string };
  initialSettings: {
    companyName: string;
    eidBonus: number;
    defaultWorkingDays: number;
    [key: string]: string | number;
  };
  initialWorkingDays: WorkingDayRecord[];
  initialFestivalBonuses: FestivalBonusRecord[];
}

export function AdminSettingsClient({
  session,
  initialSettings,
  initialWorkingDays,
  initialFestivalBonuses,
}: AdminSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [workingDaysHistory, setWorkingDaysHistory] =
    useState(initialWorkingDays);
  const [festivalBonuses, setFestivalBonuses] = useState(initialFestivalBonuses);
  const [loading, setLoading] = useState(false);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [newBonus, setNewBonus] = useState({ name: "", bonusDate: format(new Date(), "yyyy-MM-dd"), bonusPercentage: 50 });
  const [processingId, setProcessingId] = useState<string | null>(null);
  const today = new Date();
  const currentDaysInMonth = getDaysInMonth(
    today.getFullYear(),
    today.getMonth(),
  );

  const handleUpdateSetting = async (key: string, value: string) => {
    setLoading(true);
    try {
      await updateGlobalSetting(key, value);
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
      toast.success(`${key} updated successfully`);
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBonus = async () => {
    if (!newBonus.name.trim() || !newBonus.bonusDate) return;
    setLoading(true);
    try {
      const result = await createFestivalBonus({
        name: newBonus.name,
        bonusDate: newBonus.bonusDate,
        bonusPercentage: newBonus.bonusPercentage,
      });
      setFestivalBonuses((prev) => [result.bonus, ...prev]);
      setBonusDialogOpen(false);
      setNewBonus({ name: "", bonusDate: format(new Date(), "yyyy-MM-dd"), bonusPercentage: 50 });
      toast.success("Festival bonus created");
    } catch {
      toast.error("Failed to create festival bonus");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBonus = async (id: string) => {
    if (!confirm("Delete this festival bonus event?")) return;
    try {
      await deleteFestivalBonus(id);
      setFestivalBonuses((prev) => prev.filter((b) => b.id !== id));
      toast.success("Festival bonus deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleProcessBonus = async (id: string) => {
    setProcessingId(id);
    try {
      const result = await processFestivalBonus(id);
      setFestivalBonuses((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, processed: true, processedAt: new Date() } : b,
        ),
      );
      toast.success(
        `Processed! ${result.processed}/${result.totalEmployees} employees eligible`,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to process");
    } finally {
      setProcessingId(null);
    }
  };

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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="p-4 md:p-6 space-y-6"
    >
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-muted-foreground">
          Configure global parameters for the EMS
        </p>
      </motion.div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="working-days">Working Days</TabsTrigger>
          <TabsTrigger value="bonus">Bonus</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <motion.div variants={fadeInUp}>
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Manage basic company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="companyName"
                      value={settings.companyName as string}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() =>
                        handleUpdateSetting(
                          "companyName",
                          settings.companyName as string,
                        )
                      }
                      disabled={loading}
                    >
                      <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advancePercentage">
                    Advance Salary Limit (%)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="advancePercentage"
                      type="number"
                      min={1}
                      max={100}
                      value={settings.advancePercentage as number}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          advancePercentage: parseInt(e.target.value) || 50,
                        }))
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() =>
                        handleUpdateSetting(
                          "advancePercentage",
                          String(settings.advancePercentage),
                        )
                      }
                      disabled={loading}
                    >
                      <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maximum percentage of monthly salary employees can request
                    as advance. Default: 50%
                  </p>
                </div>
                <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Days in Month</p>
                      <p className="text-xs text-muted-foreground">
                        Salary is calculated using actual calendar days per
                        month (28–31). No manual configuration needed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Working Days Tab */}
        <TabsContent value="working-days">
          <motion.div variants={fadeInUp} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Days in Month — Auto Detected</CardTitle>
                </div>
                <CardDescription>
                  Salary daily rate is automatically calculated using the
                  actual number of days in each month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {monthNames.map((name, i) => {
                    const days = getDaysInMonth(today.getFullYear(), i);
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 text-center ${
                          i === today.getMonth()
                            ? "border-primary bg-primary/5"
                            : "bg-card"
                        }`}
                      >
                        <div className="text-sm font-medium">{name}</div>
                        <div className="text-2xl font-bold mt-1">{days}</div>
                        <div className="text-xs text-muted-foreground">
                          days
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Bonus Tab */}
        <TabsContent value="bonus">
          <motion.div variants={fadeInUp} className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-muted-foreground" />
                  <CardTitle>Festival Bonus Events</CardTitle>
                </div>
                <CardDescription>
                  Create festival bonus events (e.g., Eid-ul-Fitr, Eid-ul-Adha)
                  and process them to grant 50% salary bonus to eligible employees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Bonus Rules</p>
                    <p className="text-xs text-muted-foreground">
                      50% of monthly salary · 6+ months tenure
                    </p>
                  </div>
                  <Button onClick={() => setBonusDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Event
                  </Button>
                </div>

                {festivalBonuses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No festival bonus events yet. Add one above.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Bonus %</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Processed At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {festivalBonuses.map((fb) => {
                        const bonusDate = new Date(fb.bonusDate);
                        return (
                          <TableRow key={fb.id}>
                            <TableCell className="font-medium">
                              {fb.name}
                            </TableCell>
                            <TableCell>
                              {format(bonusDate, "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{fb.bonusPercentage}%</TableCell>
                            <TableCell>
                              {fb.processed ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                  Processed
                                </Badge>
                              ) : (
                                <Badge variant="outline">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {fb.processedAt
                                ? format(new Date(fb.processedAt), "MMM dd, yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {!fb.processed && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleProcessBonus(fb.id)}
                                    disabled={processingId === fb.id}
                                  >
                                    <Play className="h-4 w-4 mr-1" />
                                    {processingId === fb.id
                                      ? "Processing..."
                                      : "Process"}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteBonus(fb.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Create Festival Bonus Dialog */}
      <Dialog open={bonusDialogOpen} onOpenChange={setBonusDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Festival Bonus Event</DialogTitle>
            <DialogDescription>
              Create a bonus event for an upcoming festival. Eligible employees
              will receive 50% of their monthly salary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Festival Name</Label>
              <Input
                placeholder="e.g., Eid-ul-Fitr 2026"
                value={newBonus.name}
                onChange={(e) =>
                  setNewBonus((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Festival Date</Label>
              <Input
                type="date"
                value={newBonus.bonusDate}
                onChange={(e) =>
                  setNewBonus((prev) => ({
                    ...prev,
                    bonusDate: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Bonus will be applied to the month containing this date
              </p>
            </div>
            <div className="space-y-2">
              <Label>Bonus Percentage (%)</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={newBonus.bonusPercentage}
                onChange={(e) =>
                  setNewBonus((prev) => ({
                    ...prev,
                    bonusPercentage: parseInt(e.target.value) || 50,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Percentage of monthly salary (default: 50%)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBonusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBonus} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
