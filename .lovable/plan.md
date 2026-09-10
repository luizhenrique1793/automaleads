# Compromissos que se repetem — dentro da tela "Ações"

Sem tela nova. A repetição entra no formulário de ação que já existe, e a tela "Ações" ganha um filtro. Isso serve qualquer nicho: atendimento semanal de psicologia, treinamento de 8 semanas, reunião mensal de contabilidade, manutenção quinzenal.

## 1. No formulário de ação (criar)

Abaixo de data e horário aparece uma linha discreta: **"Repetir este compromisso"** (desligada por padrão — quem não usa nem percebe).

Ao ligar, aparecem três campos simples:

- **Frequência**: toda semana · a cada 15 dias · todo mês
- **Quantas vezes**: número de encontros (ex.: 8) — ou "até a data" com um calendário
- Um resumo em texto: "8 encontros, toda terça, de 15/09 a 03/11"

Ao salvar, o sistema cria todos os compromissos de uma vez. Eles são ações normais e aparecem na agenda de sempre: Início, Minha semana, Calendário, Ações e página da empresa. Cada um mostra uma marca discreta "3 de 8".

Limite de segurança: no máximo 60 encontros por série.

## 2. Ao abrir um compromisso que faz parte de uma repetição

No topo do formulário aparece uma faixa: "Faz parte de uma repetição — 3 de 8".

Ao salvar uma alteração, o sistema pergunta:

- **Só este dia** (padrão) — muda apenas o compromisso aberto
- **Este e os próximos** — aplica horário/título/responsável do dia aberto em diante

Ao excluir, a mesma pergunta: só este, ou este e os próximos. Nada apaga o que já passou.

## 3. Na tela "Ações"

- Novo filtro rápido: **"Repetidos"**, para ver só o que faz parte de séries.
- Nos itens de uma série, a marca "3 de 8" ao lado do título.
- No compromisso aberto, botão **"Adicionar mais encontros"**, que estende a série (ex.: de 8 para 12) mantendo dia e horário.

## Cuidados para não quebrar nada

- Os compromissos gerados são ações comuns; a repetição é só uma etiqueta que liga um grupo delas. Se a etiqueta for ignorada, o sistema funciona exatamente como hoje.
- Nenhuma mudança em permissões: tudo continua limitado às empresas da pessoa, e cliente segue somente leitura no portal.
- Nenhuma tela existente muda de comportamento; o campo de repetição vem desligado.
- Vale para todos os tipos de ação (reunião, treinamento, palestra, atendimento, entrega), sem nada específico de um nicho.

## Detalhes técnicos

- Banco, tudo aditivo no padrão já usado em `src/lib/db.server.ts` (`CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`): tabela leve `action_series` (empresa, frequência, data início, total de encontros, criador) e colunas `series_id uuid REFERENCES action_series(id) ON DELETE SET NULL` + `series_index int` em `actions`. Nada existente é removido ou alterado.
- `saveAction` ganha campos opcionais `repeat` (`frequencia`, `ocorrencias` ou `ate`) e, na edição, `scope` (`"um" | "futuros"`). Sem esses campos o comportamento é idêntico ao atual.
- Novas funções `extendActionSeries` e `deleteActionSeries` (escopo "este e os próximos"), todas com `requireUser`, bloqueio de perfil cliente e `allowedCompanyIds` + `assertCompanyAccess`, iguais às demais.
- Datas geradas no servidor com os helpers de `src/lib/format.ts` (fuso de São Paulo), inserção em lote e registro em `activity_logs`.
- `getWorkspace` passa a devolver `series`; `Workspace` em `src/lib/types.ts` e o fallback vazio de `src/lib/workspace.ts` acompanham.
- Front: bloco de repetição e diálogo de escopo dentro de `ActionSheet` em `src/components/app/forms.tsx`; filtro "Repetidos" em `src/components/app/Filters.tsx` / `src/routes/_shell/acoes.index.tsx`; marca "3 de 8" em `ActionCard`.
- Roadmap: registrar "compromissos recorrentes" como próxima entrega em `roadmap.md` na implementação.

## Fora do escopo

Lembretes automáticos, WhatsApp, n8n, Google Calendar, pular feriados automaticamente e séries com vários dias da semana (ex.: terças e quintas juntas).
