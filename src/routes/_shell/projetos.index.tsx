import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CompanyDot,
  EmptyState,
  PageHeader,
  ProjectStatusPill,
} from "@/components/app/primitives";
import { FilterBar, ALL, emptyFilters } from "@/components/app/Filters";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import { formatDate, todayISO } from "@/lib/format";
import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/projetos/")({
  head: () => ({
    meta: [
      { title: "Projetos · Automa Gestão" },
      { name: "description", content: "Projetos por empresa, com prazo, responsável e progresso." },
      { property: "og:title", content: "Projetos · Automa Gestão" },
      {
        property: "og:description",
        content: "Projetos por empresa, com prazo, responsável e progresso.",
      },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { data, companyById, userById } = useWorkspace();
  const { openProject } = useForms();
  const [filters, setFilters] = useState(emptyFilters);
  const today = todayISO();

  const projects = data.projects.filter((p) => {
    if (filters.company !== ALL && p.company_id !== filters.company) return false;
    if (filters.project !== ALL && p.id !== filters.project) return false;
    if (filters.user !== ALL && p.responsible_user_id !== filters.user) return false;
    if (filters.status !== ALL && p.status !== filters.status) return false;
    return true;
  });

  return (
    <>
      <PageHeader
        title="Projetos"
        subtitle={`${projects.length} projeto(s)`}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => openProject()}>
            <Plus className="size-4" /> Novo projeto
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(Object.keys(PROJECT_STATUS_LABEL) as ProjectStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() =>
              setFilters({ ...filters, status: filters.status === s ? ALL : s })
            }
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filters.status === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:bg-accent",
            )}
          >
            {PROJECT_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <FilterBar value={filters} onChange={setFilters} hideStatus />

      {projects.length === 0 ? (
        <EmptyState title="Nenhum projeto encontrado" />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => {
            const company = companyById.get(p.company_id);
            const owner = p.responsible_user_id ? userById.get(p.responsible_user_id) : null;
            const openTasks = data.tasks.filter(
              (t) => t.project_id === p.id && t.status !== "concluida" && t.status !== "cancelada",
            ).length;
            const late = !!p.deadline && p.deadline < today && p.status !== "concluido";
            return (
              <Link
                key={p.id}
                to="/projetos/$projectId"
                params={{ projectId: p.id }}
                className="card-surface block p-4 hover:bg-accent/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold">{p.name}</span>
                  <ProjectStatusPill status={p.status} />
                </div>
                {company ? (
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CompanyDot color={company.color} />
                    {company.name}
                  </span>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  {owner?.name ?? "Sem responsável"} ·{" "}
                  <span className={cn(late && "font-semibold text-destructive")}>
                    prazo {formatDate(p.deadline)}
                  </span>{" "}
                  · {openTasks} tarefa(s) aberta(s)
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                    {p.progress}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
