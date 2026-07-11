import { requireUserId } from "@/lib/user";
import { getDashboardData } from "@/lib/dashboard";
import { HomeView } from "@/components/Home";

export default async function HomePage() {
  const userId = await requireUserId();
  const data = await getDashboardData(userId);
  return <HomeView data={data} />;
}
