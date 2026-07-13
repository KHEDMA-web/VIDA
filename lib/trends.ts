import { prisma } from "./prisma";
import { getOrCreateSettings } from "./user";
import { lastNDays } from "./dates";
import { T, PRAYERS, ALL_IDS, DOMAINS, type DomainId } from "./theme";

export type TrendSeries = { id: DomainId; label: string; color: string; values: number[] };
export type TrendData = { dates: string[]; series: TrendSeries[] };

/** Jours entre deux dates YYYY-MM-DD (positif si `to` est après `from`). */
function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000);
}

/**
 * Même logique de remplissage que la boussole (voir Boussole/getDashboardData),
 * mais calculée pour chaque jour d'une fenêtre glissante au lieu du seul "aujourd'hui" —
 * alimente le graphique de tendance en bas du dashboard.
 */
export async function getTrendData(userId: string, days: number): Promise<TrendData> {
  const dates = lastNDays(days);
  const since = dates[0];

  const [
    settings,
    transactions,
    sessions,
    habits,
    habitChecks,
    learningSessions,
    readingLogs,
    depItems,
    depCounts,
    houseTasks,
    houseLogs,
    contacts,
    contactLogs,
    prayerChecks,
    vehicleTasks,
    vehicleLogs,
    sleepLogs,
    doneTodos,
  ] = await Promise.all([
    getOrCreateSettings(userId),
    prisma.transaction.findMany({ where: { userId, date: { gte: since } }, select: { date: true } }),
    prisma.sportSession.findMany({ where: { userId, date: { gte: since } }, select: { date: true } }),
    prisma.habit.findMany({ where: { userId }, select: { id: true } }),
    prisma.habitCheck.findMany({ where: { userId, date: { gte: since } }, select: { date: true, habitId: true } }),
    prisma.learningSession.findMany({ where: { userId, date: { gte: since } }, select: { date: true } }),
    prisma.readingLog.findMany({ where: { userId, date: { gte: since } }, select: { date: true } }),
    prisma.dependencyItem.findMany({ where: { userId }, select: { id: true } }),
    prisma.dependencyCount.findMany({ where: { userId, date: { gte: since } }, select: { date: true, itemId: true, count: true } }),
    prisma.houseTask.findMany({ where: { userId }, select: { id: true, freqDays: true } }),
    // Logs non filtrés par date : il faut l'historique complet pour reconstituer
    // le statut "à jour" à une date passée (voir daysBetween ci-dessous).
    prisma.houseTaskLog.findMany({ where: { userId }, select: { date: true, taskId: true } }),
    prisma.contact.findMany({ where: { userId }, select: { id: true, freqDays: true } }),
    prisma.contactLog.findMany({ where: { userId }, select: { date: true, contactId: true } }),
    prisma.prayerCheck.findMany({ where: { userId, date: { gte: since } }, select: { date: true } }),
    prisma.vehicleTask.findMany({ where: { userId }, select: { id: true, freqDays: true } }),
    prisma.vehicleTaskLog.findMany({ where: { userId }, select: { date: true, taskId: true } }),
    prisma.sleepLog.findMany({ where: { userId, date: { gte: since } }, select: { date: true, hours: true } }),
    prisma.todoTask.findMany({ where: { userId, done: true, doneDate: { gte: since } }, select: { doneDate: true } }),
  ]);

  const active = (settings.activeDomains.length ? settings.activeDomains : ALL_IDS) as DomainId[];

  /** Fraction "à jour" (0 ou 1) d'un item récurrent à une date donnée, à partir de ses logs. */
  function upToDateFraction<T extends { id: string; freqDays: number }>(
    tasks: T[],
    logs: { date: string; taskId?: string; contactId?: string }[],
    idKey: "taskId" | "contactId",
    day: string
  ): number {
    if (!tasks.length) return 0;
    const upToDate = tasks.filter((task) => {
      const lastBefore = logs
        .filter((l) => l[idKey] === task.id && l.date <= day)
        .reduce((max, l) => (l.date > max ? l.date : max), "");
      return lastBefore !== "" && daysBetween(lastBefore, day) < task.freqDays;
    });
    return upToDate.length / tasks.length;
  }

  const series: TrendSeries[] = DOMAINS.filter((d) => active.includes(d.id)).map((d) => {
    const values = dates.map((day) => {
      switch (d.id) {
        case "fin":
          return transactions.some((t) => t.date === day) ? 1 : 0;
        case "sport":
          return sessions.some((s) => s.date === day) ? 1 : 0;
        case "goal":
          return learningSessions.some((s) => s.date === day) ? 1 : 0;
        case "book":
          return readingLogs.some((l) => l.date === day) ? 1 : 0;
        case "hab": {
          if (!habits.length) return 0;
          const checked = new Set(habitChecks.filter((c) => c.date === day).map((c) => c.habitId));
          return checked.size / habits.length;
        }
        case "dep": {
          if (!depItems.length) return 0;
          const todayCounts = depCounts.filter((c) => c.date === day);
          const clean = depItems.filter((it) => !(todayCounts.find((c) => c.itemId === it.id)?.count ?? 0));
          return clean.length / depItems.length;
        }
        case "maison":
          return upToDateFraction(houseTasks, houseLogs, "taskId", day);
        case "rel":
          return upToDateFraction(contacts, contactLogs, "contactId", day);
        case "vehicule":
          return upToDateFraction(vehicleTasks, vehicleLogs, "taskId", day);
        case "priere":
          return prayerChecks.filter((p) => p.date === day).length / PRAYERS.length;
        case "sommeil": {
          const log = sleepLogs.find((l) => l.date === day);
          return log ? Math.min(1, log.hours / (settings.sleepTarget || 8)) : 0;
        }
        case "todo":
          return doneTodos.some((t) => t.doneDate === day) ? 1 : 0;
        default:
          return 0;
      }
    });
    return { id: d.id, label: d.label, color: T[d.id], values };
  });

  return { dates, series };
}
