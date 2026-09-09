# Painel do Portal do cliente + acesso da profissional

## O que já existe

- **Portal do cliente** (`/portal`): tela própria, sem menu de administração, com duas abas — Tarefas (em aberto / concluídas) e Ações (próximas / anteriores). Só leitura, limitado às empresas vinculadas ao acesso.
- **Sistema completo** (Início, Minha semana, Calendário, Empresas, Projetos, Tarefas, Ações): já tem painel inicial e agenda semanal, hoje visíveis para qualquer pessoa da equipe.
- Ainda **não existe** painel de resumo dentro do portal: quem entra cai direto na lista de tarefas.

## 1. Novo painel no Portal do cliente

Vira a primeira aba do portal ("Painel"), acima das abas Tarefas e Ações, sem nenhuma barra lateral de administração.

- **Faixa de números**: Atrasadas · Vencem hoje · Ações de hoje · Em andamento. Cada número leva para a lista correspondente.
- **Atrasadas** — lista curta em destaque vermelho (só aparece quando houver), com título, empresa e há quantos dias passou.
- **Ações de hoje** — compromissos do dia com horário, tipo (reunião, palestra, atendimento…) e empresa.
- **Próximos prazos** — tarefas com prazo nos próximos 14 dias, agrupadas por dia, no máximo 8 itens, com link "ver todas".
- **Tarefas em andamento** — o que está em execução ou aguardando retorno, no máximo 6 itens.
- **Próximos 7 dias** — faixa horizontal e compacta: um bloco por dia com a data, quantas ações e quantas tarefas vencem. Clicar no dia filtra a aba Ações naquele dia.

Blocos vazios mostram uma frase curta ("Nada previsto para hoje"), nunca uma caixa quebrada. No celular tudo empilha em uma coluna e a faixa dos 7 dias rola na horizontal.

## 2. Acesso da psicóloga (profissional da equipe)

Como ela faz parte da equipe e atende várias empresas, o lugar dela é o sistema completo, não o portal de cliente. Para não misturar a agenda dela com a dos colegas:

- Ao criar/editar um usuário com perfil **Gestor** ou **Colaborador**, o administrador pode marcar quais empresas essa pessoa atende (mesma lista de marcação já usada para Cliente).
- Quando houver empresas marcadas, ela passa a ver **apenas** essas empresas em Início, Minha semana, Calendário, Empresas, Projetos, Tarefas e Ações — e só pode criar/editar dentro delas. Sem empresas marcadas, o comportamento continua o de hoje (vê tudo).
- O filtro é aplicado no servidor, não apenas escondendo itens na tela.
- "Minha semana" continua sendo a agenda pessoal dela: dia a dia com atendimentos, palestras e prazos.
- Administrador continua enxergando tudo.

## Detalhes técnicos

- `getClientPortal` passa a devolver também os agregados do painel (contagens e recortes por data), calculados no servidor com o fuso de São Paulo, evitando recontagem no navegador.
- Novo componente de painel dentro de `src/routes/portal.tsx`, reaproveitando as funções de data de `src/lib/format.ts`; abas controladas por estado e por parâmetro de URL (`?aba=painel|tarefas|acoes&dia=AAAA-MM-DD`) para os links internos funcionarem.
- Escopo por empresa: helper de servidor que resolve as empresas permitidas a partir de `company_users` conforme o perfil, aplicado em `getWorkspace` e nas funções de gravação/exclusão de empresa, projeto, ação e tarefa.
- `saveUser` já sincroniza `company_users`; a tela de Usuários passa a exibir a lista de empresas também para Gestor e Colaborador.
- Sem novas tabelas; sem alterações no login.

## Fora do escopo

WhatsApp, n8n, lembretes automáticos, Google Calendar, IA, PDF e recorrência.
