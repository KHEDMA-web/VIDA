import Link from "next/link";
import { T } from "@/lib/theme";
import { Card, Btn, Input } from "@/components/ui";
import { signUp } from "@/app/auth/actions";

export default async function SignUpPage({
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
          Créer un compte
        </div>
        {error && (
          <div style={{ color: T.sport, fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}
        <form action={signUp} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Input type="email" name="email" placeholder="Email" required autoComplete="email" />
          <Input type="password" name="password" placeholder="Mot de passe (6 caractères min.)" required minLength={6} autoComplete="new-password" />
          <Btn type="submit" color={T.goal}>Créer mon compte</Btn>
        </form>
        <div style={{ color: T.muted, fontSize: 13, marginTop: 16, textAlign: "center" }}>
          Déjà un compte ? <Link href="/sign-in" style={{ color: T.goal }}>Se connecter</Link>
        </div>
      </Card>
    </div>
  );
}
