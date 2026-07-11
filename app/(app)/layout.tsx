import { requireUserId, getOrCreateSettings } from "@/lib/user";
import { Shell } from "@/components/Shell";
import { ALL_IDS, type DomainId } from "@/lib/theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId();
  const settings = await getOrCreateSettings(userId);
  const active = (settings.activeDomains.length ? settings.activeDomains : ALL_IDS) as DomainId[];

  return <Shell active={active}>{children}</Shell>;
}
