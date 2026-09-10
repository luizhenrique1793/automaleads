# Cada profissional dono das suas empresas

Hoje, um Gestor sem empresas marcadas enxerga **todas** as empresas do sistema, e ele não consegue criar as próprias empresas sem depender de você. Vamos inverter isso: cada profissional passa a ter a própria carteira de empresas.

## Como vai funcionar

- Um Gestor/Colaborador vê **somente** as empresas ligadas a ele. Sem nenhuma ligada, ele começa com a lista vazia — nunca mais "vê tudo".
- Ele pode criar uma nova empresa direto na tela Empresas. A empresa criada fica automaticamente ligada a ele, então já aparece na lista dele e nos filtros de projetos, tarefas, ações, calendário e Minha semana.
- Você (administrador) continua vendo e editando tudo, e ainda pode marcar/desmarcar empresas de qualquer pessoa na tela Usuários.
- Cliente continua igual: só leitura, apenas as empresas que você marcar.

## Ajustes na tela de Usuários

- O texto some o trecho "sem marcar nada, ela continua vendo tudo" e passa a explicar: sem marcar nada, a pessoa começa sem empresas e pode criar as dela.
- Marcar empresas para um Gestor continua opcional (serve para dar acesso a empresas que já existem).

## Tela Empresas quando está vazia

- Em vez de uma lista vazia sem contexto, o profissional vê um convite para cadastrar a primeira empresa que ele atende.

## Detalhes técnicos

- `allowedCompanyIds` em `src/lib/api.functions.ts`: remover o fallback que devolve `null` (irrestrito) para profissional sem vínculo; passa a devolver `[]` para qualquer perfil não-administrador. Só `administrador` segue irrestrito.
- `saveCompany`: na criação por usuário não-administrador, inserir também em `company_users` (`user_id`, `company_id`, papel = `global_role`) na mesma operação, para que ele passe a ter acesso à empresa recém-criada.
- Na edição de empresa, a checagem `assertCompanyAccess` continua valendo.
- `src/routes/_shell/usuarios.tsx`: atualizar o texto explicativo do seletor de empresas para profissionais.
- `src/routes/_shell/empresas.index.tsx`: ajustar o texto do estado vazio.
- Sem mudanças de schema; `company_users` já tem a unicidade necessária.
