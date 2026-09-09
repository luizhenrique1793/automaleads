import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CompanyDot,
  EmptyState,
  PageHeader,
  Pill,
  ProjectStatusPill,
  StatCard,
} from "@/components/app/primitives";
import { TaskList } from "@/components/app/TaskList";
import { ActionList } from "@/components/app/ActionCard";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import { formatDate, todayISO } from "@/lib/format";
import { COMPANY_STATUS_LABEL, isTaskLate } from "@/lib/types";

export const Route = createFileRoute("/_shell/empresas/$companyId")({
  head: () => ({
    meta: [
      { title: "Empresa · Automa Gestão" },
      { name: "description", content: "Projetos, tarefas e ações da empresa cliente." },
      { property: "og:title", content: "Empresa · Automa Gestão" },
      { property: "og:description", content: "Projetos, tarefas e ações da empresa cliente." },
    ],
  }),
  component: CompanyPage,
});

function CompanyPage() {
  const { companyId } = Route.useParams();
  const { data, companyById, userById } = useWorkspace();
  const { openCompany, openTask, openAction, openProject } = useForms();
  const today = todayISO();
  const company = companyById.get(companyId);

  if (!company) {
    return <EmptyState title="Empresa não encontrada" description="Ela pode ter sido excluída." />;
  }

  const projects = data.projects.filter((p) => p.company_id === companyId);
  const tasks = data.tasks.filter((t) => t.company_id === companyId);
  const actions = data.actions.filter((a) => a.company_id === companyId);
  const openTasks = tasks.filter((t) => t.status !== "concluida" && t.status !== "cancelada");
  const lateTasks = tasks.filter((t) => isTaskLate(t, today));
  const nextActions = actions.filter((a) => a.action_date >= today && a.status !== "cancelada");
  const doneRecently = tasks
    .filter((t) => t.status === "concluida")
    .slice(0, 5);

  return (
    <>
      <Link
        to="/empresas"
        className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Empresas
      </Link>

      <div
        className="card-surface mb-6 flex flex-wrap items-center justify-between gap-4 border-l-4 p-5"
        style={{ borderLeftColor: company.color }}
      >
        <div className="flex items-center gap-3">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={`Logo ${company.name}`}
              className="size-11 rounded-lg object-cover"
            />
          ) : (
            <div
              className="flex size-11 items-center justify-center rounded-lg text-base font-bold text-white"
              style={{ backgroundColor: company.color }}
            >
              {company.name.charAt(0)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{company.name}</h1>
              <Pill tone={company.status === "ativa" ? "success" : "neutral"}>
                {COMPANY_STATUS_LABEL[company.status]}
              </Pill>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {[company.contact_name, company.phone, company.email].filter(Boolean).join(" · ") ||
                "Sem contato cadastrado"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openCompany(company)}>
            <Pencil className="size-3.5" /> Editar
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => openTask(null, { companyId })}>
            <Plus className="size-4" /> Nova tarefa
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Projetos ativos" value={projects.filter((p) => p.status === "em_andamento").length} />
        <StatCard label="Tarefas abertas" value={openTasks.length} tone="info" />
        <StatCard label="Tarefas atrasadas" value={lateTasks.length} tone="danger" />
        <StatCard label="Ações futuras" value={nextActions.length} />
      </div>

      <Tabs defaultValue="visao" className="mt-6">
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="projetos">Projetos</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="acoes">Ações</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="mb-2 text-sm font-bold">Tarefas em aberto</h2>
            <TaskList tasks={openTasks.slice(0, 8)} showCompany={false} emptyTitle="Nada em aberto" />
          </section>
          <div className="space-y-6">
            <section>
              <h2 className="mb-2 text-sm font-bold">Próximas ações</h2>
              <ActionList actions={nextActions.slice(0, 5)} empty="Sem ações futuras" />
            </section>
            <section>
              <h2 className="mb-2 text-sm font-bold">Concluídas recentemente</h2>
              <TaskList
                tasks={doneRecently}
                showCompany={false}
                emptyTitle="Nada concluído ainda"
              />
            </section>
            {company.notes ? (
              <section>
                <h2 className="mb-2 text-sm font-bold">Observações</h2>
                <p className="card-surface p-4 text-sm text-muted-foreground">{company.notes}</p>
              </section>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="projetos" className="mt-4">
          <div className="mb-3">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openProject(null, { companyId })}>
              <Plus className="size-4" /> Novo projeto
            </Button>
          </div>
          {projects.length === 0 ? (
            <EmptyState title="Nenhum projeto" />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {projects.map((p) => (
                <Link
                  key={p.id}
                  to="/projetos/$projectId"
                  params={{ projectId: p.id }}
                  className="card-surface block p-4 hover:bg-accent/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold">{p.name}</span>
                    <ProjectStatusPill status={p.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prazo: {formatDate(p.deadline)} ·{" "}
                    {p.responsible_user_id ? userById.get(p.responsible_user_id)?.name : "Sem responsável"}
                  </p>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tarefas" className="mt-4">
          <div className="mb-3">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openTask(null, { companyId })}>
              <Plus className="size-4" /> Nova tarefa
            </Button>
          </div>
          <TaskList tasks={tasks} showCompany={false} emptyTitle="Nenhuma tarefa" />
        </TabsContent>

        <TabsContent value="acoes" className="mt-4">
          <div className="mb-3">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => openAction(null, { companyId })}>
              <Plus className="size-4" /> Nova ação
            </Button>
          </div>
          <ActionList actions={actions} empty="Nenhuma ação" />
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <CompanyDot color={company.color} /> Cor identificadora da empresa
      </div>
    </>
  );
}
