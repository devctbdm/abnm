-- CreateTable
CREATE TABLE "FestivalBonus" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bonusDate" TIMESTAMP(3) NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FestivalBonus_pkey" PRIMARY KEY ("id")
);
