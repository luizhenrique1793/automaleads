import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/app/primitives";
import { ActionCard } from "@/components/app/ActionCard";
import { TaskRow } from "@/components/app/TaskList";
import { FilterBar, emptyFilters, matchFilters } from "@/components/app/Filters";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import {
  addDays,
  addMonths,
  formatDayLabel,
  monthLabel,
  startOfMonth,
  startOfWeek,
  todayISO,
  toDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário · Automa Gestão" },
      {
        name: "description",
        content: "Calendário semanal e mensal com ações agendadas e prazos de tarefas.",
      },
      { property: "og:title", content: "Calendário · Automa Gestão" },
      {
        property: "og:description",
        content: "Calendário semanal e mensal com ações agendadas e prazos de tarefas.",
      },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function CalendarPage() {
  const today = todayISO();
  const [view, setView] = useState<"semana" | "mes">("mes");
  const [anchor, setAnchor] = useState(today);
  const [filters, setFilters] = useState(emptyFilters);
  const { data } = useWorkspace();
  const { openTask, openAction } = useForms();

  const actionsOn = (day: string) =>
    data.actions.filter((a) => a.action_date === day && matchFilters(a, filters, false));
  const tasksOn = (day: string) =>
    data.tasks.filter((t) => t.due_date === day && matchFilters(t, filters));

  const monthStart = startOfMonth(anchor);
  const gridStart = startOfWeek(monthStart);
  const monthDays = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i));

  function move(dir: number) {
    setAnchor(view === "mes" ? addMonths(anchor, dir) : addDays(anchor, dir * 7));
  }

  return (
    <>
      <PageHeader
        title="Calendário"
        subtitle={view === "mes" ? monthLabel(anchor) : `Semana de ${formatDayLabel(weekDays[0]!)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as "semana" | "mes")}>
              <TabsList>
                <TabsTrigger value="semana">Semana</TabsTrigger>
                <TabsTrigger value="mes">Mês</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => move(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAnchor(today)}>
                Hoje
              </Button>
              <Button variant="outline" size="icon" onClick={() => move(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        }
      />

      <FilterBar value={filters} onChange={setFilters} />

      {view === "semana" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {weekDays.map((day) => (
            <section
              key={day}
              className={cn("card-surface p-3", day === today && "ring-2 ring-primary/25")}
            >
              <p
                className={cn(
                  "mb-2 text-[11px] font-bold",
                  day === today ? "text-primary" : "text-muted-foreground",
                )}
              >
                {formatDayLabel(day)}
              </p>
              <div className="space-y-2">
                {actionsOn(day).map((a) => (
                  <ActionCard key={a.id} action={a} />
                ))}
              </div>
              <div className="-mx-3 mt-2">
                {tasksOn(day).map((t) => (
                  <TaskRow key={t.id} task={t} />
                ))}
              </div>
              {actionsOn(day).length === 0 && tasksOn(day).length === 0 ? (
                <p className="text-xs text-muted-foreground">Nada agendado</p>
              ) : null}
            </section>
          ))}
        </div>
      ) : (
        <div className="card-surface overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-[11px] font-bold text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const inMonth = toDate(day).getMonth() === toDate(monthStart).getMonth();
              const dayActions = actionsOn(day);
              const dayTasks = tasksOn(day);
              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-[7.5rem] space-y-1 border-r border-b border-border p-1.5 last:border-r-0",
                    !inMonth && "bg-muted/25",
                  )}
                  onDoubleClick={() => openAction(null, { date: day })}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                        day === today
                          ? "bg-primary text-primary-foreground"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted-foreground",
                      )}
                    >
                      {Number(day.slice(-2))}
                    </span>
                  </div>
                  {dayActions.slice(0, 3).map((a) => (
                    <ActionChip key={a.id} id={a.id} />
                  ))}
                  {dayTasks.slice(0, 2).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openTask(t)}
                      className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] text-muted-foreground hover:bg-accent"
                    >
                      <CheckSquare className="size-3 shrink-0" />
                      <span className="truncate">{t.title}</span>
                    </button>
                  ))}
                  {dayActions.length + dayTasks.length > 5 ? (
                    <p className="px-1 text-[10px] text-muted-foreground">
                      +{dayActions.length + dayTasks.length - 5} itens
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function ActionChip({ id }: { id: string }) {
  const { actionById, companyById } = useWorkspace();
  const action = actionById.get(id);
  if (!action) return null;
  const company = companyById.get(action.company_id);
  return (
    <a
      href={`/acoes/${action.id}`}
      className="block truncate rounded px-1 py-0.5 text-[11px] font-medium text-foreground hover:opacity-80"
      style={{ backgroundColor: `${company?.color ?? "#4f46e5"}1f` }}
    >
      {action.all_day ? "• " : `${action.start_time ?? ""} `}
      {action.title}
    </a>
  );
}
