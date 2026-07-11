import { requireUserId, getOrCreateSettings } from "@/lib/user";
import { SettingsView } from "@/components/domains/Settings";

export default async function SettingsPage() {
  const userId = await requireUserId();
  const settings = await getOrCreateSettings(userId);
  return <SettingsView settings={settings} />;
}
