import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/app/primitives";
import { TaskList } from "@/components/app/TaskList";
import { FilterBar, ALL, emptyFilters, matchFilters } from "@/components/app/Filters";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import { addDays, startOfWeek, todayISO } from "@/lib/format";
import { isTaskLate } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/tarefas")({
  head: () => ({
    meta: [
      { title: "Tarefas · Automa Gestão" },
      {
        name: "description",
        content: "Todas as tarefas com filtros por prazo, empresa, projeto, responsável e status.",
      },
      { property: "og:title", content: "Tarefas · Automa Gestão" },
      {
        property: "og:description",
        content: "Todas as tarefas com filtros por prazo, empresa, projeto, responsável e status.",
      },
    ],
  }),
  component: TasksPage,
});

const QUICK = [
  "todas",
  "minhas",
  "hoje",
  "semana",
  "atrasadas",
  "aguardando",
  "concluidas",
] as const;
const QUICK_LABEL: Record<(typeof QUICK)[number], string> = {
  todas: "Todas",
  minhas: "Minhas tarefas",
  hoje: "Hoje",
  semana: "Esta semana",
  atrasadas: "Atrasadas",
  aguardando: "Aguardando cliente",
  concluidas: "Concluídas",
};

function TasksPage() {
  const { user } = Route.useRouteContext();
  const { data } = useWorkspace();
  const { openTask } = useForms();
  const today = todayISO();
  const [quick, setQuick] = useState<(typeof QUICK)[number]>("minhas");
  const [filters, setFilters] = useState(emptyFilters);
  const [search, setSearch] = useState("");

  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);

  const tasks = data.tasks.filter((t) => {
    if (!matchFilters(t, filters)) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    const open = t.status !== "concluida" && t.status !== "cancelada";
    switch (quick) {
      case "minhas":
        return t.responsible_user_id === user.id && open;
      case "hoje":
        return t.due_date === today && open;
      case "semana":
        return !!t.due_date && t.due_date >= weekStart && t.due_date <= weekEnd && open;
      case "atrasadas":
        return isTaskLate(t, today);
      case "aguardando":
        return t.status === "aguardando_cliente";
      case "concluidas":
        return t.status === "concluida";
      default:
        return filters.status !== ALL ? true : open;
    }
  });

  const unassignedCount = data.tasks.filter(
    (t) => !t.responsible_user_id && t.status !== "concluida" && t.status !== "cancelada",
  ).length;

  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle={`${tasks.length} tarefa(s) nesta visão`}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => openTask()}>
            <Plus className="size-4" /> Nova tarefa
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setQuick(q)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              quick === q
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:bg-accent",
            )}
          >
            {QUICK_LABEL[q]}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por título..."
          className="h-9 max-w-xs bg-surface"
        />
      </div>

      <FilterBar value={filters} onChange={setFilters} />

      {quick === "minhas" && tasks.length === 0 && unassignedCount > 0 ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5">
          <p className="text-sm text-muted-foreground">
            {unassignedCount} tarefa(s) em aberto estão sem responsável, por isso não aparecem aqui.
          </p>
          <button
            type="button"
            onClick={() => setQuick("todas")}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver em Todas
          </button>
        </div>
      ) : null}

      <TaskList tasks={tasks} emptyTitle="Nenhuma tarefa nesta visão" />
    </>
  );
}
