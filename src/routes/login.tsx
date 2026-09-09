import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMe, login } from "@/lib/api.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · Automa Gestão" },
      { name: "description", content: "Acesse o painel de gestão operacional da sua equipe." },
      { property: "og:title", content: "Entrar · Automa Gestão" },
      {
        property: "og:description",
        content: "Acesse o painel de gestão operacional da sua equipe.",
      },
    ],
  }),
  beforeLoad: async () => {
    const res = await getMe();
    if (res.user) throw redirect({ to: "/" });
    return { dbError: res.dbError };
  },
  component: LoginPage,
});

function LoginPage() {
  const { dbError } = Route.useRouteContext();
  const router = useRouter();
  const doLogin = useServerFn(login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await doLogin({ data: { email, password } });
      if (!res.ok) {
        setError(res.error ?? "Não foi possível entrar.");
        return;
      }
      await router.invalidate();
      await router.navigate({ to: "/" });
    } catch {
      setError("Falha ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            A
          </div>
          <h1 className="text-xl font-bold tracking-tight">Gestão operacional</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entre com seu e-mail e senha.</p>
        </div>

        {dbError ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {dbError}
          </div>
        ) : null}

        <form onSubmit={submit} className="card-surface space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-muted-foreground">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Seu acesso é criado pelo administrador da equipe.
        </p>
      </div>
    </main>
  );
}
