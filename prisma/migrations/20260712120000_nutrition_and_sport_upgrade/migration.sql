-- AlterTable: nouveaux réglages sport (objectif de poids) + profil physique (nutrition)
ALTER TABLE "Settings"
  ADD COLUMN "weightGoal" DOUBLE PRECISION,
  ADD COLUMN "heightCm" INTEGER,
  ADD COLUMN "age" INTEGER,
  ADD COLUMN "sex" TEXT,
  ADD COLUMN "activityLevel" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "nutritionGoal" TEXT NOT NULL DEFAULT 'maintien';

-- AlterTable: le domaine "nutrition" rejoint les domaines actifs par défaut pour les nouveaux comptes
ALTER TABLE "Settings"
  ALTER COLUMN "activeDomains" SET DEFAULT ARRAY['fin', 'sport', 'hab', 'goal', 'book', 'dep', 'maison', 'rel', 'priere', 'vehicule', 'sommeil', 'todo', 'nutrition']::TEXT[];

-- CreateTable
CREATE TABLE "LiftLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exercise" TEXT NOT NULL,
    "kg" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,

    CONSTRAINT "LiftLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kcal" INTEGER NOT NULL,
    "protein" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cat" TEXT NOT NULL DEFAULT 'Autre',
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TEXT NOT NULL,

    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiftLog_userId_date_idx" ON "LiftLog"("userId", "date");

-- CreateIndex
CREATE INDEX "Meal_userId_date_idx" ON "Meal"("userId", "date");

-- CreateIndex
CREATE INDEX "ShoppingItem_userId_idx" ON "ShoppingItem"("userId");

-- AddForeignKey
ALTER TABLE "LiftLog" ADD CONSTRAINT "LiftLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meal" ADD CONSTRAINT "Meal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingItem" ADD CONSTRAINT "ShoppingItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
