import Link from "next/link";
import { T } from "@/lib/theme";
import { Card, Btn, Input } from "@/components/ui";
import { signIn } from "@/app/auth/actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div style={{
      background: T.bg, minHeight: "100vh", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 16,
      color: T.text, fontFamily: "'Inter',system-ui,sans-serif",
    }}>
      <Card style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
          Connexion
        </div>
        {error && (
          <div style={{ color: T.sport, fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <form action={signIn} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input type="email" name="email" placeholder="Email" required autoComplete="email" />
          <Input type="password" name="password" placeholder="Mot de passe" required autoComplete="current-password" />
          <Btn type="submit" color={T.goal}>Se connecter</Btn>
        </form>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 16, textAlign: "center" }}>
          Pas encore de compte ? <Link href="/sign-up" style={{ color: T.goal }}>Créer un compte</Link>
        </div>
      </Card>
    </div>
  );
}
