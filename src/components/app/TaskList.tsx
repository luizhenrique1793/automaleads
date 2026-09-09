import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { setTaskStatus } from "@/lib/api.functions";
import { useInvalidateWorkspace, useWorkspace } from "@/lib/workspace";
import { isTaskLate, type Task } from "@/lib/types";
import { formatDate, todayISO } from "@/lib/format";
import { CompanyDot, EmptyState, PriorityPill, TaskStatusPill } from "./primitives";
import { useForms } from "./forms";

export function TaskRow({ task, showCompany = true }: { task: Task; showCompany?: boolean }) {
  const { companyById, projectById, userById } = useWorkspace();
  const invalidate = useInvalidateWorkspace();
  const toggle = useServerFn(setTaskStatus);
  const { openTask } = useForms();
  const today = todayISO();
  const late = isTaskLate(task, today);
  const done = task.status === "concluida";
  const company = companyById.get(task.company_id);
  const project = task.project_id ? projectById.get(task.project_id) : null;
  const owner = task.responsible_user_id ? userById.get(task.responsible_user_id) : null;

  async function onToggle(checked: boolean) {
    await toggle({ data: { id: task.id, status: checked ? "concluida" : "a_fazer" } });
    await invalidate();
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 border-b border-border px-3 py-3 last:border-0 hover:bg-accent/30",
        done && "opacity-60",
      )}
    >
      <Checkbox
        checked={done}
        onCheckedChange={(v) => onToggle(Boolean(v))}
        className="mt-0.5"
        aria-label="Concluir tarefa"
      />
      <button type="button" onClick={() => openTask(task)} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-sm font-semibold", done && "line-through")}>{task.title}</span>
          {late ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
              Atrasada
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {showCompany && company ? (
            <span className="inline-flex items-center gap-1.5">
              <CompanyDot color={company.color} />
              {company.name}
            </span>
          ) : null}
          {project ? <span>{project.name}</span> : null}
          {owner ? <span>{owner.name}</span> : null}
          <span className={cn(late && "font-semibold text-destructive")}>
            {task.due_date ? formatDate(task.due_date, { day: "2-digit", month: "short" }) : "Sem prazo"}
          </span>
        </div>
      </button>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <PriorityPill priority={task.priority} />
        <TaskStatusPill status={task.status} />
      </div>
    </div>
  );
}

export function TaskList({
  tasks,
  showCompany = true,
  emptyTitle = "Nenhuma tarefa por aqui",
  emptyDescription,
}: {
  tasks: Task[];
  showCompany?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (tasks.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <div className="card-surface overflow-hidden">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} showCompany={showCompany} />
      ))}
    </div>
  );
}

export function CompanyLink({ id, name, color }: { id: string; name: string; color: string }) {
  return (
    <Link
      to="/empresas/$companyId"
      params={{ companyId: id }}
      className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
    >
      <CompanyDot color={color} />
      {name}
    </Link>
  );
}
