import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActionStatusPill,
  ActionTypePill,
  CompanyDot,
  EmptyState,
  PageHeader,
} from "@/components/app/primitives";
import { FilterBar, emptyFilters, matchFilters } from "@/components/app/Filters";
import { useForms } from "@/components/app/forms";
import { useWorkspace } from "@/lib/workspace";
import { formatDate, timeRange, todayISO } from "@/lib/format";
import { ACTION_STATUS_LABEL, ACTION_TYPE_LABEL, type ActionStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_shell/acoes/")({
  head: () => ({
    meta: [
      { title: "Ações · Automa Gestão" },
      {
        name: "description",
        content: "Reuniões, treinamentos, entregas e demais compromissos agendados.",
      },
      { property: "og:title", content: "Ações · Automa Gestão" },
      {
        property: "og:description",
        content: "Reuniões, treinamentos, entregas e demais compromissos agendados.",
      },
    ],
  }),
  component: ActionsPage,
});

function ActionsPage() {
  const { data, companyById, projectById, userById } = useWorkspace();
  const { openAction } = useForms();
  const today = todayISO();
  const [filters, setFilters] = useState(emptyFilters);
  const [status, setStatus] = useState<ActionStatus | "todas">("todas");
  const [range, setRange] = useState<"futuras" | "passadas" | "todas">("futuras");

  const actions = data.actions
    .filter((a) => {
      if (!matchFilters(a, filters, false)) return false;
      if (status !== "todas" && a.status !== status) return false;
      if (range === "futuras" && a.action_date < today) return false;
      if (range === "passadas" && a.action_date >= today) return false;
      return true;
    })
    .sort((a, b) =>
      range === "passadas"
        ? b.action_date.localeCompare(a.action_date)
        : a.action_date.localeCompare(b.action_date),
    );

  return (
    <>
      <PageHeader
        title="Ações"
        subtitle={`${actions.length} ação(ões) nesta visão`}
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => openAction()}>
            <Plus className="size-4" /> Nova ação
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["futuras", "passadas", "todas"] as const).map((r) => (
          <Chip key={r} active={range === r} onClick={() => setRange(r)}>
            {r === "futuras" ? "Próximas" : r === "passadas" ? "Anteriores" : "Todas"}
          </Chip>
        ))}
        <span className="mx-1 w-px bg-border" />
        {(["todas", ...(Object.keys(ACTION_STATUS_LABEL) as ActionStatus[])] as const).map((s) => (
          <Chip key={s} active={status === s} onClick={() => setStatus(s as ActionStatus | "todas")}>
            {s === "todas" ? "Todos os status" : ACTION_STATUS_LABEL[s as ActionStatus]}
          </Chip>
        ))}
      </div>

      <FilterBar value={filters} onChange={setFilters} hideStatus />

      {actions.length === 0 ? (
        <EmptyState title="Nenhuma ação encontrada" />
      ) : (
        <div className="card-surface divide-y divide-border overflow-hidden">
          {actions.map((a) => {
            const company = companyById.get(a.company_id);
            const project = a.project_id ? projectById.get(a.project_id) : null;
            const owner = a.responsible_user_id ? userById.get(a.responsible_user_id) : null;
            return (
              <Link
                key={a.id}
                to="/acoes/$actionId"
                params={{ actionId: a.id }}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-accent/30"
              >
                <div className="w-28 shrink-0">
                  <p className="text-sm font-bold tabular-nums">{formatDate(a.action_date)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {timeRange(a.start_time, a.end_time, a.all_day)}
                  </p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                    {company ? (
                      <span className="inline-flex items-center gap-1.5">
                        <CompanyDot color={company.color} />
                        {company.name}
                      </span>
                    ) : null}
                    {project ? <span>· {project.name}</span> : null}
                    {owner ? <span>· {owner.name}</span> : null}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <ActionTypePill type={a.action_type} />
                  <ActionStatusPill status={a.status} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Tipos disponíveis: {Object.values(ACTION_TYPE_LABEL).join(", ")}.
      </p>
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}
