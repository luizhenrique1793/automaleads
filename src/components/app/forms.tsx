import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useInvalidateWorkspace, useWorkspace } from "@/lib/workspace";
import { todayISO } from "@/lib/format";
import {
  ACTION_STATUS_LABEL,
  ACTION_TYPE_LABEL,
  COMPANY_STATUS_LABEL,
  PROJECT_STATUS_LABEL,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  type Action,
  type Company,
  type Project,
  type Task,
} from "@/lib/types";
import {
  deleteAction,
  deleteCompany,
  deleteProject,
  deleteTask,
  saveAction,
  saveCompany,
  saveProject,
  saveTask,
} from "@/lib/api.functions";

const NONE = "__none__";

export interface TaskPrefill {
  companyId?: string | null;
  projectId?: string | null;
  actionId?: string | null;
}
export interface ActionPrefill {
  companyId?: string | null;
  projectId?: string | null;
  date?: string | null;
}
export interface ProjectPrefill {
  companyId?: string | null;
}

interface FormsContextValue {
  openTask: (task?: Task | null, prefill?: TaskPrefill) => void;
  openAction: (action?: Action | null, prefill?: ActionPrefill) => void;
  openProject: (project?: Project | null, prefill?: ProjectPrefill) => void;
  openCompany: (company?: Company | null) => void;
}

const FormsContext = createContext<FormsContextValue | null>(null);

export function useForms() {
  const ctx = useContext(FormsContext);
  if (!ctx) throw new Error("useForms deve ser usado dentro de FormsProvider");
  return ctx;
}

export function FormsProvider({ children }: { children: ReactNode }) {
  const [task, setTask] = useState<{ value: Task | null; prefill: TaskPrefill } | null>(null);
  const [action, setAction] = useState<{ value: Action | null; prefill: ActionPrefill } | null>(
    null,
  );
  const [project, setProject] = useState<{
    value: Project | null;
    prefill: ProjectPrefill;
  } | null>(null);
  const [company, setCompany] = useState<{ value: Company | null } | null>(null);

  const value = useMemo<FormsContextValue>(
    () => ({
      openTask: (t = null, prefill = {}) => setTask({ value: t, prefill }),
      openAction: (a = null, prefill = {}) => setAction({ value: a, prefill }),
      openProject: (p = null, prefill = {}) => setProject({ value: p, prefill }),
      openCompany: (c = null) => setCompany({ value: c }),
    }),
    [],
  );

  return (
    <FormsContext.Provider value={value}>
      {children}
      {task ? (
        <TaskSheet task={task.value} prefill={task.prefill} onClose={() => setTask(null)} />
      ) : null}
      {action ? (
        <ActionSheet action={action.value} prefill={action.prefill} onClose={() => setAction(null)} />
      ) : null}
      {project ? (
        <ProjectSheet
          project={project.value}
          prefill={project.prefill}
          onClose={() => setProject(null)}
        />
      ) : null}
      {company ? <CompanySheet company={company.value} onClose={() => setCompany(null)} /> : null}
    </FormsContext.Provider>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SheetShell({
  title,
  description,
  onClose,
  onSubmit,
  onDelete,
  saving,
  children,
}: {
  title: string;
  description?: string | undefined;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: (() => void) | undefined;
  saving: boolean;
  children: ReactNode;
}) {
  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="text-base">{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="scrollbar-slim flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {children}
          </div>
          <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-border px-5 py-3">
            {onDelete ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                  >
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir definitivamente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Os registros ligados a este item também podem
                      ser removidos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={onDelete}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------------------------------------------------------- */
/* Tarefa                                                            */
/* ---------------------------------------------------------------- */

function TaskSheet({
  task,
  prefill,
  onClose,
}: {
  task: Task | null;
  prefill: TaskPrefill;
  onClose: () => void;
}) {
  const { data } = useWorkspace();
  const invalidate = useInvalidateWorkspace();
  const save = useServerFn(saveTask);
  const remove = useServerFn(deleteTask);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    title: task?.title ?? "",
    description: task?.description ?? "",
    company_id: task?.company_id ?? prefill.companyId ?? "",
    project_id: task?.project_id ?? prefill.projectId ?? "",
    action_id: task?.action_id ?? prefill.actionId ?? "",
    responsible_user_id: task?.responsible_user_id ?? "",
    due_date: task?.due_date ?? todayISO(),
    priority: task?.priority ?? "normal",
    status: task?.status ?? "a_fazer",
  }));

  const projects = data.projects.filter((p) => p.company_id === form.company_id);
  const actions = data.actions.filter((a) => a.company_id === form.company_id);

  async function submit() {
    if (!form.title.trim()) { toast.error("Informe o título da tarefa."); return; }
    if (!form.company_id) { toast.error("Selecione a empresa."); return; }
    setSaving(true);
    try {
      await save({
        data: {
          id: task?.id ?? null,
          company_id: form.company_id,
          project_id: form.project_id || null,
          action_id: form.action_id || null,
          title: form.title,
          description: form.description || null,
          responsible_user_id: form.responsible_user_id || null,
          due_date: form.due_date || null,
          priority: form.priority,
          status: form.status,
        },
      });
      await invalidate();
      toast.success(task ? "Tarefa atualizada." : "Tarefa criada.");
      onClose();
    } catch {
      toast.error("Não foi possível salvar a tarefa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    setSaving(true);
    await remove({ data: { id: task.id } });
    await invalidate();
    toast.success("Tarefa excluída.");
    onClose();
  }

  return (
    <SheetShell
      title={task ? "Editar tarefa" : "Nova tarefa"}
      onClose={onClose}
      onSubmit={submit}
      onDelete={task ? handleDelete : undefined}
      saving={saving}
    >
      <Field label="Título">
        <Input
          autoFocus
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex.: Preparar apresentação"
        />
      </Field>
      <Field label="Empresa">
        <Select
          value={form.company_id}
          onValueChange={(v) => setForm({ ...form, company_id: v, project_id: "", action_id: "" })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {data.companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Projeto (opcional)">
          <Select
            value={form.project_id || NONE}
            onValueChange={(v) => setForm({ ...form, project_id: v === NONE ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhum</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Ação (opcional)">
          <Select
            value={form.action_id || NONE}
            onValueChange={(v) => setForm({ ...form, action_id: v === NONE ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhuma</SelectItem>
              {actions.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Responsável">
          <Select
            value={form.responsible_user_id || NONE}
            onValueChange={(v) => setForm({ ...form, responsible_user_id: v === NONE ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ninguém" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Ninguém</SelectItem>
              {data.users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Prazo">
          <Input
            type="date"
            value={form.due_date ?? ""}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Prioridade">
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as typeof form.priority })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_PRIORITY_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_STATUS_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Descrição">
        <Textarea
          rows={4}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Detalhes, links, contexto..."
        />
      </Field>
    </SheetShell>
  );
}

/* ---------------------------------------------------------------- */
/* Ação                                                              */
/* ---------------------------------------------------------------- */

function ActionSheet({
  action,
  prefill,
  onClose,
}: {
  action: Action | null;
  prefill: ActionPrefill;
  onClose: () => void;
}) {
  const { data } = useWorkspace();
  const invalidate = useInvalidateWorkspace();
  const save = useServerFn(saveAction);
  const remove = useServerFn(deleteAction);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    title: action?.title ?? "",
    description: action?.description ?? "",
    company_id: action?.company_id ?? prefill.companyId ?? "",
    project_id: action?.project_id ?? prefill.projectId ?? "",
    action_type: action?.action_type ?? "reuniao",
    responsible_user_id: action?.responsible_user_id ?? "",
    action_date: action?.action_date ?? prefill.date ?? todayISO(),
    all_day: action?.all_day ?? false,
    start_time: action?.start_time ?? "09:00",
    end_time: action?.end_time ?? "10:00",
    status: action?.status ?? "planejada",
  }));

  const projects = data.projects.filter((p) => p.company_id === form.company_id);

  async function submit() {
    if (!form.title.trim()) { toast.error("Informe o título da ação."); return; }
    if (!form.company_id) { toast.error("Selecione a empresa."); return; }
    if (!form.all_day && !form.start_time) { toast.error("Informe o horário inicial."); return; }
    setSaving(true);
    try {
      await save({
        data: {
          id: action?.id ?? null,
          company_id: form.company_id,
          project_id: form.project_id || null,
          title: form.title,
          description: form.description || null,
          action_type: form.action_type,
          responsible_user_id: form.responsible_user_id || null,
          action_date: form.action_date,
          all_day: form.all_day,
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          status: form.status,
        },
      });
      await invalidate();
      toast.success(action ? "Ação atualizada." : "Ação criada.");
      onClose();
    } catch {
      toast.error("Não foi possível salvar a ação.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!action) return;
    setSaving(true);
    await remove({ data: { id: action.id } });
    await invalidate();
    toast.success("Ação excluída.");
    onClose();
  }

  return (
    <SheetShell
      title={action ? "Editar ação" : "Nova ação"}
      onClose={onClose}
      onSubmit={submit}
      onDelete={action ? handleDelete : undefined}
      saving={saving}
    >
      <Field label="Título">
        <Input
          autoFocus
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Ex.: Reunião de validação"
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Empresa">
          <Select
            value={form.company_id}
            onValueChange={(v) => setForm({ ...form, company_id: v, project_id: "" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {data.companies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Projeto (opcional)">
          <Select
            value={form.project_id || NONE}
            onValueChange={(v) => setForm({ ...form, project_id: v === NONE ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Nenhum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Nenhum</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Tipo">
          <Select
            value={form.action_type}
            onValueChange={(v) => setForm({ ...form, action_type: v as typeof form.action_type })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTION_TYPE_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Responsável">
          <Select
            value={form.responsible_user_id || NONE}
            onValueChange={(v) => setForm({ ...form, responsible_user_id: v === NONE ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ninguém" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Ninguém</SelectItem>
              {data.users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Data">
        <Input
          type="date"
          value={form.action_date}
          onChange={(e) => setForm({ ...form, action_date: e.target.value })}
        />
      </Field>
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <span className="text-sm font-medium">Dia inteiro</span>
        <Switch
          checked={form.all_day}
          onCheckedChange={(v) => setForm({ ...form, all_day: v })}
        />
      </div>
      {!form.all_day ? (
        <div className="grid grid-cols-2 gap-4">
          <Field label="Início">
            <Input
              type="time"
              value={form.start_time ?? ""}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
          </Field>
          <Field label="Fim">
            <Input
              type="time"
              value={form.end_time ?? ""}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </Field>
        </div>
      ) : null}
      <Field label="Status">
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ACTION_STATUS_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Descrição">
        <Textarea
          rows={4}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>
    </SheetShell>
  );
}

/* ---------------------------------------------------------------- */
/* Projeto                                                           */
/* ---------------------------------------------------------------- */

function ProjectSheet({
  project,
  prefill,
  onClose,
}: {
  project: Project | null;
  prefill: ProjectPrefill;
  onClose: () => void;
}) {
  const { data } = useWorkspace();
  const invalidate = useInvalidateWorkspace();
  const save = useServerFn(saveProject);
  const remove = useServerFn(deleteProject);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    name: project?.name ?? "",
    description: project?.description ?? "",
    company_id: project?.company_id ?? prefill.companyId ?? "",
    responsible_user_id: project?.responsible_user_id ?? "",
    start_date: project?.start_date ?? todayISO(),
    deadline: project?.deadline ?? "",
    status: project?.status ?? "planejamento",
    progress: project?.progress ?? 0,
  }));

  async function submit() {
    if (!form.name.trim()) { toast.error("Informe o nome do projeto."); return; }
    if (!form.company_id) { toast.error("Selecione a empresa."); return; }
    setSaving(true);
    try {
      await save({
        data: {
          id: project?.id ?? null,
          company_id: form.company_id,
          name: form.name,
          description: form.description || null,
          responsible_user_id: form.responsible_user_id || null,
          start_date: form.start_date || null,
          deadline: form.deadline || null,
          status: form.status,
          progress: Number(form.progress) || 0,
        },
      });
      await invalidate();
      toast.success(project ? "Projeto atualizado." : "Projeto criado.");
      onClose();
    } catch {
      toast.error("Não foi possível salvar o projeto.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    setSaving(true);
    await remove({ data: { id: project.id } });
    await invalidate();
    toast.success("Projeto excluído.");
    onClose();
  }

  return (
    <SheetShell
      title={project ? "Editar projeto" : "Novo projeto"}
      onClose={onClose}
      onSubmit={submit}
      onDelete={project ? handleDelete : undefined}
      saving={saving}
    >
      <Field label="Nome">
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex.: Agente de IA"
        />
      </Field>
      <Field label="Empresa">
        <Select
          value={form.company_id}
          onValueChange={(v) => setForm({ ...form, company_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {data.companies.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Início">
          <Input
            type="date"
            value={form.start_date ?? ""}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
        </Field>
        <Field label="Prazo">
          <Input
            type="date"
            value={form.deadline ?? ""}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Responsável">
          <Select
            value={form.responsible_user_id || NONE}
            onValueChange={(v) => setForm({ ...form, responsible_user_id: v === NONE ? "" : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ninguém" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Ninguém</SelectItem>
              {data.users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUS_LABEL).map(([k, l]) => (
                <SelectItem key={k} value={k}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label={`Progresso: ${form.progress}%`}>
        <Input
          type="range"
          min={0}
          max={100}
          step={5}
          value={form.progress}
          onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
        />
      </Field>
      <Field label="Descrição">
        <Textarea
          rows={4}
          value={form.description ?? ""}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </Field>
    </SheetShell>
  );
}

/* ---------------------------------------------------------------- */
/* Empresa                                                           */
/* ---------------------------------------------------------------- */

const COLORS = [
  "#4f46e5",
  "#0f7b8a",
  "#e0651a",
  "#b4245c",
  "#2f8f4e",
  "#5b53c9",
  "#a5761a",
  "#3f6fd8",
];

function CompanySheet({ company, onClose }: { company: Company | null; onClose: () => void }) {
  const invalidate = useInvalidateWorkspace();
  const save = useServerFn(saveCompany);
  const remove = useServerFn(deleteCompany);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => ({
    name: company?.name ?? "",
    color: company?.color ?? COLORS[0]!,
    logo_url: company?.logo_url ?? "",
    contact_name: company?.contact_name ?? "",
    phone: company?.phone ?? "",
    email: company?.email ?? "",
    notes: company?.notes ?? "",
    status: company?.status ?? "ativa",
  }));

  async function submit() {
    if (!form.name.trim()) { toast.error("Informe o nome da empresa."); return; }
    setSaving(true);
    try {
      await save({ data: { id: company?.id ?? null, ...form } });
      await invalidate();
      toast.success(company ? "Empresa atualizada." : "Empresa criada.");
      onClose();
    } catch {
      toast.error("Não foi possível salvar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!company) return;
    setSaving(true);
    await remove({ data: { id: company.id } });
    await invalidate();
    toast.success("Empresa excluída.");
    onClose();
  }

  return (
    <SheetShell
      title={company ? "Editar empresa" : "Nova empresa"}
      onClose={onClose}
      onSubmit={submit}
      onDelete={company ? handleDelete : undefined}
      saving={saving}
    >
      <Field label="Nome">
        <Input
          autoFocus
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex.: Parque Pôr do Sol"
        />
      </Field>
      <Field label="Cor identificadora">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className="size-7 rounded-full border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                borderColor: form.color === c ? "var(--color-foreground)" : "transparent",
              }}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contato">
          <Input
            value={form.contact_name ?? ""}
            onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
          />
        </Field>
        <Field label="Telefone">
          <Input
            value={form.phone ?? ""}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
      </div>
      <Field label="E-mail">
        <Input
          type="email"
          value={form.email ?? ""}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </Field>
      <Field label="Logo (URL)">
        <Input
          value={form.logo_url ?? ""}
          onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          placeholder="https://..."
        />
      </Field>
      <Field label="Status">
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(COMPANY_STATUS_LABEL).map(([k, l]) => (
              <SelectItem key={k} value={k}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Observações">
        <Textarea
          rows={4}
          value={form.notes ?? ""}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </Field>
    </SheetShell>
  );
}
