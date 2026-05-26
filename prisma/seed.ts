// prisma/seed.ts
import "dotenv/config";
import {
  PrismaClient,
  Role,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  AdvanceStatus,
} from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data (order matters for foreign keys)
  await prisma.auditLog.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.advanceSalary.deleteMany();
  await prisma.workingDaySetting.deleteMany();
  await prisma.globalSetting.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash("password123", salt);

  // 1. Create Owner
  const owner = await prisma.user.create({
    data: {
      email: "owner@abnetwork.com",
      password: defaultPassword,
      name: "Owner User",
      role: Role.OWNER,
      monthlySalary: 25000,
      leaveQuota: 15,
    },
  });

  // 2. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: "admin@abnetwork.com",
      password: defaultPassword,
      name: "Admin User",
      role: Role.ADMIN,
      monthlySalary: 18000,
      leaveQuota: 12,
    },
  });

  // 3. Create Employees
  const employees = await Promise.all([
    prisma.user.create({
      data: {
        email: "employee1@abnetwork.com",
        password: defaultPassword,
        name: "John Doe",
        role: Role.EMPLOYEE,
        monthlySalary: 10000,
        leaveQuota: 12,
      },
    }),
    prisma.user.create({
      data: {
        email: "employee2@abnetwork.com",
        password: defaultPassword,
        name: "Jane Smith",
        role: Role.EMPLOYEE,
        monthlySalary: 10000,
        leaveQuota: 12,
      },
    }),
    prisma.user.create({
      data: {
        email: "employee3@abnetwork.com",
        password: defaultPassword,
        name: "Mike Johnson",
        role: Role.EMPLOYEE,
        monthlySalary: 10000,
        leaveQuota: 12,
      },
    }),
  ]);

  // 4. Working days for current month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  await prisma.workingDaySetting.create({
    data: {
      month: currentMonthStart,
      daysCount: 22,
      notes: "Monday‑Friday working days",
      setBy: owner.id,
    },
  });

  // 5. Global settings
  await prisma.globalSetting.createMany({
    data: [
      { key: "eidBonus", value: "5000" },
      { key: "companyName", value: "AB‑Network" },
      { key: "defaultWorkingDays", value: "22" },
    ],
  });

  // 6. Sample attendance for first 10 days of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  for (let i = 0; i < Math.min(10, 28); i++) {
    const date = new Date(startOfMonth);
    date.setDate(startOfMonth.getDate() + i);
    if (date > now) break;

    for (const emp of employees) {
      const rand = Math.random();
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      let halfDay = false;
      if (rand < 0.2) {
        status = AttendanceStatus.ABSENT;
      } else if (rand < 0.3) {
        status = AttendanceStatus.PRESENT;
        halfDay = true;
      }
      await prisma.attendance.create({
        data: {
          userId: emp.id,
          date,
          status,
          halfDay,
        },
      });
    }
  }

  // 7. Sample pending leave
  await prisma.leave.create({
    data: {
      userId: employees[0].id,
      type: LeaveType.CASUAL,
      startDate: new Date(now.getFullYear(), now.getMonth(), 15),
      endDate: new Date(now.getFullYear(), now.getMonth(), 17),
      reason: "Family event",
      status: LeaveStatus.PENDING,
    },
  });

  // 8. Sample approved advance (not yet deducted)
  await prisma.advanceSalary.create({
    data: {
      userId: employees[1].id,
      amount: 2000,
      reason: "Medical emergency",
      status: AdvanceStatus.APPROVED,
      approvedBy: admin.id,
      approvedAt: new Date(),
      deductedInSalary: false,
    },
  });

  console.log("✅ Seeding completed!");
  console.log("📝 Login credentials (password: password123)");
  console.log(`   Owner: owner@abnetwork.com`);
  console.log(`   Admin: admin@abnetwork.com`);
  console.log(
    `   Employees: employee1@abnetwork.com, employee2@abnetwork.com, employee3@abnetwork.com`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
