# Painel da profissional (por empresa) — e a próxima melhoria

## O que já existe hoje (verificado no código)

- A psicóloga entra como Gestor/Colaborador e **já não vê menu de administração**: "Usuários" só aparece para administrador (`src/routes/_shell.tsx`), e o servidor já limita empresas, projetos, tarefas e ações às empresas dela (`allowedCompanyIds` em `src/lib/api.functions.ts`).
- "Início" já mostra números do dia, prioridades e ações — mas **tudo misturado**, sem separar por empresa.
- "Minha semana" já mostra segunda a domingo com ações e tarefas — também sem recorte por empresa.

Ou seja: a tela que ela precisa quase existe. Criar um segundo painel paralelo duplicaria a manutenção e é o principal risco de quebrar o que já funciona.

## Minha recomendação

Fazer o que você pediu, mas **dentro do "Início" que já existe**, em vez de uma tela nova separada. Ela ganha o painel com agenda, tarefas e ações separadas por empresa, sem nenhum menu de admin, e o sistema continua com um único painel para manter.

## O que muda na tela "Início"

1. **Agenda de hoje** no topo: compromissos do dia em ordem de horário, com horário, tipo (atendimento, reunião, palestra) e empresa.
2. **Faixa de números** (já existe): hoje · atrasadas · esta semana · aguardando.
3. **Por empresa** — novo bloco, o coração do pedido: um cartão para cada empresa que ela atende, com
   - a cor e o nome da empresa,
   - próximo compromisso agendado,
   - quantas tarefas em aberto e quantas atrasadas,
   - até 3 tarefas mais urgentes,
   - link para a página completa da empresa.
   Empresas sem nada pendente aparecem recolhidas no fim, com "tudo em dia".
4. **Prioridades** e **Aguardando cliente**: continuam como estão hoje.

No celular tudo empilha em uma coluna. Blocos vazios mostram uma frase curta, nunca uma caixa quebrada.

## Por que isso não quebra nada

- Só muda a montagem visual de `src/routes/_shell/index.tsx`, usando os dados que a tela já recebe (`useWorkspace`).
- Nenhuma mudança em banco, login, permissões ou funções de servidor — o filtro por empresa já é feito no servidor.
- Portal do cliente, Minha semana, Calendário, Tarefas e Ações ficam intocados.

## Próxima melhoria que eu faria depois (e por quê)

**Atendimentos que se repetem toda semana.** Hoje ela precisa cadastrar uma a uma cada sessão semanal em cada empresa — é o trabalho repetitivo que mais consome tempo de quem atende com agenda fixa. A ideia: ao criar uma ação, poder marcar "repetir toda semana até tal data" e o sistema gerar os compromissos, com opção de cancelar um dia específico sem afetar os outros.

Alternativa mais barata, se preferir algo rápido: **anotação de atendimento** — um campo de registro dentro de cada ação, para ela escrever o que foi tratado e consultar depois no histórico da empresa.

Se preferir mesmo assim uma tela separada em vez de evoluir o "Início", eu faço — é só dizer.
