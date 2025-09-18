-- AlterTable
ALTER TABLE "public"."Area" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "notes" TEXT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Task" ALTER COLUMN "updatedAt" DROP DEFAULT;
