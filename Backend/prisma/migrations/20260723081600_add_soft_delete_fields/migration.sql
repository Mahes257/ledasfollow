/*
  Warnings:

  - You are about to drop the `Lead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeadActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeadAttachment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LeadFollowUp` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LeadActivity" DROP CONSTRAINT "LeadActivity_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadAttachment" DROP CONSTRAINT "LeadAttachment_leadId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LeadFollowUp" DROP CONSTRAINT "LeadFollowUp_leadId_fkey";

-- DropTable
DROP TABLE "public"."Lead";

-- DropTable
DROP TABLE "public"."LeadActivity";

-- DropTable
DROP TABLE "public"."LeadAttachment";

-- DropTable
DROP TABLE "public"."LeadFollowUp";

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "leadNumber" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "website" TEXT,
    "industry" TEXT,
    "leadSource" TEXT,
    "leadStage" "public"."LeadStage" NOT NULL DEFAULT 'NEW',
    "leadStatus" "public"."LeadStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "public"."LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "expectedValue" DECIMAL(18,2),
    "gstNumber" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "postalCode" TEXT,
    "description" TEXT,
    "remarks" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_followups" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_followups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lead_attachments" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_leadNumber_key" ON "public"."leads"("leadNumber");

-- CreateIndex
CREATE INDEX "leads_leadNumber_idx" ON "public"."leads"("leadNumber");

-- CreateIndex
CREATE INDEX "leads_company_idx" ON "public"."leads"("company");

-- CreateIndex
CREATE INDEX "leads_contactPerson_idx" ON "public"."leads"("contactPerson");

-- CreateIndex
CREATE INDEX "leads_phone_idx" ON "public"."leads"("phone");

-- CreateIndex
CREATE INDEX "leads_email_idx" ON "public"."leads"("email");

-- CreateIndex
CREATE INDEX "leads_leadStage_idx" ON "public"."leads"("leadStage");

-- CreateIndex
CREATE INDEX "leads_leadStatus_idx" ON "public"."leads"("leadStatus");

-- CreateIndex
CREATE INDEX "leads_assignedTo_idx" ON "public"."leads"("assignedTo");

-- CreateIndex
CREATE INDEX "leads_isDeleted_idx" ON "public"."leads"("isDeleted");

-- CreateIndex
CREATE INDEX "lead_followups_leadId_idx" ON "public"."lead_followups"("leadId");

-- CreateIndex
CREATE INDEX "lead_activities_leadId_idx" ON "public"."lead_activities"("leadId");

-- CreateIndex
CREATE INDEX "lead_attachments_leadId_idx" ON "public"."lead_attachments"("leadId");

-- AddForeignKey
ALTER TABLE "public"."lead_followups" ADD CONSTRAINT "lead_followups_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lead_attachments" ADD CONSTRAINT "lead_attachments_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "public"."leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
