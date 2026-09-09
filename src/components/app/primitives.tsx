import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  ACTION_STATUS_LABEL,
  ACTION_TYPE_LABEL,
  PROJECT_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  type ActionStatus,
  type ActionType,
  type ProjectStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";

export function CompanyDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    primary: "bg-accent text-accent-foreground",
    success: "bg-success/12 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    danger: "bg-destructive/10 text-destructive",
    info: "bg-info/12 text-info",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const tone = {
    a_fazer: "neutral",
    em_andamento: "info",
    aguardando_cliente: "warning",
    concluida: "success",
    cancelada: "neutral",
  }[status] as "neutral" | "info" | "warning" | "success";
  return <Pill tone={tone}>{TASK_STATUS_LABEL[status]}</Pill>;
}

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  const tone = {
    baixa: "neutral",
    normal: "neutral",
    alta: "warning",
    urgente: "danger",
  }[priority] as "neutral" | "warning" | "danger";
  return <Pill tone={tone}>{TASK_PRIORITY_LABEL[priority]}</Pill>;
}

export function ProjectStatusPill({ status }: { status: ProjectStatus }) {
  const tone = {
    planejamento: "neutral",
    em_andamento: "info",
    pausado: "warning",
    concluido: "success",
    cancelado: "neutral",
  }[status] as "neutral" | "info" | "warning" | "success";
  return <Pill tone={tone}>{PROJECT_STATUS_LABEL[status]}</Pill>;
}

export function ActionStatusPill({ status }: { status: ActionStatus }) {
  const tone = { planejada: "info", realizada: "success", cancelada: "neutral" }[status] as
    | "info"
    | "success"
    | "neutral";
  return <Pill tone={tone}>{ACTION_STATUS_LABEL[status]}</Pill>;
}

export function ActionTypePill({ type }: { type: ActionType }) {
  return <Pill tone="primary">{ACTION_TYPE_LABEL[type]}</Pill>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
  onClick,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "neutral" | "danger" | "warning" | "success" | "info";
  onClick?: () => void;
}) {
  const accents: Record<string, string> = {
    neutral: "text-foreground",
    danger: "text-destructive",
    warning: "text-warning-foreground",
    success: "text-success",
    info: "text-info",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "card-surface flex flex-col items-start gap-1 px-4 py-3.5 text-left transition-colors",
        onClick && "hover:bg-accent/40",
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-2xl font-bold tabular-nums", accents[tone])}>{value}</span>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
    </button>
  );
}
