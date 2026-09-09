import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader, Pill } from "@/components/app/primitives";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { clearDemoData, saveUser } from "@/lib/api.functions";
import { useInvalidateWorkspace, useWorkspace } from "@/lib/workspace";
import { isAdmin, type User } from "@/lib/types";

export const Route = createFileRoute("/_shell/usuarios")({
  beforeLoad: ({ context }) => {
    if (!isAdmin(context.user)) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Usuários · Automa Gestão" },
      { name: "description", content: "Equipe com acesso ao sistema e responsáveis por tarefas." },
      { property: "og:title", content: "Usuários · Automa Gestão" },
      {
        property: "og:description",
        content: "Equipe com acesso ao sistema e responsáveis por tarefas.",
      },
    ],
  }),
  component: UsersPage,
});

const ROLES: Record<string, string> = {
  administrador: "Administrador",
  gestor: "Gestor",
  colaborador: "Colaborador",
  cliente: "Cliente",
};

function UsersPage() {
  const { data } = useWorkspace();
  const invalidate = useInvalidateWorkspace();
  const removeDemo = useServerFn(clearDemoData);
  const [editing, setEditing] = useState<{ value: User | null } | null>(null);
  const demoCount = data.companies.filter((c) => c.is_demo).length;

  async function handleClearDemo() {
    const res = await removeDemo();
    await invalidate();
    toast.success(
      res.removed > 0
        ? `${res.removed} empresa(s) de exemplo removida(s).`
        : "Nenhum dado de exemplo encontrado.",
    );
  }


  return (
    <>
      <PageHeader
        title="Usuários"
        subtitle="Pessoas com acesso ao sistema e responsáveis pelas entregas."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setEditing({ value: null })}>
            <Plus className="size-4" /> Novo usuário
          </Button>
        }
      />

      <div className="card-surface divide-y divide-border overflow-hidden">
        {data.users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => setEditing({ value: u })}
            className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-accent/30"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {u.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{u.name}</span>
              <span className="block text-xs text-muted-foreground">{u.email}</span>
            </span>
            <Pill tone="primary">{ROLES[u.global_role] ?? u.global_role}</Pill>
            <Pill tone={u.active ? "success" : "neutral"}>{u.active ? "Ativo" : "Inativo"}</Pill>
          </button>
        ))}
      </div>

      {demoCount > 0 ? (
        <div className="card-surface mt-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold">Dados de exemplo</p>
            <p className="text-sm text-muted-foreground">
              {demoCount} empresa(s) de demonstração, com seus projetos, ações e tarefas. Remova
              quando começar a usar de verdade.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                Limpar dados de exemplo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover os dados de exemplo?</AlertDialogTitle>
                <AlertDialogDescription>
                  As empresas de demonstração e tudo que pertence a elas serão apagados. Os usuários
                  e os dados que você criou permanecem.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => void handleClearDemo()}
                >
                  Remover
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : null}

      {editing ? (
        <UserSheet user={editing.value} onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}

function UserSheet({ user, onClose }: { user: User | null; onClose: () => void }) {
  const save = useServerFn(saveUser);
  const invalidate = useInvalidateWorkspace();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.global_role ?? "colaborador");
  const [active, setActive] = useState(user?.active ?? true);
  const [saving, setSaving] = useState(false);

  async function onSubmit() {
    if (!name.trim() || !email.trim()) {
      toast.error("Informe nome e e-mail.");
      return;
    }
    if (!user && password.trim().length < 6) {
      toast.error("Defina uma senha com pelo menos 6 caracteres.");
      return;
    }
    setSaving(true);
    try {
      await save({
        data: {
          id: user?.id ?? null,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim() ? password.trim() : null,
          global_role: role,
          active,
        },
      });
      await invalidate();
      toast.success(user ? "Usuário atualizado." : "Usuário criado.");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{user ? "Editar usuário" : "Novo usuário"}</SheetTitle>
          <SheetDescription>
            O acesso é criado pelo administrador; não há cadastro aberto.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Nome</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-email">E-mail</Label>
            <Input
              id="u-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-pass">{user ? "Nova senha (opcional)" : "Senha"}</Label>
            <Input
              id="u-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={user ? "Deixe em branco para manter" : "Mínimo de 6 caracteres"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Perfil</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLES).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="u-active">Usuário ativo</Label>
            <Switch id="u-active" checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
