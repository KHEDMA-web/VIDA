import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api";
import { ALL_IDS } from "@/lib/theme";

/** Supprime toutes les données personnelles de l'utilisateur et réinitialise les réglages. */
export async function POST() {
  return withAuth(async (userId) => {
    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { userId } }),
      prisma.sportSession.deleteMany({ where: { userId } }),
      prisma.weight.deleteMany({ where: { userId } }),
      prisma.habitCheck.deleteMany({ where: { userId } }),
      prisma.habit.deleteMany({ where: { userId } }),
      prisma.goal.deleteMany({ where: { userId } }),
      prisma.learningSession.deleteMany({ where: { userId } }),
      prisma.readingLog.deleteMany({ where: { userId } }),
      prisma.book.deleteMany({ where: { userId } }),
      prisma.dependencyCount.deleteMany({ where: { userId } }),
      prisma.dependencyItem.deleteMany({ where: { userId } }),
      prisma.houseTaskLog.deleteMany({ where: { userId } }),
      prisma.houseTask.deleteMany({ where: { userId } }),
      prisma.contactLog.deleteMany({ where: { userId } }),
      prisma.contact.deleteMany({ where: { userId } }),
      prisma.prayerCheck.deleteMany({ where: { userId } }),
      prisma.vehicleTaskLog.deleteMany({ where: { userId } }),
      prisma.vehicleTask.deleteMany({ where: { userId } }),
      prisma.sleepLog.deleteMany({ where: { userId } }),
      prisma.todoTask.deleteMany({ where: { userId } }),
      prisma.liftLog.deleteMany({ where: { userId } }),
      prisma.meal.deleteMany({ where: { userId } }),
      prisma.shoppingItem.deleteMany({ where: { userId } }),
      prisma.settings.update({
        where: { userId },
        data: {
          name: "", currency: "EUR", activeDomains: ALL_IDS,
          prayerCity: null, prayerLat: null, prayerLng: null, prayerMethod: "19",
          monthlyBudget: 1000, weeklyTarget: 3, sleepTarget: 8, weightGoal: null,
          heightCm: null, age: null, sex: null, activityLevel: 2, nutritionGoal: "maintien",
        },
      }),
    ]);
    return { ok: true };
  });
}
