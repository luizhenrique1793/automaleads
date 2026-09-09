import { createServerFn } from "@tanstack/react-start";
import type {
  Action,
  ActivityLog,
  ClientPortal,
  Company,
  CompanyUser,
  Project,
  Task,
  User,
  Workspace,
} from "./types";

/* ------------------------------------------------------------------ */
/* Sessão                                                              */
/* ------------------------------------------------------------------ */

export const getMe = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("./auth.server");
  const { ensureSeed } = await import("./seed.server");
  try {
    await ensureSeed();
    const user = await getSessionUser();
    return { user, dbError: null as string | null };
  } catch (err) {
    return { user: null as User | null, dbError: (err as Error).message };
  }
});

export const login = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) => d)
  .handler(async ({ data }) => {
    const { verifyPassword, setSessionUser } = await import("./auth.server");
    const { ensureSeed } = await import("./seed.server");
    const { db } = await import("./db.server");
    await ensureSeed();
    const sql = await db();
    const rows = await sql<{ id: string; password_hash: string }[]>`
      SELECT id, password_hash FROM users
      WHERE lower(email) = lower(${data.email.trim()}) AND active = true
    `;
    const row = rows[0];
    if (!row || !(await verifyPassword(data.password, row.password_hash))) {
      return { ok: false as const, error: "E-mail ou senha inválidos." };
    }
    await setSessionUser(row.id);
    return { ok: true as const };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSessionUser } = await import("./auth.server");
  await clearSessionUser();
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* Leitura geral                                                       */
/* ------------------------------------------------------------------ */

export const getWorkspace = createServerFn({ method: "GET" }).handler(
  async (): Promise<Workspace> => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const me = await requireUser();
    if (me.global_role === "cliente") throw new Error("ACESSO_RESTRITO");
    const sql = await db();

    const [users, companies, projects, actions, tasks, logs, companyUsers] = await Promise.all([
      sql<User[]>`SELECT id, name, email, global_role, active FROM users ORDER BY name`,
      sql<Company[]>`SELECT id, name, logo_url, color, contact_name, phone, email, notes, status,
                       is_demo
                     FROM companies ORDER BY name`,
      sql<Project[]>`SELECT id, company_id, name, description, responsible_user_id,
                       to_char(start_date,'YYYY-MM-DD') AS start_date,
                       to_char(deadline,'YYYY-MM-DD') AS deadline,
                       status, progress
                     FROM projects ORDER BY created_at DESC`,
      sql<Action[]>`SELECT id, company_id, project_id, title, description, action_type,
                      responsible_user_id,
                      to_char(action_date,'YYYY-MM-DD') AS action_date,
                      all_day,
                      to_char(start_time,'HH24:MI') AS start_time,
                      to_char(end_time,'HH24:MI') AS end_time,
                      status
                    FROM actions ORDER BY action_date, start_time NULLS FIRST`,
      sql<Task[]>`SELECT id, company_id, project_id, action_id, title, description,
                    responsible_user_id,
                    to_char(due_date,'YYYY-MM-DD') AS due_date,
                    priority, status,
                    to_char(completed_at,'YYYY-MM-DD"T"HH24:MI:SS') AS completed_at,
                    to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
                  FROM tasks ORDER BY due_date NULLS LAST, created_at DESC`,
      sql<ActivityLog[]>`SELECT id, user_id, company_id, entity_type, entity_id, action, detail,
                           to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
                         FROM activity_logs ORDER BY created_at DESC LIMIT 40`,
      sql<CompanyUser[]>`SELECT company_id, user_id, role FROM company_users`,
    ]);

    return { users, companies, projects, actions, tasks, logs, companyUsers };
  },
);

/* ------------------------------------------------------------------ */
/* Portal do cliente                                                   */
/* ------------------------------------------------------------------ */

export const getClientPortal = createServerFn({ method: "GET" }).handler(
  async (): Promise<ClientPortal> => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    const sql = await db();

    const companies = await sql<Company[]>`
      SELECT c.id, c.name, c.logo_url, c.color, c.contact_name, c.phone, c.email, c.notes,
             c.status, c.is_demo
      FROM companies c
      JOIN company_users cu ON cu.company_id = c.id
      WHERE cu.user_id = ${user.id}
      ORDER BY c.name`;

    const ids = companies.map((c) => c.id);
    if (ids.length === 0) {
      return { companies, projects: [], actions: [], tasks: [] };
    }

    const [projects, actions, tasks] = await Promise.all([
      sql<Project[]>`SELECT id, company_id, name, description, responsible_user_id,
                       to_char(start_date,'YYYY-MM-DD') AS start_date,
                       to_char(deadline,'YYYY-MM-DD') AS deadline,
                       status, progress
                     FROM projects WHERE company_id = ANY(${ids}) ORDER BY name`,
      sql<Action[]>`SELECT id, company_id, project_id, title, description, action_type,
                      responsible_user_id,
                      to_char(action_date,'YYYY-MM-DD') AS action_date,
                      all_day,
                      to_char(start_time,'HH24:MI') AS start_time,
                      to_char(end_time,'HH24:MI') AS end_time,
                      status
                    FROM actions WHERE company_id = ANY(${ids})
                    ORDER BY action_date DESC, start_time NULLS FIRST`,
      sql<Task[]>`SELECT id, company_id, project_id, action_id, title, description,
                    responsible_user_id,
                    to_char(due_date,'YYYY-MM-DD') AS due_date,
                    priority, status,
                    to_char(completed_at,'YYYY-MM-DD"T"HH24:MI:SS') AS completed_at,
                    to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
                  FROM tasks WHERE company_id = ANY(${ids})
                  ORDER BY due_date NULLS LAST, created_at DESC`,
    ]);

    return { companies, projects, actions, tasks };
  },
);

/* ------------------------------------------------------------------ */
/* Empresas                                                            */
/* ------------------------------------------------------------------ */

export interface CompanyInput {
  id?: string | null;
  name: string;
  color: string;
  logo_url?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  status: string;
}

export const saveCompany = createServerFn({ method: "POST" })
  .inputValidator((d: CompanyInput) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    const sql = await db();
    const v = {
      name: data.name.trim(),
      color: data.color,
      logo_url: data.logo_url || null,
      contact_name: data.contact_name || null,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
      status: data.status,
    };
    let id = data.id ?? null;
    if (id) {
      await sql`UPDATE companies SET ${sql(v)}, updated_at = now() WHERE id = ${id}`;
    } else {
      const rows = await sql<{ id: string }[]>`INSERT INTO companies ${sql(v)} RETURNING id`;
      id = rows[0]!.id;
    }
    await sql`INSERT INTO activity_logs (user_id, company_id, entity_type, entity_id, action, detail)
              VALUES (${user.id}, ${id}, 'empresa', ${id}, ${data.id ? "atualizou" : "criou"}, ${v.name})`;
    return { id };
  });

export const deleteCompany = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireUser();
    const sql = await db();
    await sql`DELETE FROM companies WHERE id = ${data.id}`;
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Projetos                                                            */
/* ------------------------------------------------------------------ */

export interface ProjectInput {
  id?: string | null;
  company_id: string;
  name: string;
  description?: string | null;
  responsible_user_id?: string | null;
  start_date?: string | null;
  deadline?: string | null;
  status: string;
  progress: number;
}

export const saveProject = createServerFn({ method: "POST" })
  .inputValidator((d: ProjectInput) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    const sql = await db();
    const v = {
      company_id: data.company_id,
      name: data.name.trim(),
      description: data.description || null,
      responsible_user_id: data.responsible_user_id || null,
      start_date: data.start_date || null,
      deadline: data.deadline || null,
      status: data.status,
      progress: Math.max(0, Math.min(100, Number(data.progress) || 0)),
    };
    let id = data.id ?? null;
    if (id) {
      await sql`UPDATE projects SET ${sql(v)}, updated_at = now() WHERE id = ${id}`;
    } else {
      const rows = await sql<{ id: string }[]>`INSERT INTO projects ${sql(v)} RETURNING id`;
      id = rows[0]!.id;
    }
    await sql`INSERT INTO activity_logs (user_id, company_id, entity_type, entity_id, action, detail)
              VALUES (${user.id}, ${v.company_id}, 'projeto', ${id}, ${data.id ? "atualizou" : "criou"}, ${v.name})`;
    return { id };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireUser();
    const sql = await db();
    await sql`DELETE FROM projects WHERE id = ${data.id}`;
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Ações                                                               */
/* ------------------------------------------------------------------ */

export interface ActionInput {
  id?: string | null;
  company_id: string;
  project_id?: string | null;
  title: string;
  description?: string | null;
  action_type: string;
  responsible_user_id?: string | null;
  action_date: string;
  all_day: boolean;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
}

export const saveAction = createServerFn({ method: "POST" })
  .inputValidator((d: ActionInput) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    const sql = await db();
    const v = {
      company_id: data.company_id,
      project_id: data.project_id || null,
      title: data.title.trim(),
      description: data.description || null,
      action_type: data.action_type,
      responsible_user_id: data.responsible_user_id || null,
      action_date: data.action_date,
      all_day: data.all_day,
      start_time: data.all_day ? null : data.start_time || null,
      end_time: data.all_day ? null : data.end_time || null,
      status: data.status,
    };
    let id = data.id ?? null;
    if (id) {
      await sql`UPDATE actions SET ${sql(v)}, updated_at = now() WHERE id = ${id}`;
    } else {
      const rows = await sql<{ id: string }[]>`INSERT INTO actions ${sql(v)} RETURNING id`;
      id = rows[0]!.id;
    }
    await sql`INSERT INTO activity_logs (user_id, company_id, entity_type, entity_id, action, detail)
              VALUES (${user.id}, ${v.company_id}, 'acao', ${id}, ${data.id ? "atualizou" : "criou"}, ${v.title})`;
    return { id };
  });

export const deleteAction = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireUser();
    const sql = await db();
    await sql`DELETE FROM actions WHERE id = ${data.id}`;
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Tarefas                                                             */
/* ------------------------------------------------------------------ */

export interface TaskInput {
  id?: string | null;
  company_id: string;
  project_id?: string | null;
  action_id?: string | null;
  title: string;
  description?: string | null;
  responsible_user_id?: string | null;
  due_date?: string | null;
  priority: string;
  status: string;
}

export const saveTask = createServerFn({ method: "POST" })
  .inputValidator((d: TaskInput) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    const sql = await db();
    const v = {
      company_id: data.company_id,
      project_id: data.project_id || null,
      action_id: data.action_id || null,
      title: data.title.trim(),
      description: data.description || null,
      responsible_user_id: data.responsible_user_id || null,
      due_date: data.due_date || null,
      priority: data.priority,
      status: data.status,
    };
    let id = data.id ?? null;
    if (id) {
      await sql`UPDATE tasks SET ${sql(v)}, updated_at = now(),
                  completed_at = CASE WHEN ${v.status} = 'concluida' THEN COALESCE(completed_at, now()) ELSE NULL END
                WHERE id = ${id}`;
    } else {
      const rows = await sql<{ id: string }[]>`
        INSERT INTO tasks ${sql(v)} RETURNING id`;
      id = rows[0]!.id;
      if (v.status === "concluida") {
        await sql`UPDATE tasks SET completed_at = now() WHERE id = ${id}`;
      }
    }
    await sql`INSERT INTO activity_logs (user_id, company_id, entity_type, entity_id, action, detail)
              VALUES (${user.id}, ${v.company_id}, 'tarefa', ${id}, ${data.id ? "atualizou" : "criou"}, ${v.title})`;
    return { id };
  });

export const setTaskStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; status: string }) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    const sql = await db();
    const rows = await sql<{ company_id: string; title: string }[]>`
      UPDATE tasks SET status = ${data.status}, updated_at = now(),
        completed_at = CASE WHEN ${data.status} = 'concluida' THEN now() ELSE NULL END
      WHERE id = ${data.id}
      RETURNING company_id, title`;
    const row = rows[0];
    if (row) {
      await sql`INSERT INTO activity_logs (user_id, company_id, entity_type, entity_id, action, detail)
                VALUES (${user.id}, ${row.company_id}, 'tarefa', ${data.id}, ${data.status}, ${row.title})`;
    }
    return { ok: true };
  });

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    await requireUser();
    const sql = await db();
    await sql`DELETE FROM tasks WHERE id = ${data.id}`;
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Usuários                                                            */
/* ------------------------------------------------------------------ */

export const saveUser = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string | null; name: string; email: string; password?: string | null; global_role: string; active: boolean }) => d)
  .handler(async ({ data }) => {
    const { requireUser, hashPassword } = await import("./auth.server");
    const { db } = await import("./db.server");
    const current = await requireUser();
    if (current.global_role !== "administrador") {
      throw new Error("Apenas administradores podem gerenciar usuários.");
    }
    const sql = await db();
    const email = data.email.trim().toLowerCase();
    if (data.id) {
      await sql`UPDATE users SET name = ${data.name.trim()}, email = ${email},
                  global_role = ${data.global_role}, active = ${data.active}, updated_at = now()
                WHERE id = ${data.id}`;
      if (data.password) {
        const hash = await hashPassword(data.password);
        await sql`UPDATE users SET password_hash = ${hash}, must_change_password = true
                  WHERE id = ${data.id}`;
      }
      return { id: data.id };
    }
    if (!data.password) return { id: null, error: "Senha obrigatória." };
    const hash = await hashPassword(data.password);
    const rows = await sql<{ id: string }[]>`
      INSERT INTO users (name, email, password_hash, global_role, active, must_change_password)
      VALUES (${data.name.trim()}, ${email}, ${hash}, ${data.global_role}, ${data.active}, true)
      RETURNING id`;
    return { id: rows[0]!.id };
  });

/* ------------------------------------------------------------------ */
/* Minha conta                                                         */
/* ------------------------------------------------------------------ */

export const updateOwnProfile = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    const name = data.name.trim();
    if (name.length < 2) return { ok: false as const, error: "Informe seu nome." };
    const sql = await db();
    await sql`UPDATE users SET name = ${name}, updated_at = now() WHERE id = ${user.id}`;
    return { ok: true as const };
  });

export const changeOwnPassword = createServerFn({ method: "POST" })
  .inputValidator((d: { current: string; next: string }) => d)
  .handler(async ({ data }) => {
    const { requireUser, verifyPassword, hashPassword } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    if (data.next.trim().length < 6) {
      return { ok: false as const, error: "A nova senha precisa ter ao menos 6 caracteres." };
    }
    const sql = await db();
    const rows = await sql<{ password_hash: string }[]>`
      SELECT password_hash FROM users WHERE id = ${user.id}`;
    const hash = rows[0]?.password_hash;
    if (!hash || !(await verifyPassword(data.current, hash))) {
      return { ok: false as const, error: "Senha atual incorreta." };
    }
    const next = await hashPassword(data.next.trim());
    await sql`UPDATE users SET password_hash = ${next}, must_change_password = false,
                updated_at = now() WHERE id = ${user.id}`;
    return { ok: true as const };
  });

export const completeOnboarding = createServerFn({ method: "POST" }).handler(async () => {
  const { requireUser } = await import("./auth.server");
  const { db } = await import("./db.server");
  const user = await requireUser();
  const sql = await db();
  await sql`UPDATE users SET onboarding_done = true WHERE id = ${user.id}`;
  return { ok: true };
});

/* ------------------------------------------------------------------ */
/* Dados de demonstração                                               */
/* ------------------------------------------------------------------ */

export const countDemoData = createServerFn({ method: "GET" }).handler(async () => {
  const { requireUser } = await import("./auth.server");
  const { db } = await import("./db.server");
  await requireUser();
  const sql = await db();
  const rows = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count FROM companies WHERE is_demo = true`;
  return { companies: Number(rows[0]?.count ?? 0) };
});

export const clearDemoData = createServerFn({ method: "POST" }).handler(async () => {
  const { requireUser } = await import("./auth.server");
  const { db } = await import("./db.server");
  const user = await requireUser();
  if (user.global_role !== "administrador") {
    throw new Error("Apenas administradores podem limpar os dados de exemplo.");
  }
  const sql = await db();
  const rows = await sql<{ id: string }[]>`
    DELETE FROM companies WHERE is_demo = true RETURNING id`;
  await sql`DELETE FROM activity_logs WHERE company_id IS NULL AND entity_type = 'sistema'`;
  return { removed: rows.length };
});
