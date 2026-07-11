import { prisma } from "./prisma";
import { lastNDays, today, daysSince } from "./dates";
import { T, PRAYERS, ALL_IDS, type DomainId } from "./theme";
import type { Fraction } from "@/components/Boussole";

type BilanRow = { id: DomainId; label: string; value: string | number; kind?: "currency" };

export async function getDashboardData(userId: string) {
  const d = today();
  const days7 = lastNDays(7);
  const since = days7[0];

  const [
    settings,
    transactions,
    sessions,
    habits,
    habitChecks,
    goals,
    learningSessions,
    books,
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
    todos,
  ] = await Promise.all([
    prisma.settings.findUniqueOrThrow({ where: { userId } }),
    prisma.transaction.findMany({ where: { userId, date: { gte: since } } }),
    prisma.sportSession.findMany({ where: { userId, date: { gte: since } } }),
    prisma.habit.findMany({ where: { userId } }),
    prisma.habitCheck.findMany({ where: { userId, date: { gte: since } } }),
    prisma.goal.findMany({ where: { userId } }),
    prisma.learningSession.findMany({ where: { userId, date: { gte: since } } }),
    prisma.book.findMany({ where: { userId } }),
    prisma.readingLog.findMany({ where: { userId, date: { gte: since } } }),
    prisma.dependencyItem.findMany({ where: { userId } }),
    prisma.dependencyCount.findMany({ where: { userId, date: { gte: since } } }),
    prisma.houseTask.findMany({ where: { userId } }),
    prisma.houseTaskLog.findMany({ where: { userId, date: { gte: since } } }),
    prisma.contact.findMany({ where: { userId } }),
    prisma.contactLog.findMany({ where: { userId, date: { gte: since } } }),
    prisma.prayerCheck.findMany({ where: { userId, date: { gte: since } } }),
    prisma.vehicleTask.findMany({ where: { userId } }),
    prisma.vehicleTaskLog.findMany({ where: { userId, date: { gte: since } } }),
    prisma.sleepLog.findMany({ where: { userId, date: { gte: since } } }),
    prisma.todoTask.findMany({ where: { userId } }),
  ]);

  const active = (settings.activeDomains.length ? settings.activeDomains : ALL_IDS) as DomainId[];

  const finDone = transactions.some((t) => t.date === d) ? 1 : 0;
  const sportDone = sessions.some((s) => s.date === d) ? 1 : 0;
  const todayHabitChecks = habitChecks.filter((c) => c.date === d).map((c) => c.habitId);
  const habFrac = habits.length ? todayHabitChecks.length / habits.length : 0;
  const goalDone = learningSessions.some((s) => s.date === d) ? 1 : 0;
  const bookDone = readingLogs.some((l) => l.date === d) ? 1 : 0;

  const todayDepCounts = depCounts.filter((c) => c.date === d);
  const depFrac = depItems.length
    ? depItems.filter((it) => !(todayDepCounts.find((c) => c.itemId === it.id)?.count ?? 0)).length / depItems.length
    : 0;

  const maisonFrac = houseTasks.length
    ? houseTasks.filter((t) => t.lastDone && daysSince(t.lastDone) < t.freqDays).length / houseTasks.length
    : 0;
  const relFrac = contacts.length
    ? contacts.filter((c) => c.lastContact && daysSince(c.lastContact) < c.freqDays).length / contacts.length
    : 0;
  const todayPrayers = prayerChecks.filter((p) => p.date === d).map((p) => p.prayer);
  const priereFrac = todayPrayers.length / PRAYERS.length;
  const vehiculeFrac = vehicleTasks.length
    ? vehicleTasks.filter((t) => t.lastDone && daysSince(t.lastDone) < t.freqDays).length / vehicleTasks.length
    : 0;
  const todaySleep = sleepLogs.find((l) => l.date === d);
  const sommeilFrac = todaySleep ? Math.min(1, todaySleep.hours / (settings.sleepTarget || 8)) : 0;
  const openTodos = todos.filter((t) => !t.done).length;
  const doneTodayTodos = todos.filter((t) => t.done && t.doneDate === d).length;
  const todoFrac = openTodos + doneTodayTodos > 0 ? doneTodayTodos / (openTodos + doneTodayTodos) : 0;

  const fractions: Fraction[] = [
    { id: "fin", color: T.fin, value: finDone },
    { id: "sport", color: T.sport, value: sportDone },
    { id: "hab", color: T.hab, value: habFrac },
    { id: "goal", color: T.goal, value: goalDone },
    { id: "book", color: T.book, value: bookDone },
    { id: "dep", color: T.dep, value: depFrac },
    { id: "maison", color: T.maison, value: maisonFrac },
    { id: "rel", color: T.rel, value: relFrac },
    { id: "priere", color: T.priere, value: priereFrac },
    { id: "vehicule", color: T.vehicule, value: vehiculeFrac },
    { id: "sommeil", color: T.sommeil, value: sommeilFrac },
    { id: "todo", color: T.todo, value: todoFrac },
  ].filter((f) => active.includes(f.id as DomainId));

  const dep7 = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const seances7 = sessions.length;
  const habRates = days7.map((day) => {
    const c = habitChecks.filter((h) => h.date === day).length;
    return habits.length ? c / habits.length : 0;
  });
  const habAvg = Math.round((habRates.reduce((a, b) => a + b, 0) / 7) * 100);
  const learn7 = learningSessions.reduce((s, l) => s + l.minutes, 0);
  const pages7 = readingLogs.reduce((s, l) => s + l.pages, 0);
  const conso7 = depCounts.reduce((s, c) => s + c.count, 0);
  const maison7 = houseLogs.length;
  const rel7 = contactLogs.length;
  const priere7 = prayerChecks.length;
  const vehicule7 = vehicleLogs.length;
  const sleepAvg = sleepLogs.length
    ? (sleepLogs.reduce((s, l) => s + l.hours, 0) / sleepLogs.length).toFixed(1)
    : null;
  const todo7 = todos.filter((t) => t.done && t.doneDate && days7.includes(t.doneDate)).length;

  return {
    settings,
    active,
    fractions,
    today: d,
    habits,
    todayHabitChecks,
    todayPrayers,
    openTasks: todos
      .filter((t) => !t.done)
      .sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0))
      .slice(0, 4),
    bilan: [
      { id: "fin", label: "Dépenses", value: dep7, kind: "currency" } as BilanRow,
      { id: "sport", label: "Séances de sport", value: `${seances7} / ${settings.weeklyTarget} visées` } as BilanRow,
      { id: "hab", label: "Habitudes tenues", value: habits.length ? `${habAvg}%` : "—" } as BilanRow,
      { id: "goal", label: "Apprentissage", value: `${learn7} min` } as BilanRow,
      { id: "book", label: "Lecture", value: `${pages7} pages` } as BilanRow,
      { id: "dep", label: "Consommations", value: depItems.length ? `${conso7}` : "—" } as BilanRow,
      { id: "maison", label: "Tâches maison faites", value: `${maison7}` } as BilanRow,
      { id: "rel", label: "Contacts pris", value: `${rel7}` } as BilanRow,
      { id: "priere", label: "Prières", value: `${priere7} / 35` } as BilanRow,
      { id: "vehicule", label: "Entretiens véhicule", value: `${vehicule7}` } as BilanRow,
      { id: "sommeil", label: "Sommeil moyen", value: sleepAvg ? `${sleepAvg} h` : "—" } as BilanRow,
      { id: "todo", label: "Tâches terminées", value: `${todo7}` } as BilanRow,
    ].filter((r) => active.includes(r.id as DomainId)),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
