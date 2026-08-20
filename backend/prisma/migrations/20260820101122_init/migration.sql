-- CreateTable
CREATE TABLE "DiseaseDetection" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "disease" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "isHealthy" BOOLEAN NOT NULL DEFAULT false,
    "treatment" TEXT,
    "description" TEXT,
    "prevention" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiseaseDetection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DiseaseDetection" ADD CONSTRAINT "DiseaseDetection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
