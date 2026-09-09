# Sistema de Gestão Operacional — MVP (Fase 1)

Aplicação web em português para gerenciar várias empresas clientes, com projetos, tarefas e ações, usando seu PostgreSQL externo.

## Como fica a arquitetura

```text
Navegador (telas)  ->  Backend seguro da própria aplicação  ->  PostgreSQL externo
```

O navegador nunca fala com o banco. Todo acesso passa pelo backend, e a senha do banco fica guardada como segredo, só no servidor. Nada de Supabase.

## O que eu preciso de você

1. Criar um banco vazio no seu PostgreSQL (ex.: `automa_leads`).
2. Garantir que ele aceite conexão pela internet, com SSL, a partir do servidor da aplicação.
3. Me enviar a string de conexão (`postgresql://usuario:senha@host:5432/banco?sslmode=require`). Eu guardo como segredo — não fica no código.

Eu crio todas as tabelas automaticamente no primeiro acesso, com um script de instalação. Você não precisa rodar SQL na mão.

## Acesso

- Login por e-mail e senha, sessão segura por cookie, logout.
- Sem cadastro aberto: eu crio um usuário administrador inicial (você me passa e-mail e senha depois, ou uso um padrão que você troca no primeiro acesso).
- Tela de "Usuários" simples para você adicionar colegas.
- A estrutura já guarda o papel de cada pessoa por empresa (Administrador, Gestor, Colaborador, Cliente), mas nesta fase todos enxergam tudo.

## Telas

- **Dashboard** — blocos com "Hoje", "Atrasadas", "Próximos prazos", "Aguardando cliente", "Ações da semana", e a lista do que é mais urgente.
- **Minha Semana** — segunda a domingo, cada dia com as ações (com horário) e as tarefas com prazo, visualmente distintas. Filtros por empresa, projeto, responsável e status.
- **Calendário** — visão de semana e de mês, ações como blocos com horário e tarefas com ícone de checklist. Clicar abre os detalhes.
- **Empresas** — lista e página própria por empresa, com cabeçalho colorido, números de resumo e abas Visão geral / Projetos / Tarefas / Ações.
- **Projetos** — lista e página do projeto com tarefas, ações, progresso, prazo e responsável.
- **Tarefas** — tabela moderna com filtros rápidos (Todas, Minhas, Hoje, Esta semana, Atrasadas, Aguardando cliente, Concluídas) e conclusão em um clique.
- **Ações** — lista e detalhe, com as tarefas ligadas àquela ação e botão para adicionar tarefa relacionada.

Menu numa barra lateral discreta no desktop; no celular, navegação compacta.

## Rapidez de uso

- Botão "+" sempre visível: Nova tarefa, Nova ação, Novo projeto.
- Cadastro e edição em painéis laterais, sem trocar de página.
- Dentro de uma empresa, a empresa já vem preenchida; dentro de um projeto, empresa e projeto já vêm preenchidos.
- Marcar tarefa como concluída atualiza a tela na hora.

## Visual

SaaS moderno e limpo: muito espaço em branco, tipografia atual, cantos levemente arredondados, sombras sutis, poucas cores. A cor de cada empresa aparece só como pequeno indicador. Datas e textos em português do Brasil.

## Dados de exemplo

Poucos registros, o suficiente para demonstrar: 3 empresas (incluindo Parque Pôr do Sol e NP Yachts), 3 projetos, cerca de 8 tarefas (uma atrasada, uma aguardando cliente) e 4 ações espalhadas na semana.

## Detalhes técnicos

- Backend com server functions do TanStack Start; nenhuma credencial no navegador.
- Driver `postgres` (postgres.js) com SSL, lendo `DATABASE_URL` de variável de ambiente dentro do handler.
- Tabelas: `users`, `companies`, `company_users`, `projects`, `actions`, `tasks`, `activity_logs` — chaves UUID (`gen_random_uuid()`), chaves estrangeiras e índices por `company_id`, `due_date` e `action_date`.
- Migrações versionadas em arquivos SQL no projeto, aplicadas por uma rota de instalação protegida por segredo, com tabela de controle `schema_migrations`.
- Senhas com hash (scrypt/bcrypt compatível com o runtime edge), sessão em cookie httpOnly assinado, tabela `sessions`.
- `activity_logs` gravado nas criações, edições e conclusões — base para relatórios e webhooks depois.
- Camada de dados isolada por entidade para que n8n, WhatsApp, recorrência e webhooks entrem depois sem reescrever telas.
- Consultas sempre filtradas por empresa, preparando isolamento por permissão.

## Fora do escopo agora

WhatsApp, n8n, lembretes automáticos, Google Calendar, IA, portal do cliente, PDF e recorrência.

## Risco a validar cedo

O servidor da aplicação roda em ambiente edge. A primeira coisa que faço é testar a conexão real com seu banco; se a rede não permitir, aviso e proponho alternativa (liberar IP/porta ou um proxy HTTP no seu servidor).
