# Momentum Hub

Quero criar uma aplicação web de gestão operacional para uma empresa que atende vários clientes e gerencia projetos, tarefas e ações.

A aplicação deve ser prática, rápida de usar e visualmente muito organizada. O objetivo principal é permitir que vários usuários gerenciem várias empresas clientes sem se perderem entre tarefas, prazos, reuniões, treinamentos, palestras, entregas e projetos em andamento.

IMPORTANTE SOBRE A ARQUITETURA

O banco de dados será um PostgreSQL externo.

NÃO utilizar Supabase como banco de dados.

NÃO conectar o frontend diretamente ao PostgreSQL.

Toda comunicação com o banco deve ocorrer através de uma camada backend segura, API ou server actions apropriadas.

As credenciais do PostgreSQL devem ficar exclusivamente no backend através de variáveis de ambiente.

Estruture o projeto desde o início pensando em:

Frontend
Backend/API
PostgreSQL externo
Autenticação de usuários
Multiusuário
Várias empresas/clientes
Permissões futuras

Nesta primeira etapa ainda NÃO vamos implementar integrações com n8n, WhatsApp ou outras automações externas.

Porém, a arquitetura deve ficar preparada para isso futuramente.

OBJETIVO DO MVP

Quero uma primeira versão funcional e simples baseada nesta estrutura:

EMPRESA
PROJETOS
TAREFAS
AÇÕES

Uma empresa também pode possuir tarefas e ações sem estarem vinculadas a nenhum projeto.

Portanto:

Empresa é obrigatória.

Projeto é opcional para ações e tarefas.

Uma tarefa também pode opcionalmente estar vinculada a uma ação.

CONCEITO PRINCIPAL

AÇÃO representa algo que acontece em determinada data ou período.

Exemplos:

Reunião
Palestra
Treinamento
Publicação
Visita
Campanha
Entrega
Evento
Outro

Uma ação pode ser:

Dia inteiro

ou

Possuir horário inicial e horário final.

Exemplo:

Empresa: Parque Pôr do Sol
Projeto: Agente de IA
Ação: Reunião de validação
Data: 15/09/2026
Horário: 14:00 às 15:00

TAREFA representa algo que precisa ser executado.

Exemplos:

Preparar apresentação
Corrigir versão mobile do site
Criar arte do Instagram
Configurar agente de IA
Revisar checkout
Enviar orçamento
Solicitar material ao cliente

Uma tarefa possui principalmente:

Título
Descrição
Empresa
Projeto opcional
Ação opcional
Responsável
Prazo
Prioridade
Status

Exemplo:

Empresa: Parque Pôr do Sol
Projeto: Agente de IA
Ação: Reunião de validação
Tarefa: Preparar relatório de atendimento
Prazo: 14/09/2026

Também deve ser possível criar:

Empresa: NP Yachts
Projeto: Site
Tarefa: Corrigir versão mobile
Ação: nenhuma
Prazo: 18/09/2026

ESTRUTURA PRINCIPAL DA APLICAÇÃO

Criar inicialmente as seguintes áreas:

Dashboard / Início

Minha Semana

Calendário

Empresas

Projetos

Tarefas

Ações

O menu principal deve ficar em uma sidebar lateral no desktop.

No mobile utilizar navegação adaptada, limpa e simples.

DASHBOARD

A página inicial deve responder rapidamente:

"O que preciso resolver agora?"

Mostrar blocos como:

Hoje

Ações de hoje

Tarefas com prazo hoje

Tarefas atrasadas

Próximos prazos

Aguardando cliente

Próximas ações

Resumo da semana

Exemplo de cards:

3 tarefas para hoje

2 atrasadas

4 ações esta semana

3 aguardando cliente

Mostrar abaixo uma lista prática das tarefas mais importantes.

Criar um botão de ação rápida "+" sempre acessível.

Ao clicar:

Nova tarefa
Nova ação
Novo projeto

MINHA SEMANA

Essa será uma das páginas mais importantes.

Criar uma visão semanal de segunda a domingo.

Cada dia deve mostrar:

Ações agendadas

Tarefas com prazo naquele dia

Deixar visualmente diferente:

Ações, que representam agenda/compromissos.

Tarefas, que representam entregas/trabalho.

Permitir filtros por:

Empresa
Projeto
Responsável
Status

Exemplo:

SEGUNDA, 14 SET

09:00
Reunião Parque Pôr do Sol

14:30
Treinamento Cliente X

Tarefas

Criar arte Adriana
Revisar integração PIX

TERÇA, 15 SET

10:00
Reunião Apoio

Tarefas

Enviar orçamento Porto do Sol

CALENDÁRIO

Criar visualização:

Semana

Mês

O calendário deve exibir tanto ações quanto tarefas com prazo.

Porém devem possuir identidade visual diferente.

Por exemplo:

Ações podem aparecer como blocos com horário.

Tarefas podem aparecer com ícone de checklist e prazo.

Permitir clicar em qualquer item para abrir seus detalhes.

Permitir filtros:

Empresa
Projeto
Responsável
Tipo
Status

EMPRESAS

Criar listagem de empresas/clientes.

Cada empresa deve possuir:

Nome
Logo opcional
Cor identificadora
Contato opcional
Telefone opcional
E-mail opcional
Observações
Status

Status:

Ativa
Inativa

Cada empresa deverá possuir uma página própria.

Página da empresa:

Cabeçalho com nome, logo e cor.

Cards:

Projetos ativos
Tarefas abertas
Tarefas atrasadas
Ações futuras

Criar abas:

Visão geral
Projetos
Tarefas
Ações

Mostrar também atividades concluídas recentemente.

PROJETOS

Um projeto sempre pertence a uma empresa.

Campos:

Nome
Empresa
Descrição
Responsável
Data de início
Prazo
Status
Progresso

Status:

Planejamento
Em andamento
Pausado
Concluído
Cancelado

Dentro de um projeto mostrar:

Tarefas
Ações
Progresso
Prazo
Responsável

Exemplos de projetos:

Novo site
Agente de IA
Gestão de tráfego
Instagram
Integração de sistema
Campanha Setembro
Manutenção do site

TAREFAS

Campos:

Título
Descrição
Empresa
Projeto opcional
Ação opcional
Responsável
Data de criação
Prazo
Prioridade
Status

Prioridades:

Baixa
Normal
Alta
Urgente

Status:

A fazer
Em andamento
Aguardando cliente
Concluída
Cancelada

A tarefa deve poder ser marcada como concluída rapidamente através de checkbox ou botão.

Destacar visualmente tarefas atrasadas.

Uma tarefa será considerada atrasada quando:

Prazo já passou

e

Status não for Concluída nem Cancelada.

Permitir filtros:

Todas
Minhas tarefas
Hoje
Esta semana
Atrasadas
Aguardando cliente
Concluídas

Também permitir filtros por:

Empresa
Projeto
Responsável
Prioridade

AÇÕES

Campos:

Título
Descrição
Empresa
Projeto opcional
Tipo de ação
Responsável
Data
Dia inteiro
Horário inicial
Horário final
Status

Tipos iniciais:

Reunião
Palestra
Treinamento
Publicação
Entrega
Visita
Campanha
Evento
Outro

Status:

Planejada
Realizada
Cancelada

Caso seja "Dia inteiro", não exigir horário inicial e final.

Caso não seja dia inteiro, exigir horário inicial.

Uma ação poderá ter várias tarefas vinculadas.

Dentro da tela de detalhes de uma ação mostrar:

Informações da ação

Empresa

Projeto

Responsável

Data e horário

Tarefas relacionadas

Adicionar tarefa relacionada

Exemplo:

Ação:
Reunião com Parque Pôr do Sol
15/09/2026
14:00 às 15:00

Tarefas relacionadas:

Preparar apresentação
Revisar fluxo PIX
Separar pontos pendentes
Enviar resumo após reunião

BANCO DE DADOS

Preparar uma estrutura PostgreSQL bem organizada.

Inicialmente podemos utilizar entidades semelhantes a:

users

companies

company_users

projects

actions

tasks

activity_logs

Estrutura conceitual:

users
id
name
email
password_hash ou estrutura compatível com a solução de autenticação
created_at
updated_at

companies
id
name
logo_url
color
contact_name
phone
email
notes
status
created_at
updated_at

company_users
id
company_id
user_id
role

projects
id
company_id
name
description
responsible_user_id
start_date
deadline
status
progress
created_at
updated_at

actions
id
company_id
project_id nullable
title
description
action_type
responsible_user_id
action_date
all_day
start_time
end_time
status
created_at
updated_at

tasks
id
company_id
project_id nullable
action_id nullable
title
description
responsible_user_id
due_date
priority
status
completed_at
created_at
updated_at

activity_logs
id
user_id
company_id nullable
entity_type
entity_id
action
created_at

Use UUIDs como identificadores caso seja adequado para a arquitetura.

Criar relacionamentos e foreign keys corretamente.

Pensar desde o início em isolamento dos dados entre usuários e organizações.

AUTENTICAÇÃO

A aplicação será usada por vários usuários.

Criar:

Login

Logout

Sessão autenticada

Usuário responsável pelas tarefas

Não precisa implementar nesta primeira versão uma gestão avançada de permissões.

Porém preparar a arquitetura para futuramente termos perfis como:

Administrador
Gestor
Colaborador
Cliente

DESIGN

Quero uma interface profissional de sistema SaaS moderno.

Não quero aparência de template genérico ou sistema administrativo antigo.

Prioridades:

Clareza
Rapidez
Pouca poluição visual
Boa hierarquia
Fácil leitura
Boa utilização de espaço
Cards apenas quando agregarem informação
Tabelas modernas
Filtros simples
Calendário visual
Modais ou drawers para cadastros rápidos

Usar bastante espaço em branco.

Interface clara.

Sidebar discreta.

Tipografia moderna e profissional.

Cantos levemente arredondados.

Sombras sutis.

Evitar excesso de gradientes.

Evitar excesso de cores.

As cores das empresas podem ser utilizadas como pequenos indicadores visuais.

A interface deve funcionar muito bem em desktop, mas também ser responsiva.

EXPERIÊNCIA DE USO

Um dos pontos mais importantes é a velocidade para cadastrar informações.

Criar tarefa deve exigir poucos cliques.

Criar ação deve exigir poucos cliques.

Quando eu estiver dentro da página de uma empresa e clicar em "Nova tarefa", a empresa já deve vir selecionada.

Quando estiver dentro de um projeto e clicar em "Nova tarefa", empresa e projeto devem vir selecionados automaticamente.

O mesmo vale para ações.

Evitar páginas desnecessárias.

Preferir drawers laterais ou modais para criação e edição rápida.

Ao marcar uma tarefa como concluída, atualizar imediatamente a interface.

FASE 1

Implementar inicialmente:

Autenticação

Empresas

Projetos

Tarefas

Ações

Dashboard

Minha Semana

Calendário semanal e mensal

Filtros

Status

Responsáveis

Relacionamentos entre empresa, projeto, tarefa e ação

Interface responsiva

CRUD completo das entidades principais

NÃO IMPLEMENTAR AGORA:

WhatsApp

n8n

Envio automático de lembretes

Google Calendar

IA

Portal do cliente

PDF de relatório

Automação de recorrência complexa

Esses itens serão implementados posteriormente.

PREPARAÇÃO PARA FASE 2

Mesmo sem implementar agora, evitar decisões arquiteturais que dificultem posteriormente:

Lembretes via WhatsApp

Integração n8n

Webhooks

Tarefas recorrentes

Ações recorrentes

Portal do cliente

Relatórios mensais

Integração Google Calendar

Notificações

APIs externas

Comece criando a estrutura completa da aplicação, arquitetura, navegação, banco PostgreSQL externo e as telas principais do MVP.

Priorize primeiro uma aplicação funcional e utilizável. Não tente adicionar funcionalidades além do escopo descrito.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://automaleads.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/145093c1-7b44-4a1d-961b-b11fb46d102a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
