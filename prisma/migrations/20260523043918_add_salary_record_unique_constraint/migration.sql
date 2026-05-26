/*
  Warnings:

  - A unique constraint covering the columns `[userId,month]` on the table `SalaryRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SalaryRecord_userId_month_key" ON "SalaryRecord"("userId", "month");
