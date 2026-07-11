import { createClient } from "./supabase/server";
import { prisma } from "./prisma";
import { ALL_IDS } from "./theme";

/** Retourne l'id Supabase (auth.users.id) de l'utilisateur courant, ou lève si non authentifié. */
export async function requireUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

/**
 * Garantit l'existence des lignes User + Settings pour l'utilisateur courant
 * (premier appel après inscription Supabase) et renvoie les settings.
 */
export async function getOrCreateSettings(userId: string) {
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
  return prisma.settings.upsert({
    where: { userId },
    update: {},
    create: { userId, activeDomains: ALL_IDS },
  });
}
