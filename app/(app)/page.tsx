import { requireUserId } from "@/lib/user";
import { getDashboardData } from "@/lib/dashboard";
import { getTrendData } from "@/lib/trends";
import { HomeView } from "@/components/Home";

export default async function HomePage() {
  const userId = await requireUserId();
  const [data, trend] = await Promise.all([
    getDashboardData(userId),
    getTrendData(userId, 30),
  ]);
  return <HomeView data={data} trend={trend} />;
}
