# Fechamento do escopo atual

O escopo combinado está praticamente completo: empresas, projetos, tarefas, ações, painel, Minha semana, calendário, filtros, responsáveis, permissões por empresa, portal do cliente e agora os compromissos recorrentes. Restam dois pontos dentro do escopo, ambos pequenos e sem risco para a arquitetura.

## O que falta

1. **Guia de Ajuda desatualizado** — a página "Ajuda" ainda não explica os compromissos que se repetem (recorrência) nem o portal do cliente. Usuário leigo que ler o guia não descobre esses recursos.
2. **Teste de uso real da recorrência** — o recurso foi implementado e o build passou, mas ainda não foi validado na prática (criar uma série de 8 encontros, conferir agenda, filtro "Repetidos", editar/excluir "só este" vs "este e os próximos").

## O que será feito

1. Atualizar a página Ajuda com duas seções novas em linguagem simples: "Compromissos que se repetem" (como criar, como aparecem, como editar/excluir um ou vários, limite de 60) e "Portal do cliente" (o que o cliente vê, somente leitura).
2. Rodar um teste automatizado no navegador do preview: criar uma série semanal de 8 encontros, confirmar que aparecem na Minha semana/Calendário/Ações, editar um encontro isolado, excluir "este e os próximos", e conferir o filtro "Repetidos".
3. Corrigir qualquer problema encontrado no teste.

## Fora do escopo (não entra)

WhatsApp, n8n, lembretes automáticos, Google Calendar, IA, PDF, recorrência em múltiplos dias da semana.

## Detalhes técnicos

- Somente texto em `src/routes/_shell/ajuda.tsx`; sem alteração de banco, permissões ou funções de servidor.
- Teste via Playwright contra o preview local, sem alterar dados reais além de registros de teste.
- Se o teste revelar defeito na recorrência, a correção segue as regras já aprovadas (escopo por empresa, cliente somente leitura, geração de datas no servidor).
