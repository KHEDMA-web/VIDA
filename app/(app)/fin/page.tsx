import { requireUserId, getOrCreateSettings } from "@/lib/user";
import { prisma } from "@/lib/prisma";
import { FinancesView } from "@/components/domains/Finances";

export default async function FinancesPage() {
  const userId = await requireUserId();
  const [settings, transactions] = await Promise.all([
    getOrCreateSettings(userId),
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: "desc" } }),
  ]);
  return <FinancesView transactions={transactions} currency={settings.currency} monthlyBudget={settings.monthlyBudget} />;
}
