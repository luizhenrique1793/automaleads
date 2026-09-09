import { Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { timeRange } from "@/lib/format";
import type { Action } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { ActionStatusPill, ActionTypePill, CompanyDot, EmptyState } from "./primitives";

export function ActionCard({ action, showDate }: { action: Action; showDate?: string }) {
  const { companyById, projectById } = useWorkspace();
  const company = companyById.get(action.company_id);
  const project = action.project_id ? projectById.get(action.project_id) : null;

  return (
    <Link
      to="/acoes/$actionId"
      params={{ actionId: action.id }}
      className="block rounded-lg border-l-[3px] bg-accent/40 px-3 py-2.5 transition-colors hover:bg-accent"
      style={{ borderLeftColor: company?.color ?? "var(--color-primary)" }}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
        <Clock className="size-3" />
        {timeRange(action.start_time, action.end_time, action.all_day)}
        {showDate ? <span>· {showDate}</span> : null}
      </div>
      <p className="mt-1 text-sm font-semibold">{action.title}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {company ? (
          <span className="inline-flex items-center gap-1.5">
            <CompanyDot color={company.color} />
            {company.name}
          </span>
        ) : null}
        {project ? <span>· {project.name}</span> : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <ActionTypePill type={action.action_type} />
        <ActionStatusPill status={action.status} />
      </div>
    </Link>
  );
}

export function ActionList({ actions, empty }: { actions: Action[]; empty?: string }) {
  if (actions.length === 0) {
    return <EmptyState title={empty ?? "Nenhuma ação"} />;
  }
  return (
    <div className="space-y-2">
      {actions.map((a) => (
        <ActionCard key={a.id} action={a} />
      ))}
    </div>
  );
}
