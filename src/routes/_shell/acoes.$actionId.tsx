import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Clock, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActionStatusPill,
  ActionTypePill,
  CompanyDot,
  EmptyState,
} from "@/components/app/primitives";
import { TaskList } from "@/components/app/TaskList";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import { formatDate, timeRange } from "@/lib/format";

export const Route = createFileRoute("/_shell/acoes/$actionId")({
  head: () => ({
    meta: [
      { title: "Ação · Automa Gestão" },
      { name: "description", content: "Detalhes da ação e tarefas relacionadas." },
      { property: "og:title", content: "Ação · Automa Gestão" },
      { property: "og:description", content: "Detalhes da ação e tarefas relacionadas." },
    ],
  }),
  component: ActionPage,
});

function ActionPage() {
  const { actionId } = Route.useParams();
  const { data, actionById, companyById, projectById, userById } = useWorkspace();
  const { openAction, openTask } = useForms();
  const action = actionById.get(actionId);

  if (!action) {
    return <EmptyState title="Ação não encontrada" description="Ela pode ter sido excluída." />;
  }

  const company = companyById.get(action.company_id);
  const project = action.project_id ? projectById.get(action.project_id) : null;
  const owner = action.responsible_user_id ? userById.get(action.responsible_user_id) : null;
  const tasks = data.tasks.filter((t) => t.action_id === actionId);

  return (
    <>
      <Link
        to="/acoes"
        className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Ações
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{action.title}</h1>
            <ActionTypePill type={action.action_type} />
            <ActionStatusPill status={action.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {formatDate(action.action_date, {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {timeRange(action.start_time, action.end_time, action.all_day)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openAction(action)}>
            <Pencil className="size-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              openTask(null, {
                companyId: action.company_id,
                projectId: action.project_id,
                actionId: action.id,
              })
            }
          >
            <Plus className="size-4" /> Tarefa relacionada
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
        <section className="card-surface space-y-3 p-4 text-sm">
          <Info label="Empresa">
            {company ? (
              <Link
                to="/empresas/$companyId"
                params={{ companyId: company.id }}
                className="inline-flex items-center gap-1.5 font-medium hover:underline"
              >
                <CompanyDot color={company.color} />
                {company.name}
              </Link>
            ) : (
              "—"
            )}
          </Info>
          <Info label="Projeto">
            {project ? (
              <Link
                to="/projetos/$projectId"
                params={{ projectId: project.id }}
                className="font-medium hover:underline"
              >
                {project.name}
              </Link>
            ) : (
              "Sem projeto"
            )}
          </Info>
          <Info label="Responsável">{owner?.name ?? "Sem responsável"}</Info>
          {action.description ? (
            <Info label="Descrição">
              <span className="whitespace-pre-wrap text-muted-foreground">{action.description}</span>
            </Info>
          ) : null}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-bold">Tarefas relacionadas</h2>
          <TaskList
            tasks={tasks}
            showCompany={false}
            emptyTitle="Nenhuma tarefa vinculada"
            emptyDescription="Use o botão “Tarefa relacionada” para criar a primeira."
          />
        </section>
      </div>
    </>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">{label}</p>
      <div className="mt-0.5">{children}</div>
    </div>
  );
}
