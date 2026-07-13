import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "./supabase/server";
import { prisma } from "./prisma";
import { ALL_IDS } from "./theme";

/**
 * Retourne l'id Supabase (auth.users.id) de l'utilisateur courant, ou lève si non authentifié.
 * Réutilise le header posé par le middleware (déjà vérifié via un appel réseau à Supabase Auth)
 * pour éviter de revalider le JWT à chaque layout/page/route sur la même requête.
 */
export async function requireUserId(): Promise<string> {
  const fromMiddleware = (await headers()).get("x-user-id");
  if (fromMiddleware) return fromMiddleware;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

/**
 * Garantit l'existence des lignes User + Settings pour l'utilisateur courant
 * (premier appel après inscription Supabase) et renvoie les settings.
 *
 * Enrobé avec React `cache()` : le layout et la page appellent tous les deux
 * cette fonction sur une même requête (rendus en parallèle par Next.js), donc
 * sans mémoïsation on payait 2x l'aller-retour DB — et pire, sur un compte
 * flambant neuf la page pouvait lire les settings avant que le layout ait fini
 * de les créer. `cache()` déduplique les appels identiques dans une même
 * requête : un seul appel réel, la seconde invocation attend la même promesse.
 */
export const getOrCreateSettings = cache(async (userId: string) => {
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
});
