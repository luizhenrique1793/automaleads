import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock } from "lucide-react";
import { CompanyDot, EmptyState, PageHeader, StatCard } from "@/components/app/primitives";
import { TaskList } from "@/components/app/TaskList";
import { ActionList } from "@/components/app/ActionCard";
import { useWorkspace } from "@/lib/workspace";
import { addDays, formatDate, formatShortDay, relativeDeadline, timeRange, todayISO } from "@/lib/format";
import { isTaskLate, type Action, type Task } from "@/lib/types";

export const Route = createFileRoute("/_shell/")({
  head: () => ({
    meta: [
      { title: "Início · Automa Gestão" },
      {
        name: "description",
        content:
          "Painel com a agenda do dia, tarefas e ações separadas por empresa atendida.",
      },
      { property: "og:title", content: "Início · Automa Gestão" },
      {
        property: "og:description",
        content:
          "Painel com a agenda do dia, tarefas e ações separadas por empresa atendida.",
      },
    ],
  }),
  component: DashboardPage,
});

function byTime(a: Action, b: Action) {
  return (a.start_time ?? "").localeCompare(b.start_time ?? "");
}

function TodayAgenda({ actions }: { actions: Action[] }) {
  if (actions.length === 0) {
    return <EmptyState title="Nenhum compromisso hoje" description="Sua agenda do dia está livre." />;
  }
  return (
    <div className="card-surface divide-y divide-border">
      {actions.map((a) => (
        <AgendaRow key={a.id} action={a} />
      ))}
    </div>
  );
}

function AgendaRow({ action }: { action: Action }) {
  const { companyById } = useWorkspace();
  const company = companyById.get(action.company_id);
  return (
    <Link
      to="/acoes/$actionId"
      params={{ actionId: action.id }}
      className="flex items-start gap-3 px-3 py-3 transition-colors hover:bg-accent/40"
    >
      <span className="inline-flex min-w-[92px] items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <Clock className="size-3.5 shrink-0" />
        {timeRange(action.start_time, action.end_time, action.all_day)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{action.title}</span>
        {company ? (
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CompanyDot color={company.color} />
            {company.name}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function CompanyPanel({
  id,
  name,
  color,
  nextAction,
  openTasks,
  lateCount,
  today,
}: {
  id: string;
  name: string;
  color: string;
  nextAction: Action | null;
  openTasks: Task[];
  lateCount: number;
  today: string;
}) {
  const top = openTasks.slice(0, 3);
  return (
    <section className="card-surface flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/empresas/$companyId"
          params={{ companyId: id }}
          className="inline-flex items-center gap-2 text-sm font-bold hover:underline"
        >
          <CompanyDot color={color} />
          {name}
        </Link>
        <div className="flex shrink-0 gap-1.5">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {openTasks.length} em aberto
          </span>
          {lateCount > 0 ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
              {lateCount} atrasada{lateCount > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {nextAction ? (
          <>
            <span className="font-semibold text-foreground">Próximo: </span>
            {nextAction.title} · {formatShortDay(nextAction.action_date)}{" "}
            {timeRange(nextAction.start_time, nextAction.end_time, nextAction.all_day)}
          </>
        ) : (
          "Nenhum compromisso agendado"
        )}
      </p>

      {top.length > 0 ? (
        <ul className="space-y-1.5">
          {top.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">{t.title}</span>
              <span
                className={
                  isTaskLate(t, today)
                    ? "shrink-0 font-semibold text-destructive"
                    : "shrink-0 text-muted-foreground"
                }
              >
                {relativeDeadline(t.due_date, today)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhuma tarefa em aberto.</p>
      )}

      <Link
        to="/empresas/$companyId"
        params={{ companyId: id }}
        className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
      >
        Abrir empresa <ArrowRight className="size-3" />
      </Link>
    </section>
  );
}

function DashboardPage() {
  const { data, isLoading } = useWorkspace();
  const today = todayISO();
  const weekEnd = addDays(today, 7);

  const openTasks = data.tasks.filter(
    (t) => t.status !== "concluida" && t.status !== "cancelada",
  );
  const todayTasks = openTasks.filter((t) => t.due_date === today);
  const lateTasks = openTasks.filter((t) => isTaskLate(t, today));
  const waiting = openTasks.filter((t) => t.status === "aguardando_cliente");
  const upcoming = openTasks.filter(
    (t) => t.due_date && t.due_date > today && t.due_date <= weekEnd,
  );
  const activeActions = data.actions.filter((a) => a.status !== "cancelada");
  const todayActions = [...activeActions.filter((a) => a.action_date === today)].sort(byTime);
  const weekActions = activeActions.filter(
    (a) => a.action_date >= today && a.action_date <= weekEnd,
  );

  const priority = [...lateTasks, ...todayTasks, ...upcoming].slice(0, 12);

  const panels = data.companies
    .map((c) => {
      const tasks = openTasks
        .filter((t) => t.company_id === c.id)
        .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
      const next =
        [...activeActions.filter((a) => a.company_id === c.id && a.action_date >= today)].sort(
          (a, b) => a.action_date.localeCompare(b.action_date) || byTime(a, b),
        )[0] ?? null;
      return {
        company: c,
        tasks,
        next,
        lateCount: tasks.filter((t) => isTaskLate(t, today)).length,
      };
    })
    .sort((a, b) => {
      if (b.lateCount !== a.lateCount) return b.lateCount - a.lateCount;
      if (b.tasks.length !== a.tasks.length) return b.tasks.length - a.tasks.length;
      return a.company.name.localeCompare(b.company.name);
    });

  const busy = panels.filter((p) => p.tasks.length > 0 || p.next);
  const quiet = panels.filter((p) => p.tasks.length === 0 && !p.next);

  return (
    <>
      <PageHeader
        title="O que preciso resolver agora"
        subtitle={formatDate(today, { weekday: "long", day: "2-digit", month: "long" })}
      />

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-bold">Agenda de hoje</h2>
        <TodayAgenda actions={todayActions} />
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Tarefas de hoje" value={todayTasks.length} tone="info" />
        <StatCard label="Atrasadas" value={lateTasks.length} tone="danger" />
        <StatCard label="Ações esta semana" value={weekActions.length} />
        <StatCard label="Aguardando cliente" value={waiting.length} tone="warning" />
        <StatCard label="Próximos 7 dias" value={upcoming.length} />
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold">Por empresa</h2>
          <Link
            to="/empresas"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Ver empresas <ArrowRight className="size-3" />
          </Link>
        </div>
        {panels.length === 0 ? (
          <EmptyState
            title={isLoading ? "Carregando..." : "Nenhuma empresa ainda"}
            description="Cadastre as empresas que você atende para ver o resumo de cada uma aqui."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {busy.map((p) => (
                <CompanyPanel
                  key={p.company.id}
                  id={p.company.id}
                  name={p.company.name}
                  color={p.company.color}
                  nextAction={p.next}
                  openTasks={p.tasks}
                  lateCount={p.lateCount}
                  today={today}
                />
              ))}
            </div>
            {quiet.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {quiet.map((p) => (
                  <Link
                    key={p.company.id}
                    to="/empresas/$companyId"
                    params={{ companyId: p.company.id }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent"
                  >
                    <CompanyDot color={p.company.color} />
                    {p.company.name} · tudo em dia
                  </Link>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Prioridades</h2>
            <Link
              to="/tarefas"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Ver todas <ArrowRight className="size-3" />
            </Link>
          </div>
          <TaskList
            tasks={priority}
            emptyTitle={isLoading ? "Carregando..." : "Tudo em dia por aqui"}
            emptyDescription="Nenhuma tarefa atrasada ou com prazo próximo."
          />
        </section>

        <div className="space-y-6">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">Próximas ações</h2>
              <Link
                to="/semana"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Minha semana <ArrowRight className="size-3" />
              </Link>
            </div>
            <ActionList
              actions={weekActions.filter((a) => a.action_date > today).slice(0, 5)}
              empty="Nada agendado nos próximos dias"
            />
          </section>
          <section>
            <h2 className="mb-2 text-sm font-bold">Aguardando cliente</h2>
            <TaskList tasks={waiting.slice(0, 5)} emptyTitle="Nada aguardando cliente" />
          </section>
        </div>
      </div>
    </>
  );
}
