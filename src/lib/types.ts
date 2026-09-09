export type CompanyStatus = "ativa" | "inativa";
export type ProjectStatus =
  | "planejamento"
  | "em_andamento"
  | "pausado"
  | "concluido"
  | "cancelado";
export type TaskStatus =
  | "a_fazer"
  | "em_andamento"
  | "aguardando_cliente"
  | "concluida"
  | "cancelada";
export type TaskPriority = "baixa" | "normal" | "alta" | "urgente";
export type ActionStatus = "planejada" | "realizada" | "cancelada";
export type ActionType =
  | "reuniao"
  | "palestra"
  | "treinamento"
  | "publicacao"
  | "entrega"
  | "visita"
  | "campanha"
  | "evento"
  | "outro";

export interface User {
  id: string;
  name: string;
  email: string;
  global_role: string;
  active: boolean;
  must_change_password?: boolean;
  onboarding_done?: boolean;
}

export function isAdmin(user: { global_role: string } | null | undefined): boolean {
  return user?.global_role === "administrador";
}

export function isClient(user: { global_role: string } | null | undefined): boolean {
  return user?.global_role === "cliente";
}

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  color: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  status: CompanyStatus;
  is_demo?: boolean;
}

export interface Project {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  responsible_user_id: string | null;
  start_date: string | null;
  deadline: string | null;
  status: ProjectStatus;
  progress: number;
}

export interface Action {
  id: string;
  company_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  action_type: ActionType;
  responsible_user_id: string | null;
  action_date: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  status: ActionStatus;
}

export interface Task {
  id: string;
  company_id: string;
  project_id: string | null;
  action_id: string | null;
  title: string;
  description: string | null;
  responsible_user_id: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  company_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  detail: string | null;
  created_at: string;
}

export interface CompanyUser {
  company_id: string;
  user_id: string;
  role: string;
}

export interface Workspace {
  users: User[];
  companies: Company[];
  projects: Project[];
  actions: Action[];
  tasks: Task[];
  logs: ActivityLog[];
  companyUsers: CompanyUser[];
}

export interface ClientPortal {
  companies: Company[];
  projects: Project[];
  actions: Action[];
  tasks: Task[];
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  a_fazer: "A fazer",
  em_andamento: "Em andamento",
  aguardando_cliente: "Aguardando cliente",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const TASK_PRIORITY_LABEL: Record<TaskPriority, string> = {
  baixa: "Baixa",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  pausado: "Pausado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const ACTION_STATUS_LABEL: Record<ActionStatus, string> = {
  planejada: "Planejada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export const ACTION_TYPE_LABEL: Record<ActionType, string> = {
  reuniao: "Reunião",
  palestra: "Palestra",
  treinamento: "Treinamento",
  publicacao: "Publicação",
  entrega: "Entrega",
  visita: "Visita",
  campanha: "Campanha",
  evento: "Evento",
  outro: "Outro",
};

export const COMPANY_STATUS_LABEL: Record<CompanyStatus, string> = {
  ativa: "Ativa",
  inativa: "Inativa",
};

export const OPEN_TASK_STATUSES: TaskStatus[] = [
  "a_fazer",
  "em_andamento",
  "aguardando_cliente",
];

export function isTaskLate(task: Task, today: string): boolean {
  if (!task.due_date) return false;
  if (task.status === "concluida" || task.status === "cancelada") return false;
  return task.due_date < today;
}
