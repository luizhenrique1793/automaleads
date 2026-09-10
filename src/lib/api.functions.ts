import { createServerFn } from "@tanstack/react-start";
import type {
  Action,
  ActionSeries,
  ActivityLog,
  ClientPortal,
  Company,
  CompanyUser,
  Project,
  Task,
  User,
  Workspace,
} from "./types";

/** Próxima data da série, contando `step` repetições a partir de `iso`. */
function seriesDate(iso: string, frequency: string, step: number): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  if (frequency === "mensal") {
    const base = new Date(Date.UTC(y, m - 1 + step, 1));
    const lastDay = new Date(
      Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0),
    ).getUTCDate();
    base.setUTCDate(Math.min(d, lastDay));
    return base.toISOString().slice(0, 10);
  }
  const days = frequency === "quinzenal" ? 14 : 7;
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days * step);
  return dt.toISOString().slice(0, 10);
}

const MAX_SERIES = 60;

function seriesDates(
  start: string,
  frequency: string,
  opts: { occurrences?: number | null; until?: string | null },
): string[] {
  const dates = [start];
  if (opts.until) {
    for (let i = 1; i < MAX_SERIES; i++) {
      const next = seriesDate(start, frequency, i);
      if (next > opts.until) break;
      dates.push(next);
    }
    return dates;
  }
  const total = Math.min(Math.max(opts.occurrences ?? 1, 1), MAX_SERIES);
  for (let i = 1; i < total; i++) dates.push(seriesDate(start, frequency, i));
  return dates;
}

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
/* Escopo por empresa                                                  */
/* ------------------------------------------------------------------ */

type Sql = Awaited<ReturnType<typeof import("./db.server").db>>;

/**
 * Empresas que o usuário pode ver.
 * null = sem restrição (somente administrador).
 * Qualquer outro perfil vê apenas as empresas vinculadas a ele.
 */
async function allowedCompanyIds(
  sql: Sql,
  user: { id: string; global_role: string },
): Promise<string[] | null> {
  if (user.global_role === "administrador") return null;
  const rows = await sql<{ company_id: string }[]>`
    SELECT company_id FROM company_users WHERE user_id = ${user.id}`;
  return rows.map((r) => r.company_id);
}

function assertCompanyAccess(allowed: string[] | null, companyId: string | null) {
  if (!allowed) return;
  if (!companyId || !allowed.includes(companyId)) {
    throw new Error("SEM_ACESSO_EMPRESA");
  }
}

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
    const allowed = await allowedCompanyIds(sql, me);
    const filter = allowed ? sql`WHERE company_id = ANY(${allowed})` : sql``;
    const companyFilter = allowed ? sql`WHERE id = ANY(${allowed})` : sql``;

    const [users, companies, projects, actions, tasks, logs, companyUsers, series] =
      await Promise.all([
      sql<User[]>`SELECT id, name, email, global_role, active FROM users ORDER BY name`,
      sql<Company[]>`SELECT id, name, logo_url, color, contact_name, phone, email, notes, status,
                       is_demo
                     FROM companies ${companyFilter} ORDER BY name`,
      sql<Project[]>`SELECT id, company_id, name, description, responsible_user_id,
                       to_char(start_date,'YYYY-MM-DD') AS start_date,
                       to_char(deadline,'YYYY-MM-DD') AS deadline,
                       status, progress
                      FROM projects ${filter} ORDER BY created_at DESC`,
      sql<Action[]>`SELECT id, company_id, project_id, title, description, action_type,
                      responsible_user_id,
                      to_char(action_date,'YYYY-MM-DD') AS action_date,
                      all_day,
                      to_char(start_time,'HH24:MI') AS start_time,
                      to_char(end_time,'HH24:MI') AS end_time,
                      status, series_id, series_index
                    FROM actions ${filter} ORDER BY action_date, start_time NULLS FIRST`,
      sql<Task[]>`SELECT id, company_id, project_id, action_id, title, description,
                    responsible_user_id,
                    to_char(due_date,'YYYY-MM-DD') AS due_date,
                    priority, status,
                    to_char(completed_at,'YYYY-MM-DD"T"HH24:MI:SS') AS completed_at,
                    to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
                  FROM tasks ${filter} ORDER BY due_date NULLS LAST, created_at DESC`,
      sql<ActivityLog[]>`SELECT id, user_id, company_id, entity_type, entity_id, action, detail,
                           to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS') AS created_at
                         FROM activity_logs ${filter} ORDER BY created_at DESC LIMIT 40`,
      sql<CompanyUser[]>`SELECT company_id, user_id, role FROM company_users`,
      sql<ActionSeries[]>`SELECT id, company_id, frequency,
                            to_char(start_date,'YYYY-MM-DD') AS start_date, occurrences
                          FROM action_series ${filter} ORDER BY created_at DESC`,
    ]);

    return { users, companies, projects, actions, tasks, logs, companyUsers, series };
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
    if (user.global_role === "cliente") throw new Error("ACESSO_RESTRITO");
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    if (data.id) assertCompanyAccess(allowed, data.id);
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
      if (allowed) {
        // Quem não é administrador passa a gerenciar a empresa que acabou de criar.
        await sql`INSERT INTO company_users (company_id, user_id, role)
                  VALUES (${id}, ${user.id}, ${user.global_role})
                  ON CONFLICT (company_id, user_id) DO UPDATE SET role = EXCLUDED.role`;
      }
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
    const user = await requireUser();
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    assertCompanyAccess(allowed, data.id);
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
    if (user.global_role === "cliente") throw new Error("ACESSO_RESTRITO");
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    assertCompanyAccess(allowed, data.company_id);
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
    const user = await requireUser();
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    const owner = await sql<{ company_id: string }[]>`SELECT company_id FROM projects WHERE id = ${data.id}`;
    assertCompanyAccess(allowed, owner[0]?.company_id ?? null);
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
  /** Só na criação: gera vários compromissos de uma vez. */
  repeat?: { frequency: string; occurrences?: number | null; until?: string | null } | null | undefined;
  /** Só na edição de um compromisso de série. */
  scope?: "um" | "futuros" | undefined;
}

export const saveAction = createServerFn({ method: "POST" })
  .inputValidator((d: ActionInput) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    if (user.global_role === "cliente") throw new Error("ACESSO_RESTRITO");
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    assertCompanyAccess(allowed, data.company_id);
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
    let created = 1;

    if (!id && data.repeat) {
      const frequency = data.repeat.frequency;
      const dates = seriesDates(data.action_date, frequency, {
        occurrences: data.repeat.occurrences ?? null,
        until: data.repeat.until ?? null,
      });
      const seriesRows = await sql<{ id: string }[]>`
        INSERT INTO action_series (company_id, frequency, start_date, occurrences, created_by)
        VALUES (${v.company_id}, ${frequency}, ${data.action_date}, ${dates.length}, ${user.id})
        RETURNING id`;
      const seriesId = seriesRows[0]!.id;
      const rows = await sql<{ id: string }[]>`
        INSERT INTO actions ${sql(
          dates.map((d, i) => ({ ...v, action_date: d, series_id: seriesId, series_index: i + 1 })),
        )} RETURNING id`;
      id = rows[0]!.id;
      created = dates.length;
    } else if (id) {
      await sql`UPDATE actions SET ${sql(v)}, updated_at = now() WHERE id = ${id}`;
      if (data.scope === "futuros") {
        const cur = await sql<{ series_id: string | null; series_index: number | null }[]>`
          SELECT series_id, series_index FROM actions WHERE id = ${id}`;
        const s = cur[0];
        if (s?.series_id) {
          const later = {
            title: v.title,
            description: v.description,
            action_type: v.action_type,
            responsible_user_id: v.responsible_user_id,
            all_day: v.all_day,
            start_time: v.start_time,
            end_time: v.end_time,
            project_id: v.project_id,
          };
          await sql`UPDATE actions SET ${sql(later)}, updated_at = now()
                    WHERE series_id = ${s.series_id} AND series_index > ${s.series_index ?? 0}`;
        }
      }
    } else {
      const rows = await sql<{ id: string }[]>`INSERT INTO actions ${sql(v)} RETURNING id`;
      id = rows[0]!.id;
    }

    await sql`INSERT INTO activity_logs (user_id, company_id, entity_type, entity_id, action, detail)
              VALUES (${user.id}, ${v.company_id}, 'acao', ${id}, ${data.id ? "atualizou" : "criou"}, ${v.title})`;
    return { id, created };
  });

/** Acrescenta encontros ao final de uma série existente. */
export const extendActionSeries = createServerFn({ method: "POST" })
  .inputValidator((d: { action_id: string; extra: number }) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    if (user.global_role === "cliente") throw new Error("ACESSO_RESTRITO");
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    const base = await sql<
      {
        series_id: string | null;
        company_id: string;
        project_id: string | null;
        title: string;
        description: string | null;
        action_type: string;
        responsible_user_id: string | null;
        all_day: boolean;
        start_time: string | null;
        end_time: string | null;
      }[]
    >`SELECT series_id, company_id, project_id, title, description, action_type,
        responsible_user_id, all_day,
        to_char(start_time,'HH24:MI') AS start_time,
        to_char(end_time,'HH24:MI') AS end_time
      FROM actions WHERE id = ${data.action_id}`;
    const row = base[0];
    if (!row?.series_id) throw new Error("SEM_SERIE");
    assertCompanyAccess(allowed, row.company_id);

    const info = await sql<{ frequency: string; total: number; last_date: string; last_index: number }[]>`
      SELECT s.frequency,
             count(a.id)::int AS total,
             to_char(max(a.action_date),'YYYY-MM-DD') AS last_date,
             max(a.series_index)::int AS last_index
      FROM action_series s JOIN actions a ON a.series_id = s.id
      WHERE s.id = ${row.series_id}
      GROUP BY s.frequency`;
    const meta = info[0];
    if (!meta) throw new Error("SEM_SERIE");

    const extra = Math.max(1, Math.min(data.extra, MAX_SERIES - meta.total));
    if (extra <= 0) return { created: 0 };

    const values = Array.from({ length: extra }, (_, i) => ({
      company_id: row.company_id,
      project_id: row.project_id,
      title: row.title,
      description: row.description,
      action_type: row.action_type,
      responsible_user_id: row.responsible_user_id,
      action_date: seriesDate(meta.last_date, meta.frequency, i + 1),
      all_day: row.all_day,
      start_time: row.all_day ? null : row.start_time,
      end_time: row.all_day ? null : row.end_time,
      status: "planejada",
      series_id: row.series_id,
      series_index: meta.last_index + i + 1,
    }));
    await sql`INSERT INTO actions ${sql(values)}`;
    await sql`UPDATE action_series SET occurrences = ${meta.total + extra} WHERE id = ${row.series_id}`;
    await sql`INSERT INTO activity_logs (user_id, company_id, entity_type, entity_id, action, detail)
              VALUES (${user.id}, ${row.company_id}, 'acao', ${data.action_id}, 'estendeu série', ${row.title})`;
    return { created: extra };
  });

export const deleteAction = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; scope?: "um" | "futuros" | undefined }) => d)
  .handler(async ({ data }) => {
    const { requireUser } = await import("./auth.server");
    const { db } = await import("./db.server");
    const user = await requireUser();
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    const owner = await sql<
      { company_id: string; series_id: string | null; series_index: number | null }[]
    >`SELECT company_id, series_id, series_index FROM actions WHERE id = ${data.id}`;
    const row = owner[0];
    assertCompanyAccess(allowed, row?.company_id ?? null);
    if (data.scope === "futuros" && row?.series_id) {
      await sql`DELETE FROM actions
                WHERE series_id = ${row.series_id} AND series_index >= ${row.series_index ?? 0}`;
      return { ok: true };
    }
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
    if (user.global_role === "cliente") throw new Error("ACESSO_RESTRITO");
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    assertCompanyAccess(allowed, data.company_id);
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
    const allowed = await allowedCompanyIds(sql, user);
    const cur = await sql<{ company_id: string }[]>`SELECT company_id FROM tasks WHERE id = ${data.id}`;
    assertCompanyAccess(allowed, cur[0]?.company_id ?? null);
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
    const user = await requireUser();
    const sql = await db();
    const allowed = await allowedCompanyIds(sql, user);
    const owner = await sql<{ company_id: string }[]>`SELECT company_id FROM tasks WHERE id = ${data.id}`;
    assertCompanyAccess(allowed, owner[0]?.company_id ?? null);
    await sql`DELETE FROM tasks WHERE id = ${data.id}`;
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Usuários                                                            */
/* ------------------------------------------------------------------ */

export const saveUser = createServerFn({ method: "POST" })
  .inputValidator((d: { id?: string | null; name: string; email: string; password?: string | null; global_role: string; active: boolean; company_ids?: string[] }) => d)
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
      await syncCompanies(sql, data.id, data.company_ids, data.global_role);
      return { id: data.id };
    }
    if (!data.password) return { id: null, error: "Senha obrigatória." };
    const hash = await hashPassword(data.password);
    const rows = await sql<{ id: string }[]>`
      INSERT INTO users (name, email, password_hash, global_role, active, must_change_password)
      VALUES (${data.name.trim()}, ${email}, ${hash}, ${data.global_role}, ${data.active}, true)
      RETURNING id`;
    const id = rows[0]!.id;
    await syncCompanies(sql, id, data.company_ids, data.global_role);
    return { id };
  });

/** Substitui os vínculos de empresa de um usuário (portal de cliente e escopo da equipe). */
async function syncCompanies(
  sql: Awaited<ReturnType<typeof import("./db.server").db>>,
  userId: string,
  companyIds: string[] | undefined,
  role: string,
) {
  if (!companyIds) return;
  await sql`DELETE FROM company_users WHERE user_id = ${userId}`;
  for (const companyId of companyIds) {
    await sql`INSERT INTO company_users (company_id, user_id, role)
              VALUES (${companyId}, ${userId}, ${role})
              ON CONFLICT (company_id, user_id) DO UPDATE SET role = ${role}`;
  }
}

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
