import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  HandCoins,
  Users,
  Settings,
  BarChart3,
  UserCircle2,
  Gift,
} from "lucide-react";

export const CURRENCY = {
  SYMBOL: "Tk",
  CODE: "BDT",
  NAME: "Bangladeshi Taka",
};

// For formatting numbers
export const formatCurrency = (amount: number): string => {
  const rounded = Math.round(amount * 10) / 10;
  return `${CURRENCY.SYMBOL} ${rounded.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: ("OWNER" | "ADMIN" | "EMPLOYEE")[];
}

export const commonNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    roles: ["OWNER", "ADMIN", "EMPLOYEE"],
  },
  {
    title: "Attendance",
    url: "/admin/attendance",
    icon: CalendarCheck,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Leave",
    url: "/admin/leave",
    icon: FileText,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Advance Salary",
    url: "/admin/advance",
    icon: HandCoins,
    roles: ["OWNER", "ADMIN"],
  },
];

export const adminNavItems: NavItem[] = [
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Mark Attendance",
    url: "/admin/attendance/mark",
    icon: CalendarCheck,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Holidays",
    url: "/admin/attendance/holiday",
    icon: Gift,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Salary",
    url: "/admin/salary",
    icon: BarChart3,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Reports",
    url: "/admin/reports",
    icon: BarChart3,
    roles: ["OWNER", "ADMIN"],
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
    roles: ["OWNER", "ADMIN"],
  },
];

export const employeeNavItems: NavItem[] = [
  {
    title: "My Stats",
    url: "/employee/stats",
    icon: UserCircle2,
    roles: ["EMPLOYEE"],
  },
  {
    title: "Attendance",
    url: "/employee/attendance",
    icon: CalendarCheck,
    roles: ["EMPLOYEE"],
  },
  {
    title: "Mark Attendance",
    url: "/employee/attendance/mark",
    icon: CalendarCheck,
    roles: ["EMPLOYEE"],
  },
  {
    title: "Leave",
    url: "/employee/leave",
    icon: FileText,
    roles: ["EMPLOYEE"],
  },
  {
    title: "Advance Salary",
    url: "/employee/advance",
    icon: HandCoins,
    roles: ["EMPLOYEE"],
  },
];

export const allNavItems = [
  ...commonNavItems,
  ...adminNavItems,
  ...employeeNavItems,
];

export function getNavItemsByRole(role: "OWNER" | "ADMIN" | "EMPLOYEE") {
  const employeeUrlMap: Record<string, string> = {
    Dashboard: "/employee",
    Attendance: "/employee/attendance",
    "Mark Attendance": "/employee/mark-attendance",
    Leave: "/employee/leave",
    "Advance Salary": "/employee/advance",
  };

  return allNavItems
    .filter((item) => item.roles.includes(role))
    .map((item) => {
      if (role === "EMPLOYEE" && employeeUrlMap[item.title]) {
        return { ...item, url: employeeUrlMap[item.title] };
      }
      if (item.title === "Dashboard" && role !== "EMPLOYEE") {
        return { ...item, url: "/admin" };
      }
      return item;
    });
}
