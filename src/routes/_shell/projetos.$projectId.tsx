import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CompanyDot,
  EmptyState,
  ProjectStatusPill,
  StatCard,
} from "@/components/app/primitives";
import { TaskList } from "@/components/app/TaskList";
import { ActionList } from "@/components/app/ActionCard";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import { formatDate, todayISO } from "@/lib/format";
import { isTaskLate } from "@/lib/types";

export const Route = createFileRoute("/_shell/projetos/$projectId")({
  head: () => ({
    meta: [
      { title: "Projeto · Automa Gestão" },
      { name: "description", content: "Tarefas, ações, prazo e progresso do projeto." },
      { property: "og:title", content: "Projeto · Automa Gestão" },
      { property: "og:description", content: "Tarefas, ações, prazo e progresso do projeto." },
    ],
  }),
  component: ProjectPage,
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const { data, projectById, companyById, userById } = useWorkspace();
  const { openProject, openTask, openAction } = useForms();
  const today = todayISO();
  const project = projectById.get(projectId);

  if (!project) {
    return <EmptyState title="Projeto não encontrado" description="Ele pode ter sido excluído." />;
  }

  const company = companyById.get(project.company_id);
  const owner = project.responsible_user_id ? userById.get(project.responsible_user_id) : null;
  const tasks = data.tasks.filter((t) => t.project_id === projectId);
  const actions = data.actions.filter((a) => a.project_id === projectId);
  const openTasks = tasks.filter((t) => t.status !== "concluida" && t.status !== "cancelada");
  const late = tasks.filter((t) => isTaskLate(t, today));

  return (
    <>
      <Link
        to="/projetos"
        className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Projetos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <ProjectStatusPill status={project.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {company ? (
              <Link
                to="/empresas/$companyId"
                params={{ companyId: company.id }}
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                <CompanyDot color={company.color} />
                {company.name}
              </Link>
            ) : null}
            <span>· {owner?.name ?? "Sem responsável"}</span>
            <span>
              · {formatDate(project.start_date)} até {formatDate(project.deadline)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openProject(project)}>
            <Pencil className="size-3.5" /> Editar
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              openTask(null, { companyId: project.company_id, projectId: project.id })
            }
          >
            <Plus className="size-4" /> Nova tarefa
          </Button>
        </div>
      </div>

      {project.description ? (
        <p className="card-surface mb-6 p-4 text-sm text-muted-foreground">{project.description}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Progresso" value={`${project.progress}%`} />
        <StatCard label="Tarefas abertas" value={openTasks.length} tone="info" />
        <StatCard label="Atrasadas" value={late.length} tone="danger" />
        <StatCard label="Ações" value={actions.length} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <h2 className="mb-2 text-sm font-bold">Tarefas do projeto</h2>
          <TaskList tasks={tasks} showCompany={false} emptyTitle="Nenhuma tarefa neste projeto" />
        </section>
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold">Ações do projeto</h2>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() =>
                openAction(null, { companyId: project.company_id, projectId: project.id })
              }
            >
              <Plus className="size-3.5" /> Nova
            </Button>
          </div>
          <ActionList actions={actions} empty="Nenhuma ação neste projeto" />
        </section>
      </div>
    </>
  );
}
