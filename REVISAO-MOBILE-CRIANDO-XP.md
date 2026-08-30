# Revisão mobile e operacional — Criando XP

## O que foi corrigido

- **Leads no mobile:** o cabeçalho do lead não comprime mais o nome em uma coluna estreita. Nome e contato ocupam a largura disponível e as ações rápidas ficam organizadas abaixo.
- **Status do lead:** o seletor voltou a ser uma ação evidente no celular, com indicação de salvamento e rollback visual se a atualização falhar.
- **Cards de conteúdo no mobile:** status e ações secundárias foram reorganizados para evitar quebra, aperto e botões espremidos.
- **Nova postagem:** o botão de criar conteúdo agora abre um fluxo rápido com apenas Tema, Data, Rede, Formato e Responsável. O painel detalhado continua disponível depois da criação, sem obrigar o usuário a preencher um formulário enorme para começar.
- **Atalhos de criação:** botões “Nova postagem”, topo mobile, FAB, criação por data e ações do dia levam ao mesmo fluxo rápido.
- **Carregamento:** a Central de Hoje deixa de puxar toda a base de leads e todo o histórico editorial sem necessidade. Ela usa consultas resumidas e a atualização periódica só roda nas abas que precisam dos dados editoriais.
- **CRM mobile:** cards de status e origem viraram faixas horizontais roláveis, reduzindo a altura desperdiçada na tela pequena.
- **TypeScript:** adicionado `DOM.Iterable` à configuração, corrigindo os erros de compilação relacionados a `NodeList`.

## Validação executada

- `tsc -b`: **OK**.
- ESLint: o projeto já possuía 34 apontamentos no `App.tsx`; após o patch continua com os mesmos 34, sem novos apontamentos introduzidos pela revisão.
- O bundle Vite não pôde ser concluído neste ambiente porque o `node_modules` enviado contém o binding nativo de Windows do Rolldown e não o binding Linux. O ZIP de entrega, por isso, não inclui `node_modules`; execute `npm install`/`npm ci` no ambiente de desenvolvimento ou no deploy.

## Observação sobre Supabase / Leads

O frontend continua usando a atualização normal da tabela `clientes`. O SQL presente no projeto indica intenção de liberar `SELECT` e `UPDATE` para usuários autenticados. Como a conta Supabase conectada nesta sessão não expõe o projeto da Criando XP, as policies do banco de produção não foram alteradas nem presumidas. Se um status mudar na tela e depois voltar após recarregar, a próxima verificação deve ser nas policies/RLS e grants do projeto de produção.
