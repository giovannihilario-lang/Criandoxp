# Revisão geral · Criando XP

Esta versão foi tratada como uma revisão operacional completa da Central, com prioridade para uso real em celular, rapidez para tarefas recorrentes e persistência previsível.

## O que foi corrigido

### Leads / CRM
- cartões mobile reorganizados para o nome não ficar esmagado em uma coluna;
- status continua disponível como ação rápida e agora tem rollback visual se o Supabase recusar a alteração;
- edição completa saiu do modelo de autosave no `blur` e ganhou uma ficha explícita com botão **Salvar alterações**;
- ficha reúne contato, status, origem, responsável, dados de RPG, follow-up, último contato, UTMs, influencer e observações;
- lista renderiza em lotes de 40 leads para não transformar centenas de registros em centenas de nós no DOM de uma vez;
- busca usa valor diferido para não travar a digitação;
- ações essenciais no mobile ficaram maiores e mais previsíveis;
- criação de novo lead continua disponível sem esconder edição atrás de gestos ou campos frágeis.

### Conteúdo / postagens
- **Nova postagem** passou a ter criação rápida com Tema, Data, Rede, Formato e Responsável;
- existe a opção **Criar rápido** para voltar ao trabalho imediatamente;
- existe a opção **Criar e detalhar** para abrir a ficha completa quando necessário;
- listas e Central de Hoje carregam somente os campos necessários;
- roteiro, briefing e outros campos pesados são carregados sob demanda ao abrir a postagem;
- duplicação e adaptação carregam a ficha completa antes de copiar para não perder roteiro/briefing;
- o marcador interno usado pelo carregamento sob demanda é removido antes de qualquer `upsert`, evitando tentativa de salvar coluna inexistente no Supabase;
- mobile usa Calendário/Agenda e Lista como visualizações principais; Kanban continua disponível no desktop;
- ferramentas menos frequentes ficam agrupadas no mobile em **Ferramentas**, preservando Modelos e Recorrência sem poluir a tela;
- recorrência foi revisada para continuar gerando datas ISO válidas.

### Performance
- queries de listas deixaram de usar `select('*')` onde a ficha completa não é necessária;
- parceiros/influencers usam somente os campos de atribuição do CRM;
- busca global usa versões leves de posts e leads;
- polling é menos agressivo no celular;
- telas deixam de buscar bases completas em abas que não precisam delas;
- o CSS operacional foi retirado do `App.tsx` e movido para `src/styles/central.css`, reduzindo trabalho de parsing/manutenção no componente principal;
- `useDeferredValue` foi aplicado onde a filtragem podia competir com a digitação.

### Mobile / responsividade
- correções para 920 px e 480 px, cobrindo smartphones comuns;
- inputs de operação no celular usam tamanho adequado para toque e evitam zoom acidental do navegador;
- modais viram superfícies de largura total quando necessário;
- cards, ações, filtros, status, cabeçalho e navegação deixam de disputar a mesma linha;
- grids de status/origem passam a rolagem horizontal em vez de criar páginas gigantes;
- overflow horizontal global foi bloqueado;
- botões duplicados de criação foram reduzidos no mobile.

### Confiabilidade / qualidade
- atualização de lead exige confirmação de linha afetada pelo Supabase;
- atualização de postagem já confirma linha afetada e mantém rollback/recarga em falhas;
- modais novos usam controle de foco e Escape;
- estado interno do frontend não é enviado para o banco;
- utilitários do onboarding foram removidos do arquivo de componente, eliminando problemas de Fast Refresh;
- `DOM.Iterable` foi incluído na configuração TypeScript;
- erros e tipos frágeis que apareciam no ESLint foram eliminados nesta revisão.

## Banco de dados

O frontend aponta para o projeto Supabase da Criando XP, mas esse projeto não está entre os projetos conectados nesta sessão. Por isso nenhuma alteração foi aplicada diretamente no banco de produção.

`SECURITY-HARDENING.sql` continua sendo a política final recomendada para a instalação completa. Foi acrescentado `FIX-CRM-ACCESS.sql` como correção focada e idempotente para o caso específico em que o CRM carrega, mas mudança de status/edição não persiste.

## Validação executada

- `npx tsc -b --pretty false`: **aprovado, 0 erros**;
- `npx eslint .`: **aprovado, 0 erros e 0 warnings**;
- revisão estática dos fluxos de criação, atualização, duplicação, adaptação e recorrência;
- revisão das queries para evitar carregamento integral desnecessário.

### Observação sobre `npm run build`

O ZIP original trazia `node_modules` instalado no Windows. O ambiente de validação desta revisão é Linux, então o Rolldown tentou carregar `@rolldown/binding-linux-x64-gnu`, enquanto o pacote recebido continha apenas o binário nativo de Windows. A rede do ambiente também não conseguiu resolver `registry.npmjs.org` para instalar esse binário específico.

Isso é uma incompatibilidade do `node_modules` transportado entre sistemas operacionais, não um erro TypeScript da aplicação. O pacote final não inclui `node_modules`. Faça uma instalação limpa na máquina/deploy de destino antes do build.

## Instalação limpa recomendada

```powershell
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm.cmd ci
npm.cmd run lint
npm.cmd run build
```

Nunca reutilize `node_modules` copiado de Windows em Linux/Vercel ou vice-versa. Dependências nativas têm um senso de humor péssimo.
