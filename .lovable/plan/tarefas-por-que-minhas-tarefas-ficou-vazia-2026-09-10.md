# Tarefas: por que "Minhas tarefas" ficou vazia

## O que está acontecendo (confirmado no código)

Na tela de nova tarefa, o campo **Responsável** começa em "Ninguém". Se ninguém for escolhido, a tarefa é salva sem dono.

A aba **Minhas tarefas** mostra só as tarefas cujo responsável é você. Como a tarefa de teste ficou sem responsável, ela aparece em "Todas" mas não em "Minhas tarefas". Não é erro de vínculo com a empresa.

## Sobre empresa, projeto e ação

Hoje: **empresa é obrigatória**, projeto e ação são opcionais. Isso está correto e vamos manter — a empresa é o que garante que cada gestor veja apenas o trabalho dele.

## Melhorias de usabilidade propostas

1. **Responsável já vem preenchido com você** ao criar uma tarefa nova (dá para trocar ou deixar sem responsável). O mesmo para novas ações.
2. **Empresa já vem selecionada** quando o usuário só tem uma empresa vinculada — um clique a menos no caso mais comum.
3. **A lista de responsáveis mostra só quem faz sentido**: você e as pessoas ligadas às mesmas empresas, em vez de todos os usuários do sistema.
4. **Aviso amigável na aba "Minhas tarefas"** quando estiver vazia mas existirem tarefas sem responsável: "X tarefa(s) sem responsável — veja em Todas", com atalho para a aba Todas.
5. **Rótulo mais claro** no campo: "Responsável (fica em Minhas tarefas)".

## Detalhes técnicos

- `src/components/app/forms.tsx`:
  - `TaskSheet` e `ActionSheet`: estado inicial de `responsible_user_id` passa a ser o usuário logado quando é criação (`!task` / `!action`); manter valor existente na edição.
  - Empresa inicial: quando não há prefill e `data.companies.length === 1`, pré-selecionar essa empresa.
  - Lista de responsáveis: filtrar `data.users` pelos `companyUsers` das empresas visíveis, sempre incluindo o usuário atual e administradores.
  - Precisa do usuário logado dentro do provider — expor via contexto do shell (`Route.useRouteContext()` em `_shell.tsx`) passando `currentUserId` para `FormsProvider`, ou ler de um hook existente.
- `src/routes/_shell/tarefas.tsx`: no estado vazio da aba "minhas", contar tarefas abertas com `responsible_user_id === null` e renderizar a dica com botão que muda `quick` para "todas".
- Sem mudanças de banco, de escopo por empresa ou de regras de permissão.
