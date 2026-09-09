import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/lib/workspace";
import { TASK_STATUS_LABEL } from "@/lib/types";

export const ALL = "__all__";

export interface FilterState {
  company: string;
  project: string;
  user: string;
  status: string;
}

export const emptyFilters: FilterState = {
  company: ALL,
  project: ALL,
  user: ALL,
  status: ALL,
};

export function FilterBar({
  value,
  onChange,
  hideStatus,
}: {
  value: FilterState;
  onChange: (v: FilterState) => void;
  hideStatus?: boolean;
}) {
  const { data } = useWorkspace();
  const projects =
    value.company === ALL
      ? data.projects
      : data.projects.filter((p) => p.company_id === value.company);

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <Select
        value={value.company}
        onValueChange={(v) => onChange({ ...value, company: v, project: ALL })}
      >
        <SelectTrigger className="h-9 w-auto min-w-[9rem] bg-surface">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas as empresas</SelectItem>
          {data.companies.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.project} onValueChange={(v) => onChange({ ...value, project: v })}>
        <SelectTrigger className="h-9 w-auto min-w-[9rem] bg-surface">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os projetos</SelectItem>
          {projects.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={value.user} onValueChange={(v) => onChange({ ...value, user: v })}>
        <SelectTrigger className="h-9 w-auto min-w-[9rem] bg-surface">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os responsáveis</SelectItem>
          {data.users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hideStatus ? null : (
        <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
          <SelectTrigger className="h-9 w-auto min-w-[9rem] bg-surface">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os status</SelectItem>
            {Object.entries(TASK_STATUS_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function matchFilters(
  item: { company_id: string; project_id?: string | null; responsible_user_id?: string | null; status?: string },
  f: FilterState,
  applyStatus = true,
) {
  if (f.company !== ALL && item.company_id !== f.company) return false;
  if (f.project !== ALL && item.project_id !== f.project) return false;
  if (f.user !== ALL && item.responsible_user_id !== f.user) return false;
  if (applyStatus && f.status !== ALL && item.status !== f.status) return false;
  return true;
}
