# Deixar o sistema pronto para uso real hoje + guia para usuário leigo

Objetivo: sair do estado "demonstração" e permitir que a equipe comece a usar de verdade ainda hoje, com um guia simples dentro do próprio sistema.

## 1. Preparar para uso real

- **Senha inicial exposta**: a tela de entrada mostra o e-mail e a senha padrão. Remover esse aviso e obrigar a troca de senha no primeiro acesso.
- **Trocar minha senha**: hoje só existe a tela de Usuários. Adicionar uma opção "Minha conta" no menu lateral para o próprio usuário alterar nome e senha.
- **Limpar os dados de exemplo**: as empresas, projetos, tarefas e ações de demonstração continuam no banco. Criar, dentro de Usuários/Configurações, um botão "Limpar dados de exemplo" que apaga só o conteúdo de demonstração, mantendo as contas.
- **Confirmação ao excluir**: hoje empresa, projeto, tarefa e ação são excluídos direto. Adicionar uma confirmação antes de apagar, avisando o que será perdido junto (por exemplo, apagar uma empresa apaga seus projetos e tarefas).
- **Restringir Usuários ao administrador**: qualquer pessoa logada consegue criar e editar usuários. Passar a permitir apenas para o perfil administrador, escondendo o menu para os demais.
- **"Minhas tarefas"** já filtra por responsável; deixar esse filtro como padrão na abertura da página de Tarefas, para cada pessoa ver o que é dela primeiro.

## 2. Guia prático dentro do sistema

- **Boas-vindas no primeiro acesso**: uma janela curta em 4 passos — 1) cadastre suas empresas, 2) crie projetos, 3) registre ações (reuniões, treinamentos, entregas), 4) crie tarefas com prazo e responsável. Botão "Começar" leva direto para Empresas.
- **Página "Ajuda"** no menu lateral, em linguagem simples, com:
  - o que é Empresa, Projeto, Ação e Tarefa, com exemplos reais;
  - a diferença entre Ação (compromisso com data/hora) e Tarefa (trabalho com prazo);
  - como usar Início, Minha semana e Calendário no dia a dia;
  - como marcar tarefa concluída e o que significa "atrasada" e "aguardando cliente";
  - perguntas frequentes curtas.
- **Dicas contextuais**: em cada tela vazia, uma frase explicando o que fazer ali e um botão de criar (por exemplo, "Nenhuma tarefa ainda — crie a primeira").
- **Botão de ajuda fixo** no topo, ao lado de "Criar", abrindo a página de Ajuda.

## Detalhes técnicos

- Novas rotas `/_shell/ajuda` e `/_shell/conta`; item de menu e botão de ajuda no `_shell.tsx`.
- Novas server functions: `changeOwnPassword`, `updateOwnProfile`, `clearDemoData` (apaga apenas os registros de demonstração), todas com `requireUser()`.
- `saveUser` e a rota de Usuários passam a exigir `global_role = 'administrador'`.
- Campo `must_change_password` em `users` (schema inline em `db.server.ts`), definido para novos usuários criados por administrador.
- Confirmação de exclusão com `AlertDialog` do shadcn nos formulários em `forms.tsx`.
- Estado do onboarding guardado por usuário no banco (coluna `onboarding_done`), não em armazenamento local.

## Fora deste escopo

WhatsApp, n8n, lembretes automáticos, Google Calendar, relatórios em PDF e portal do cliente continuam para a fase 2.
