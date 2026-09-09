import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckSquare, Clock, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getClientPortal, getMe, logout } from "@/lib/api.functions";
import { addDays, formatDate, formatShortDay, timeRange, todayISO, toDate } from "@/lib/format";
import {
  ACTION_STATUS_LABEL,
  ACTION_TYPE_LABEL,
  OPEN_TASK_STATUSES,
  TASK_STATUS_LABEL,
  isTaskLate,
  type Action,
  type ActionStatus,
  type ActionType,
  type ClientPortal,
  type Company,
  type Project,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "painel" | "tarefas" | "acoes";

export const Route = createFileRoute("/portal")({
  validateSearch: (search: Record<string, unknown>): { aba: Tab; dia: string | undefined } => {
    const raw = search["aba"];
    const aba: Tab = raw === "tarefas" || raw === "acoes" ? raw : "painel";
    const rawDia = search["dia"];
    const dia =
      typeof rawDia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDia) ? rawDia : undefined;
    return { aba, dia };
  },
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

interface Ctx {
  data: ClientPortal;
  companyById: Map<string, Company>;
  projectById: Map<string, Project>;
  today: string;
  go: (tab: Tab, dia?: string) => void;
}

function PortalPage() {
  const { user } = Route.useRouteContext();
  const { aba, dia } = Route.useSearch();
  const router = useRouter();
  const doLogout = useServerFn(logout);
  const fetchPortal = useServerFn(getClientPortal);
  const today = todayISO();

  const { data, isLoading } = useQuery({
    queryKey: ["client-portal"],
    queryFn: () => fetchPortal(),
    staleTime: 10_000,
  });

  function go(tab: Tab, day?: string) {
    void router.navigate({
      to: "/portal",
      search: { aba: tab, dia: day },
      replace: false,
    });
  }

  const companyById = new Map((data?.companies ?? []).map((c) => [c.id, c]));
  const projectById = new Map((data?.projects ?? []).map((p) => [p.id, p]));

  async function signOut() {
    await doLogout();
    await router.invalidate();
    await router.navigate({ to: "/login", replace: true });
  }

  const noCompanies = data && data.companies.length === 0;
  const ctx: Ctx | null =
    data && !noCompanies ? { data, companyById, projectById, today, go } : null;

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
              ["painel", "Painel", LayoutDashboard],
              ["tarefas", "Tarefas", CheckSquare],
              ["acoes", "Ações", CalendarClock],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => go(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                aba === key ? "bg-primary text-primary-foreground" : "hover:bg-accent",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
        ) : noCompanies ? (
          <div className="card-surface mt-6 p-6 text-center">
            <p className="text-sm font-semibold">Nenhuma empresa vinculada ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Peça ao responsável da equipe para vincular sua empresa ao seu acesso.
            </p>
          </div>
        ) : ctx ? (
          aba === "painel" ? (
            <Dashboard ctx={ctx} />
          ) : aba === "tarefas" ? (
            <TasksView ctx={ctx} />
          ) : (
            <ActionsView ctx={ctx} dia={dia} />
          )
        ) : null}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Painel                                                              */
/* ------------------------------------------------------------------ */

function Dashboard({ ctx }: { ctx: Ctx }) {
  const { data, today, go } = ctx;
  const tasks = data.tasks;
  const openTasks = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status as TaskStatus));
  const late = openTasks.filter((t) => isTaskLate(t, today));
  const dueToday = openTasks.filter((t) => t.due_date === today);
  const inProgress = openTasks.filter(
    (t) => t.status === "em_andamento" || t.status === "aguardando_cliente",
  );
  const todayActions = data.actions.filter(
    (a) => a.action_date === today && a.status !== "cancelada",
  );
  const upcoming = openTasks
    .filter((t) => t.due_date && t.due_date > today && t.due_date <= addDays(today, 14))
    .slice(0, 8);

  const days = Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(today, i);
    return {
      iso,
      actions: data.actions.filter((a) => a.action_date === iso && a.status !== "cancelada")
        .length,
      tasks: openTasks.filter((t) => t.due_date === iso).length,
    };
  });

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Atrasadas"
          value={late.length}
          danger={late.length > 0}
          onClick={() => go("tarefas")}
        />
        <StatCard label="Vencem hoje" value={dueToday.length} onClick={() => go("tarefas")} />
        <StatCard
          label="Ações de hoje"
          value={todayActions.length}
          onClick={() => go("acoes", today)}
        />
        <StatCard label="Em andamento" value={inProgress.length} onClick={() => go("tarefas")} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold">Próximos 7 dias</h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => go("acoes", d.iso)}
              className={cn(
                "min-w-24 shrink-0 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent",
                d.iso === today && "border-primary",
              )}
            >
              <p className="text-[11px] font-semibold text-muted-foreground">
                {d.iso === today ? "Hoje" : formatShortDay(d.iso)}
              </p>
              <p className="mt-1 text-xs">{d.actions} ações</p>
              <p className="text-xs text-muted-foreground">{d.tasks} tarefas</p>
            </button>
          ))}
        </div>
      </section>

      {late.length > 0 ? (
        <Section title="Atrasadas" count={late.length}>
          {late.map((t) => (
            <TaskRow key={t.id} task={t} ctx={ctx} />
          ))}
        </Section>
      ) : null}

      <Section title="Ações de hoje" count={todayActions.length}>
        {todayActions.map((a) => (
          <ActionRow key={a.id} action={a} ctx={ctx} />
        ))}
      </Section>

      <Section title="Próximos prazos (14 dias)" count={upcoming.length}>
        {upcoming.map((t) => (
          <TaskRow key={t.id} task={t} ctx={ctx} />
        ))}
        {upcoming.length > 0 ? (
          <li className="px-4 py-2.5">
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline"
              onClick={() => go("tarefas")}
            >
              Ver todas as tarefas
            </button>
          </li>
        ) : null}
      </Section>

      <Section title="Em andamento" count={inProgress.length}>
        {inProgress.slice(0, 6).map((t) => (
          <TaskRow key={t.id} task={t} ctx={ctx} />
        ))}
      </Section>
    </div>
  );
}

function StatCard({
  label,
  value,
  danger,
  onClick,
}: {
  label: string;
  value: number;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent",
        danger && "border-destructive/40",
      )}
    >
      <p className={cn("text-2xl font-bold", danger ? "text-destructive" : "")}>{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Tarefas e Ações                                                     */
/* ------------------------------------------------------------------ */

function TaskRow({ task, ctx }: { task: Task; ctx: Ctx }) {
  const { companyById, projectById, today } = ctx;
  return (
    <li className="px-4 py-3">
      <p
        className={cn(
          "text-sm font-semibold",
          task.status === "concluida" && "font-medium text-muted-foreground line-through",
        )}
      >
        {task.title}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {companyById.get(task.company_id)?.name}
        {task.project_id ? ` · ${projectById.get(task.project_id)?.name ?? ""}` : ""}
        {task.due_date ? ` · prazo ${formatDate(task.due_date)}` : " · sem prazo"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Tag>{TASK_STATUS_LABEL[task.status as TaskStatus] ?? task.status}</Tag>
        {isTaskLate(task, today) ? <Tag tone="danger">Atrasada</Tag> : null}
      </div>
    </li>
  );
}

function ActionRow({ action, ctx }: { action: Action; ctx: Ctx }) {
  const { companyById } = ctx;
  return (
    <li className="px-4 py-3">
      <p className="text-sm font-semibold">{action.title}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Clock className="size-3" />
        {formatDate(action.action_date)} ·{" "}
        {timeRange(action.start_time, action.end_time, action.all_day)}
        {" · "}
        {companyById.get(action.company_id)?.name}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Tag>{ACTION_TYPE_LABEL[action.action_type as ActionType] ?? action.action_type}</Tag>
        <Tag tone={action.status === "realizada" ? "success" : "neutral"}>
          {ACTION_STATUS_LABEL[action.status as ActionStatus] ?? action.status}
        </Tag>
      </div>
    </li>
  );
}

function TasksView({ ctx }: { ctx: Ctx }) {
  const tasks = ctx.data.tasks;
  const openTasks = tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status as TaskStatus));
  const doneTasks = tasks.filter((t) => t.status === "concluida");
  return (
    <div className="mt-6 space-y-6">
      <Section title="Em aberto" count={openTasks.length}>
        {openTasks.map((t) => (
          <TaskRow key={t.id} task={t} ctx={ctx} />
        ))}
      </Section>
      <Section title="Concluídas" count={doneTasks.length}>
        {doneTasks.slice(0, 30).map((t) => (
          <TaskRow key={t.id} task={t} ctx={ctx} />
        ))}
      </Section>
    </div>
  );
}

function ActionsView({ ctx, dia }: { ctx: Ctx; dia: string | undefined }) {
  const { today, go } = ctx;
  const all = ctx.data.actions;
  const filtered = dia ? all.filter((a) => a.action_date === dia) : all;
  const nextActions = filtered.filter((a) => a.action_date >= today).reverse();
  const pastActions = filtered.filter((a) => a.action_date < today);
  return (
    <div className="mt-6 space-y-6">
      {dia ? (
        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <p className="text-sm">
            Mostrando o dia <strong>{formatDate(dia)}</strong>
          </p>
          <button
            type="button"
            className="text-xs font-semibold text-primary hover:underline"
            onClick={() => go("acoes")}
          >
            Limpar filtro
          </button>
        </div>
      ) : null}
      <Section title={dia ? "Ações do dia" : "Próximas"} count={dia ? filtered.length : nextActions.length}>
        {(dia ? filtered.sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? "")) : nextActions).map(
          (a) => (
            <ActionRow key={a.id} action={a} ctx={ctx} />
          ),
        )}
      </Section>
      {!dia ? (
        <Section title="Anteriores" count={pastActions.length}>
          {pastActions.slice(0, 30).map((a) => (
            <li key={a.id} className="px-4 py-3">
              <p className="text-sm font-medium">{a.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDate(a.action_date)} · {ctx.companyById.get(a.company_id)?.name}
              </p>
            </li>
          ))}
        </Section>
      ) : null}
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
