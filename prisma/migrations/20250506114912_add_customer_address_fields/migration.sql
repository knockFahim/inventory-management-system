-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'United States',
ADD COLUMN     "houseNumber" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "road" TEXT,
ADD COLUMN     "state" TEXT;
