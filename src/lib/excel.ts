// src/lib/excel.ts
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { formatCurrency } from "./constants";

// ==================== Types ====================
export interface AttendanceExportRow {
  "Employee Name": string;
  Present: number;
  "Half Days": number;
  Holiday: number;
  Absent: number;
  "Rate %"?: number;
}

export interface SalaryExportRow {
  "Employee Name": string;
  Gross: string;
  Bonus: string;
  Absent: number;
  Deduction: string;
  "Net Payable": string;
  "Net+Bonus": string;
  "Payment Status": string;
}

export interface LeaveExportRow {
  "Employee Name": string;
  Type: string;
  "Start Date": string;
  "End Date": string;
  Status: string;
}

// ==================== Core Export Function ====================
function downloadExcel(
  worksheetData: any[],
  sheetName: string,
  fileName: string,
) {
  const worksheet = XLSX.utils.json_to_sheet(worksheetData);

  // Auto-fit column widths
  const cols = Object.keys(worksheetData[0] ?? {}).map((key) => {
    let maxLen = key.length;
    for (const row of worksheetData) {
      const val = String(row[key] ?? "");
      let charLen = 0;
      for (const ch of val) {
        charLen += ch.charCodeAt(0) > 255 ? 2 : 1;
      }
      if (charLen > maxLen) maxLen = charLen;
    }
    return { wch: Math.min(maxLen + 3, 50) };
  });
  worksheet["!cols"] = cols;

  // Style cells
  const range = XLSX.utils.decode_range(worksheet["!ref"] ?? "");
  for (let R = range.s.r; R <= range.e.r; R++) {
    const isHeader = R === range.s.r;
    const isTotal = R === range.e.r && range.e.r > range.s.r;
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      if (!worksheet[addr]) continue;
      if (!worksheet[addr].s) worksheet[addr].s = {};
      worksheet[addr].s.alignment = { horizontal: "left" };
      worksheet[addr].z = "@";
      if (isHeader || isTotal) {
        worksheet[addr].s.font = { bold: true, sz: 12 };
      }
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
}

// ==================== Attendance Report ====================
export function exportAttendanceReport(
  data: Array<{
    name: string;
    email?: string;
    present: number;
    halfDays: number;
    holidays: number;
    absent: number;
  }>,
  startDate: Date,
  endDate: Date,
) {
  const rows: AttendanceExportRow[] = data.map((emp) => ({
    "Employee Name": emp.name,
    Present: emp.present,
    "Half Days": emp.halfDays,
    Holiday: emp.holidays,
    Absent: emp.absent,
  }));

  // Totals row
  const totalPresent = data.reduce((s, e) => s + e.present, 0);
  const totalHalf = data.reduce((s, e) => s + e.halfDays, 0);
  const totalHoliday = data.reduce((s, e) => s + e.holidays, 0);
  const totalAbsent = data.reduce((s, e) => s + e.absent, 0);
  rows.push({
    "Employee Name": "Total",
    Present: totalPresent,
    "Half Days": totalHalf,
    Holiday: totalHoliday,
    Absent: totalAbsent,
  });

  const fileName = `attendance_report_${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}.xlsx`;
  downloadExcel(rows, "Attendance Report", fileName);
  return rows.length;
}

export function exportAdminAttendanceView(
  data: Array<{
    name: string;
    summary: { present: number; halfDays: number; holidays: number; absent: number };
    totalDays: number;
  }>,
  fromDate: string,
  toDate: string,
) {
  const rows: AttendanceExportRow[] = data.map((emp) => {
    const marked =
      emp.summary.present +
      emp.summary.halfDays +
      emp.summary.holidays +
      emp.summary.absent;
    return {
      "Employee Name": emp.name,
      Present: emp.summary.present,
      "Half Days": emp.summary.halfDays,
      Holiday: emp.summary.holidays,
      Absent: emp.summary.absent,
      "Rate %": emp.totalDays > 0 ? Math.round((marked / emp.totalDays) * 100) : 0,
    };
  });

  // Totals row
  const totalPresent = rows.reduce((s, r) => s + r.Present, 0);
  const totalHalf = rows.reduce((s, r) => s + r["Half Days"], 0);
  const totalHoliday = rows.reduce((s, r) => s + r.Holiday, 0);
  const totalAbsent = rows.reduce((s, r) => s + r.Absent, 0);
  rows.push({
    "Employee Name": "Total",
    Present: totalPresent,
    "Half Days": totalHalf,
    Holiday: totalHoliday,
    Absent: totalAbsent,
    "Rate %": data.length > 0
      ? Math.round(
          ((totalPresent + totalHalf + totalHoliday + totalAbsent) /
            (data[0].totalDays * data.length)) *
            100,
        )
      : 0,
  });

  const fileName = `attendance_${fromDate}_to_${toDate}.xlsx`;
  downloadExcel(rows, "Attendance", fileName);
  return rows.length;
}

// ==================== Salary Report ====================
export function exportSalaryReport(
  data: Array<{
    user: { name: string; email: string; monthlySalary: number };
    grossSalary: number;
    absentDays: number;
    attendanceDeduction: number;
    advanceDeduction: number;
    eidBonus: number;
    netPayable: number;
    paid: boolean;
  }>,
  month: number,
  year: number,
) {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const rows: SalaryExportRow[] = data.map((emp) => ({
    "Employee Name": emp.user.name,
    Gross: formatCurrency(emp.grossSalary),
    Bonus: formatCurrency(emp.eidBonus),
    Absent: (emp as any).absentDays ?? 0,
    Deduction: formatCurrency(emp.attendanceDeduction + emp.advanceDeduction),
    "Net Payable": formatCurrency(emp.netPayable),
    "Net+Bonus": formatCurrency(emp.netPayable + emp.eidBonus),
    "Payment Status": emp.paid ? "Yes" : "No",
  }));

  // Totals row
  const totals = data.reduce(
    (acc, e) => ({
      gross: acc.gross + e.grossSalary,
      bonus: acc.bonus + e.eidBonus,
      absent: acc.absent + ((e as any).absentDays ?? 0),
      deduction: acc.deduction + e.attendanceDeduction + e.advanceDeduction,
      net: acc.net + e.netPayable,
    }),
    { gross: 0, bonus: 0, absent: 0, deduction: 0, net: 0 },
  );
  rows.push({
    "Employee Name": "Total",
    Gross: formatCurrency(totals.gross),
    Bonus: formatCurrency(totals.bonus),
    Absent: totals.absent,
    Deduction: formatCurrency(totals.deduction),
    "Net Payable": formatCurrency(totals.net),
    "Net+Bonus": formatCurrency(totals.net + totals.bonus),
    "Payment Status": "—",
  });

  const fileName = `salary_report_${monthNames[month]}_${year}.xlsx`;
  downloadExcel(rows, "Salary Report", fileName);
  return rows.length;
}

// ==================== Leave Report ====================
export function exportLeaveReport(
  data: Array<{
    user: { name: string; email: string };
    type: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
    status: string;
  }>,
  startDate: Date,
  endDate: Date,
) {
  const rows: LeaveExportRow[] = data.map((leave) => ({
    "Employee Name": leave.user.name,
    Type: leave.type,
    "Start Date": format(leave.startDate, "MMM dd, yyyy"),
    "End Date": format(leave.endDate, "MMM dd, yyyy"),
    Status: leave.status,
  }));

  // Totals row
  rows.push({
    "Employee Name": `Total (${data.length})`,
    Type: "—",
    "Start Date": "—",
    "End Date": "—",
    Status: "—",
  });

  const fileName = `leave_report_${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}.xlsx`;
  downloadExcel(rows, "Leave Report", fileName);
  return rows.length;
}

// ==================== Custom Data Export ====================
export function exportCustomReport<T extends Record<string, any>>(
  data: T[],
  sheetName: string,
  fileName: string,
) {
  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }
  downloadExcel(data, sheetName, fileName);
  return data.length;
}

// ==================== Employee Payslip ====================
export function exportPayslip(
  employee: {
    name: string;
    email: string;
    monthlySalary: number;
  },
  salaryDetails: {
    presentDays: number;
    halfDays: number;
    absentDays: number;
    attendanceDeduction: number;
    advanceDeduction: number;
    eidBonus: number;
    netPayable: number;
  },
  month: number,
  year: number,
) {
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
  const rows = [
    { Field: "Employee Name", Value: employee.name },
    { Field: "Email", Value: employee.email },
    { Field: "Month", Value: `${monthNames[month]} ${year}` },
    { Field: "", Value: "" },
    { Field: "Gross Salary", Value: employee.monthlySalary },
    { Field: "Present Days", Value: salaryDetails.presentDays },
    { Field: "Half Days", Value: salaryDetails.halfDays },
    { Field: "Absent Days", Value: salaryDetails.absentDays },
    { Field: "Attendance Deduction", Value: salaryDetails.attendanceDeduction },
    { Field: "Advance Deduction", Value: salaryDetails.advanceDeduction },
    { Field: "Eid Bonus", Value: salaryDetails.eidBonus },
    { Field: "Net Payable", Value: salaryDetails.netPayable },
  ];

  const fileName = `payslip_${employee.name.replace(/\s/g, "_")}_${monthNames[month]}_${year}.xlsx`;
  downloadExcel(rows, "Payslip", fileName);
  return true;
}
