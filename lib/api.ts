import { NextResponse } from "next/server";
import { requireUserId } from "./user";

/** Enrobe un handler de route API : résout l'utilisateur Clerk courant et
 * uniformise les réponses d'erreur (401 si non connecté, 500 sinon). */
export async function withAuth<T>(handler: (userId: string) => Promise<T>) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await handler(userId);
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
