-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('pending', 'processing', 'complete', 'failed');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyUrl" TEXT NOT NULL,
    "icpScore" INTEGER,
    "status" "LeadStatus" NOT NULL DEFAULT 'pending',
    "industry" TEXT,
    "companySize" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIOutput" (
    "id" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,

    CONSTRAINT "AIOutput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailSequence" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dayOffset" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT NOT NULL,

    CONSTRAINT "EmailSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyUrl" TEXT NOT NULL,
    "seedKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "AIOutput_leadId_step_idx" ON "AIOutput"("leadId", "step");

-- CreateIndex
CREATE INDEX "EmailSequence_leadId_idx" ON "EmailSequence"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "DemoLead_seedKey_key" ON "DemoLead"("seedKey");

-- CreateIndex
CREATE INDEX "DemoLead_seedKey_idx" ON "DemoLead"("seedKey");

-- AddForeignKey
ALTER TABLE "AIOutput" ADD CONSTRAINT "AIOutput_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailSequence" ADD CONSTRAINT "EmailSequence_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
