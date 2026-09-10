# Atendimentos e treinamentos recorrentes

## O que existe hoje

Cada compromisso é cadastrado um por um em "Ações": empresa, tipo (atendimento, reunião, treinamento, palestra), data, horário e responsável. Um treinamento de 8 semanas exige 8 cadastros manuais.

## O que vai ser criado

Uma tela nova, **Recorrentes**, no menu lateral (mesma área do sistema, sem menu de administração para quem não é administrador). Nela a profissional cadastra uma série:

- Empresa (obrigatória) e projeto (opcional)
- Título, por exemplo "Treinamento de liderança"
- Tipo (atendimento, treinamento, reunião, palestra…)
- Responsável (já vem ela mesma)
- Data de início e horário de início/fim
- Frequência: toda semana, a cada 15 dias, ou todo mês
- Duração: número de encontros (ex.: 8) **ou** data final

Ao salvar, o sistema **cria os compromissos de uma vez** e eles aparecem normalmente na agenda: Início, Minha semana, Calendário, Ações e na página da empresa. Cada encontro mostra "3 de 8" no título da lista da série.

### Depois de criada

Na tela Recorrentes cada série aparece como um cartão com empresa, frequência, período, quantos encontros já aconteceram e quantos faltam, mais:

- **Ver encontros** — lista com data e horário de cada um, com status.
- **Cancelar um dia** — cancela só aquele encontro, sem afetar os outros (usa o cancelamento que já existe nas ações).
- **Adicionar mais encontros** — estende a série (ex.: de 8 para 12), criando só os novos.
- **Encerrar série** — para de gerar novos; os já criados continuam na agenda.
- **Excluir série** — pergunta antes e apaga apenas os encontros futuros ainda não realizados.

Editar um encontro específico (mudar horário de um dia) continua funcionando como hoje, sem mexer nos outros.

## Cuidados para não quebrar nada

- Os compromissos gerados são **ações normais**, do mesmo tipo que já existe. Nada muda em quem vê o quê: continuam limitados às empresas da pessoa, e cliente segue somente leitura no portal.
- A série é apenas uma "etiqueta" ligando as ações; se ela for ignorada, o sistema funciona exatamente como hoje.
- Limite de segurança: no máximo 60 encontros por série, para evitar criação acidental em massa.
- Nenhuma tela existente muda de comportamento; só ganham os compromissos gerados.

## Detalhes técnicos

- Banco: nova tabela `action_series` (empresa, projeto, título, tipo, responsável, data início, frequência, horários, total de encontros, status) e coluna aditiva `series_id uuid` + `series_index int` em `actions`, criadas no mesmo padrão `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` de `src/lib/db.server.ts`. Nada é removido nem alterado no que já existe.
- Server functions em `src/lib/api.functions.ts`: `saveActionSeries`, `extendActionSeries`, `endActionSeries`, `deleteActionSeries`. Todas passam por `requireUser`, bloqueiam perfil cliente e usam `allowedCompanyIds` + `assertCompanyAccess`, igual às demais.
- Geração das datas no servidor com os helpers de `src/lib/format.ts` (fuso de São Paulo), inserindo as ações em lote e registrando em `activity_logs`.
- `getWorkspace` passa a devolver também `series` (já filtrado por empresa permitida); `Workspace` em `src/lib/types.ts` ganha o campo, com valor vazio no fallback de `src/lib/workspace.ts`.
- Nova rota `src/routes/_shell/recorrentes.tsx` + item no `NAV` de `src/routes/_shell.tsx`, reaproveitando `PageHeader`, `EmptyState`, `CompanyDot` e o padrão de formulário em painel lateral já usado em `forms.tsx`.
- Exclusão de série usa `ON DELETE SET NULL` no `series_id`, então apagar a série nunca apaga histórico por acidente.

## Fora do escopo

Lembretes automáticos, WhatsApp, n8n, Google Calendar, exceções complexas (pular feriados automaticamente) e recorrência por dia da semana múltiplo (ex.: terças e quintas na mesma série).
