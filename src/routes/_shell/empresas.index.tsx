import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyDot, EmptyState, PageHeader, Pill } from "@/components/app/primitives";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import { todayISO } from "@/lib/format";
import { COMPANY_STATUS_LABEL, isTaskLate } from "@/lib/types";

export const Route = createFileRoute("/_shell/empresas/")({
  head: () => ({
    meta: [
      { title: "Empresas · Automa Gestão" },
      { name: "description", content: "Clientes atendidos, com projetos, tarefas e ações." },
      { property: "og:title", content: "Empresas · Automa Gestão" },
      {
        property: "og:description",
        content: "Clientes atendidos, com projetos, tarefas e ações.",
      },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { data } = useWorkspace();
  const { openCompany } = useForms();
  const today = todayISO();

  return (
    <>
      <PageHeader
        title="Empresas"
        subtitle="Todos os clientes atendidos pela equipe."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => openCompany()}>
            <Plus className="size-4" /> Nova empresa
          </Button>
        }
      />

      {data.companies.length === 0 ? (
        <EmptyState
          title="Nenhuma empresa cadastrada"
          description="Cadastre a primeira empresa que você atende. Ela fica sob a sua gestão e aparece nos projetos, tarefas, ações e no calendário."
        />

      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.companies.map((c) => {
            const tasks = data.tasks.filter((t) => t.company_id === c.id);
            const open = tasks.filter(
              (t) => t.status !== "concluida" && t.status !== "cancelada",
            );
            const late = tasks.filter((t) => isTaskLate(t, today));
            const projects = data.projects.filter(
              (p) => p.company_id === c.id && p.status === "em_andamento",
            );
            const nextActions = data.actions.filter(
              (a) => a.company_id === c.id && a.action_date >= today && a.status === "planejada",
            );
            return (
              <Link
                key={c.id}
                to="/empresas/$companyId"
                params={{ companyId: c.id }}
                className="card-surface block p-4 transition-colors hover:bg-accent/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CompanyDot color={c.color} className="size-3" />
                    <span className="text-sm font-bold">{c.name}</span>
                  </div>
                  <Pill tone={c.status === "ativa" ? "success" : "neutral"}>
                    {COMPANY_STATUS_LABEL[c.status]}
                  </Pill>
                </div>
                {c.contact_name ? (
                  <p className="mt-1 text-xs text-muted-foreground">{c.contact_name}</p>
                ) : null}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Metric label="Projetos" value={projects.length} />
                  <Metric label="Abertas" value={open.length} />
                  <Metric label="Atrasadas" value={late.length} danger={late.length > 0} />
                  <Metric label="Ações" value={nextActions.length} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div>
      <p className={`text-lg font-bold tabular-nums ${danger ? "text-destructive" : ""}`}>
        {value}
      </p>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
