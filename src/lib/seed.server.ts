import { db } from "./db.server";
import { hashPassword } from "./auth.server";

export const DEFAULT_ADMIN_EMAIL = "admin@automa.com";
export const DEFAULT_ADMIN_PASSWORD = "automa123";

/**
 * Cria o usuário administrador inicial e um conjunto enxuto de dados de
 * demonstração, apenas quando o banco ainda está vazio.
 */
export async function ensureSeed() {
  const sql = await db();

  const [{ count }] = await sql<{ count: string }[]>`SELECT count(*)::text AS count FROM users`;
  if (Number(count) > 0) return;

  const adminHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const memberHash = await hashPassword("automa123");

  const [admin] = await sql<{ id: string }[]>`
    INSERT INTO users (name, email, password_hash, global_role)
    VALUES ('Administrador', ${DEFAULT_ADMIN_EMAIL}, ${adminHash}, 'administrador')
    RETURNING id
  `;
  const [member] = await sql<{ id: string }[]>`
    INSERT INTO users (name, email, password_hash, global_role)
    VALUES ('Adriana', 'adriana@automa.com', ${memberHash}, 'colaborador')
    RETURNING id
  `;

  const adminId = admin!.id;
  const memberId = member!.id;

  const companies = await sql<{ id: string; name: string }[]>`
    INSERT INTO companies (name, color, contact_name, phone, email, notes, status)
    VALUES
      ('Parque Pôr do Sol', '#e0651a', 'Marcelo', '(48) 99999-0001', 'contato@parquepordosol.com', 'Cliente de eventos e agente de IA.', 'ativa'),
      ('NP Yachts', '#0f7b8a', 'Natália', '(48) 99999-0002', 'contato@npyachts.com', 'Site institucional e tráfego.', 'ativa'),
      ('Apoio Contábil', '#5b53c9', 'Rogério', '(48) 99999-0003', 'contato@apoiocontabil.com', NULL, 'ativa')
    RETURNING id, name
  `;
  const byName = (n: string) => companies.find((c) => c.name === n)!.id;
  const parque = byName("Parque Pôr do Sol");
  const yachts = byName("NP Yachts");
  const apoio = byName("Apoio Contábil");

  for (const companyId of [parque, yachts, apoio]) {
    await sql`INSERT INTO company_users (company_id, user_id, role) VALUES (${companyId}, ${adminId}, 'administrador') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO company_users (company_id, user_id, role) VALUES (${companyId}, ${memberId}, 'colaborador') ON CONFLICT DO NOTHING`;
  }

  const projects = await sql<{ id: string; name: string }[]>`
    INSERT INTO projects (company_id, name, description, responsible_user_id, start_date, deadline, status, progress)
    VALUES
      (${parque}, 'Agente de IA', 'Atendimento automatizado no WhatsApp.', ${adminId}, CURRENT_DATE - 20, CURRENT_DATE + 25, 'em_andamento', 45),
      (${yachts}, 'Site institucional', 'Novo site com versão mobile.', ${memberId}, CURRENT_DATE - 40, CURRENT_DATE + 10, 'em_andamento', 70),
      (${apoio}, 'Campanha Setembro', 'Campanha de captação mensal.', ${memberId}, CURRENT_DATE - 5, CURRENT_DATE + 30, 'planejamento', 10)
    RETURNING id, name
  `;
  const pIA = projects.find((p) => p.name === "Agente de IA")!.id;
  const pSite = projects.find((p) => p.name === "Site institucional")!.id;
  const pCamp = projects.find((p) => p.name === "Campanha Setembro")!.id;

  const actions = await sql<{ id: string; title: string }[]>`
    INSERT INTO actions (company_id, project_id, title, description, action_type, responsible_user_id, action_date, all_day, start_time, end_time, status)
    VALUES
      (${parque}, ${pIA}, 'Reunião de validação', 'Validar fluxo do agente com o cliente.', 'reuniao', ${adminId}, CURRENT_DATE + 1, false, '14:00', '15:00', 'planejada'),
      (${yachts}, ${pSite}, 'Entrega da versão mobile', NULL, 'entrega', ${memberId}, CURRENT_DATE + 3, true, NULL, NULL, 'planejada'),
      (${apoio}, ${pCamp}, 'Treinamento da equipe', 'Treinamento de uso do painel.', 'treinamento', ${memberId}, CURRENT_DATE + 2, false, '09:30', '11:00', 'planejada'),
      (${parque}, NULL, 'Visita ao parque', NULL, 'visita', ${adminId}, CURRENT_DATE - 2, false, '10:00', '12:00', 'realizada')
    RETURNING id, title
  `;
  const aReuniao = actions.find((a) => a.title === "Reunião de validação")!.id;

  await sql`
    INSERT INTO tasks (company_id, project_id, action_id, title, description, responsible_user_id, due_date, priority, status, completed_at)
    VALUES
      (${parque}, ${pIA}, ${aReuniao}, 'Preparar relatório de atendimento', 'Consolidar métricas da última semana.', ${adminId}, CURRENT_DATE, 'alta', 'em_andamento', NULL),
      (${parque}, ${pIA}, ${aReuniao}, 'Separar pontos pendentes', NULL, ${memberId}, CURRENT_DATE, 'normal', 'a_fazer', NULL),
      (${parque}, ${pIA}, NULL, 'Configurar agente de IA', NULL, ${adminId}, CURRENT_DATE + 5, 'normal', 'a_fazer', NULL),
      (${yachts}, ${pSite}, NULL, 'Corrigir versão mobile do site', 'Ajustar menu e formulários.', ${memberId}, CURRENT_DATE - 3, 'urgente', 'a_fazer', NULL),
      (${yachts}, ${pSite}, NULL, 'Solicitar fotos ao cliente', NULL, ${memberId}, CURRENT_DATE + 2, 'normal', 'aguardando_cliente', NULL),
      (${apoio}, ${pCamp}, NULL, 'Criar arte do Instagram', NULL, ${memberId}, CURRENT_DATE + 1, 'alta', 'a_fazer', NULL),
      (${apoio}, NULL, NULL, 'Enviar orçamento', NULL, ${adminId}, CURRENT_DATE + 4, 'normal', 'a_fazer', NULL),
      (${parque}, NULL, NULL, 'Revisar checkout', NULL, ${adminId}, CURRENT_DATE - 1, 'normal', 'concluida', now())
  `;

  await sql`
    INSERT INTO activity_logs (user_id, company_id, entity_type, entity_id, action, detail)
    VALUES (${adminId}, NULL, 'sistema', NULL, 'seed', 'Dados iniciais criados')
  `;
}
