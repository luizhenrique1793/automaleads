import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, CheckSquare, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientPortal, getMe, logout } from "@/lib/api.functions";
import { formatDate, timeRange, todayISO } from "@/lib/format";
import {
  ACTION_STATUS_LABEL,
  ACTION_TYPE_LABEL,
  OPEN_TASK_STATUSES,
  TASK_STATUS_LABEL,
  isTaskLate,
  type ActionStatus,
  type ActionType,
  type TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Portal do cliente · Automa Gestão" },
      {
        name: "description",
        content: "Acompanhe as tarefas e as ações da sua empresa em um só lugar.",
      },
      { property: "og:title", content: "Portal do cliente · Automa Gestão" },
      {
        property: "og:description",
        content: "Acompanhe as tarefas e as ações da sua empresa em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const res = await getMe();
    if (!res.user) throw redirect({ to: "/login" });
    if (res.user.must_change_password) throw redirect({ to: "/conta" });
    if (res.user.global_role !== "cliente") throw redirect({ to: "/" });
    return { user: res.user };
  },
  component: PortalPage,
});

function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        tone === "danger"
          ? "bg-destructive/10 text-destructive"
          : tone === "success"
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-accent text-accent-foreground",
      )}
    >
      {children}
    </span>
  );
}

function PortalPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();
  const doLogout = useServerFn(logout);
  const fetchPortal = useServerFn(getClientPortal);
  const [tab, setTab] = useState<"tarefas" | "acoes">("tarefas");
  const today = todayISO();

  const { data, isLoading } = useQuery({
    queryKey: ["client-portal"],
    queryFn: () => fetchPortal(),
    staleTime: 10_000,
  });

  const companyById = new Map((data?.companies ?? []).map((c) => [c.id, c]));
  const projectById = new Map((data?.projects ?? []).map((p) => [p.id, p]));
  const tasks = data?.tasks ?? [];
  const openTasks = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status as TaskStatus));
  const doneTasks = tasks.filter((t) => t.status === "concluida");
  const actions = data?.actions ?? [];
  const nextActions = actions.filter((a) => a.action_date >= today).reverse();
  const pastActions = actions.filter((a) => a.action_date < today);

  async function signOut() {
    await doLogout();
    await router.invalidate();
    await router.navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">Portal do cliente</p>
            <p className="truncate text-[11px] text-muted-foreground">{user.name}</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6">
        <h1 className="text-xl font-bold tracking-tight">Acompanhe seu trabalho</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui você vê apenas as tarefas e as ações da sua empresa.
        </p>

        {data && data.companies.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.companies.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold"
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-6 inline-flex rounded-lg border border-border p-1">
          {(
            [
              ["tarefas", "Tarefas", CheckSquare],
              ["acoes", "Ações", CalendarClock],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                tab === key ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
        ) : data && data.companies.length === 0 ? (
          <div className="card-surface mt-6 p-6 text-center">
            <p className="text-sm font-semibold">Nenhuma empresa vinculada ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Peça ao responsável da equipe para vincular sua empresa ao seu acesso.
            </p>
          </div>
        ) : tab === "tarefas" ? (
          <div className="mt-6 space-y-6">
            <Section title="Em aberto" count={openTasks.length}>
              {openTasks.map((t) => (
                <li key={t.id} className="px-4 py-3">
                  <p className="text-sm font-semibold">{t.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {companyById.get(t.company_id)?.name}
                    {t.project_id ? ` · ${projectById.get(t.project_id)?.name ?? ""}` : ""}
                    {t.due_date ? ` · prazo ${formatDate(t.due_date)}` : " · sem prazo"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Tag>{TASK_STATUS_LABEL[t.status as TaskStatus] ?? t.status}</Tag>
                    {isTaskLate(t, today) ? <Tag tone="danger">Atrasada</Tag> : null}
                  </div>
                </li>
              ))}
            </Section>
            <Section title="Concluídas" count={doneTasks.length}>
              {doneTasks.slice(0, 30).map((t) => (
                <li key={t.id} className="px-4 py-3">
                  <p className="text-sm font-medium text-muted-foreground line-through">{t.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {companyById.get(t.company_id)?.name}
                  </p>
                </li>
              ))}
            </Section>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <Section title="Próximas" count={nextActions.length}>
              {nextActions.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDate(a.action_date)} · {timeRange(a.start_time, a.end_time, a.all_day)}
                    {" · "}
                    {companyById.get(a.company_id)?.name}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Tag>{ACTION_TYPE_LABEL[a.action_type as ActionType] ?? a.action_type}</Tag>
                    <Tag tone={a.status === "realizada" ? "success" : "neutral"}>
                      {ACTION_STATUS_LABEL[a.status as ActionStatus] ?? a.status}
                    </Tag>
                  </div>
                </li>
              ))}
            </Section>
            <Section title="Anteriores" count={pastActions.length}>
              {pastActions.slice(0, 30).map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(a.action_date)} · {companyById.get(a.company_id)?.name}
                  </p>
                </li>
              ))}
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold">
        {title} <span className="text-muted-foreground">({count})</span>
      </h2>
      {count === 0 ? (
        <div className="card-surface p-4 text-sm text-muted-foreground">Nada por aqui.</div>
      ) : (
        <ul className="card-surface divide-y divide-border overflow-hidden">{children}</ul>
      )}
    </section>
  );
}
