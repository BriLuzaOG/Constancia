-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'ISSUED', 'DECLINED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CertRequest" (
    "id" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "employeeRef" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "signJwk" JSONB NOT NULL,
    "encJwk" JSONB NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryJwe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Share" (
    "id" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Share_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CertRequest_employer_status_idx" ON "CertRequest"("employer", "status");
