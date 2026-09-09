import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/primitives";
import { changeOwnPassword, updateOwnProfile } from "@/lib/api.functions";

export const Route = createFileRoute("/_shell/conta")({
  head: () => ({
    meta: [
      { title: "Minha conta · Automa Gestão" },
      { name: "description", content: "Altere seu nome e sua senha de acesso ao sistema." },
      { property: "og:title", content: "Minha conta · Automa Gestão" },
      {
        property: "og:description",
        content: "Altere seu nome e sua senha de acesso ao sistema.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const saveProfile = useServerFn(updateOwnProfile);
  const savePassword = useServerFn(changeOwnPassword);

  const [name, setName] = useState(user.name);
  const [savingName, setSavingName] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  const mustChange = user.must_change_password === true;

  async function submitName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    try {
      const res = await saveProfile({ data: { name } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await router.invalidate();
      toast.success("Nome atualizado.");
    } finally {
      setSavingName(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }
    setSavingPass(true);
    try {
      const res = await savePassword({ data: { current, next } });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      await router.invalidate();
      toast.success("Senha alterada.");
    } finally {
      setSavingPass(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <PageHeader title="Minha conta" subtitle={user.email} />

      {mustChange ? (
        <div className="mb-5 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          <p className="font-semibold">Defina uma senha pessoal para continuar</p>
          <p className="mt-0.5 text-muted-foreground">
            Sua senha atual foi criada pelo administrador. Escolha uma nova senha para liberar o
            restante do sistema.
          </p>
        </div>
      ) : null}

      <form onSubmit={submitPassword} className="card-surface mb-5 space-y-4 p-5">
        <h2 className="text-sm font-bold">Alterar senha</h2>
        <div className="space-y-1.5">
          <Label htmlFor="cur">Senha atual</Label>
          <Input
            id="cur"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new">Nova senha</Label>
          <Input
            id="new"
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="conf">Repita a nova senha</Label>
          <Input
            id="conf"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={savingPass}>
          {savingPass ? "Salvando..." : "Salvar nova senha"}
        </Button>
      </form>

      <form onSubmit={submitName} className="card-surface space-y-4 p-5">
        <h2 className="text-sm font-bold">Meus dados</h2>
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome</Label>
          <Input id="nome" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={savingName}>
          {savingName ? "Salvando..." : "Salvar nome"}
        </Button>
      </form>
    </div>
  );
}
