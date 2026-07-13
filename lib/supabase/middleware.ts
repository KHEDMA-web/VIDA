import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/sign-in", "/sign-up"];
type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Rafraîchit la session Supabase à chaque requête et protège les pages non publiques. */
export async function updateSession(request: NextRequest) {
  const pendingCookies: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          pendingCookies.push(...cookiesToSet);
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Neutralise systématiquement tout header x-user-id envoyé par le client :
  // ne jamais le laisser traverser tel quel avant de le reposer (ou non) nous-mêmes.
  request.headers.delete("x-user-id");
  if (user) {
    // Évite de revalider le JWT via un nouvel appel réseau à Supabase Auth
    // dans chaque layout/page/route : ce header, posé après vérification ici,
    // est réutilisé par requireUserId() en aval.
    request.headers.set("x-user-id", user.id);
  }

  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next({ request });
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
