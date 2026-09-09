import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/primitives";
import { ActionCard } from "@/components/app/ActionCard";
import { TaskRow } from "@/components/app/TaskList";
import { FilterBar, emptyFilters, matchFilters } from "@/components/app/Filters";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import { addDays, formatDayLabel, startOfWeek, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/semana")({
  head: () => ({
    meta: [
      { title: "Minha semana · Automa Gestão" },
      {
        name: "description",
        content: "Visão de segunda a domingo com ações agendadas e tarefas com prazo.",
      },
      { property: "og:title", content: "Minha semana · Automa Gestão" },
      {
        property: "og:description",
        content: "Visão de segunda a domingo com ações agendadas e tarefas com prazo.",
      },
    ],
  }),
  component: WeekPage,
});

function WeekPage() {
  const { data } = useWorkspace();
  const { openTask, openAction } = useForms();
  const today = todayISO();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today));
  const [filters, setFilters] = useState(emptyFilters);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <>
      <PageHeader
        title="Minha semana"
        subtitle="Compromissos e entregas de segunda a domingo."
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekStart(startOfWeek(today))}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />

      <FilterBar value={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => {
          const actions = data.actions.filter(
            (a) => a.action_date === day && matchFilters(a, filters, false),
          );
          const tasks = data.tasks.filter(
            (t) => t.due_date === day && matchFilters(t, filters),
          );
          const isToday = day === today;
          return (
            <section
              key={day}
              className={cn(
                "card-surface flex flex-col gap-3 p-3",
                isToday && "ring-2 ring-primary/25",
              )}
            >
              <header className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-[11px] font-bold tracking-wide",
                    isToday ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {formatDayLabel(day)}
                </span>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    aria-label="Nova ação"
                    onClick={() => openAction(null, { date: day })}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </header>

              <div className="space-y-2">
                {actions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem ações</p>
                ) : (
                  actions.map((a) => <ActionCard key={a.id} action={a} />)
                )}
              </div>

              <div className="border-t border-dashed border-border pt-2">
                <p className="mb-1 text-[11px] font-bold tracking-wide text-muted-foreground">
                  TAREFAS
                </p>
                {tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem tarefas</p>
                ) : (
                  <div className="-mx-3">
                    {tasks.map((t) => (
                      <TaskRow key={t.id} task={t} />
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => openTask(null, {})}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                  <Plus className="size-3" /> tarefa
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
