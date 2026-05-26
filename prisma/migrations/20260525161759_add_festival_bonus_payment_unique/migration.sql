-- CreateTable
CREATE TABLE "FestivalBonusPayment" (
    "id" TEXT NOT NULL,
    "festivalBonusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FestivalBonusPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FestivalBonusPayment_festivalBonusId_userId_key" ON "FestivalBonusPayment"("festivalBonusId", "userId");

-- AddForeignKey
ALTER TABLE "FestivalBonusPayment" ADD CONSTRAINT "FestivalBonusPayment_festivalBonusId_fkey" FOREIGN KEY ("festivalBonusId") REFERENCES "FestivalBonus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FestivalBonusPayment" ADD CONSTRAINT "FestivalBonusPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
