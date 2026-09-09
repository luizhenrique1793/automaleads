import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader, StatCard } from "@/components/app/primitives";
import { TaskList } from "@/components/app/TaskList";
import { ActionList } from "@/components/app/ActionCard";
import { useWorkspace } from "@/lib/workspace";
import { addDays, formatDate, todayISO } from "@/lib/format";
import { isTaskLate } from "@/lib/types";

export const Route = createFileRoute("/_shell/")({
  head: () => ({
    meta: [
      { title: "Início · Automa Gestão" },
      {
        name: "description",
        content: "Painel com tarefas de hoje, atrasadas, próximos prazos e ações da semana.",
      },
      { property: "og:title", content: "Início · Automa Gestão" },
      {
        property: "og:description",
        content: "Painel com tarefas de hoje, atrasadas, próximos prazos e ações da semana.",
      },
    ],
  }),
  component: DashboardPage,
});

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
  const todayActions = data.actions.filter(
    (a) => a.action_date === today && a.status !== "cancelada",
  );
  const weekActions = data.actions.filter(
    (a) => a.action_date >= today && a.action_date <= weekEnd && a.status !== "cancelada",
  );

  const priority = [...lateTasks, ...todayTasks, ...upcoming].slice(0, 12);

  return (
    <>
      <PageHeader
        title="O que preciso resolver agora"
        subtitle={formatDate(today, { weekday: "long", day: "2-digit", month: "long" })}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Tarefas de hoje" value={todayTasks.length} tone="info" />
        <StatCard label="Atrasadas" value={lateTasks.length} tone="danger" />
        <StatCard label="Ações esta semana" value={weekActions.length} />
        <StatCard label="Aguardando cliente" value={waiting.length} tone="warning" />
        <StatCard label="Próximos 7 dias" value={upcoming.length} />
      </div>

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
            <h2 className="mb-2 text-sm font-bold">Ações de hoje</h2>
            <ActionList actions={todayActions} empty="Nenhuma ação hoje" />
          </section>
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
