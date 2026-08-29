# Criando XP — Revisão Profunda de Produto

Este pacote consolida a revisão end-to-end da aplicação com prioridade em integridade de dados, confiabilidade, usabilidade, acessibilidade, responsividade e acabamento visual.

## Principais correções de engenharia

- Cliente Supabase centralizado em `src/lib/supabase.ts`.
- CRUD interno usa a sessão autenticada do Supabase.
- Atualizações de postagens são serializadas por registro para evitar race conditions.
- Falhas de persistência deixam de produzir estado visual falso; a interface recupera o estado do servidor e informa o erro.
- Polling reduzido e suspenso durante edição, salvamento, aba oculta ou offline.
- Operações otimistas críticas possuem rollback/recuperação.
- Mudanças de mês removem o conteúdo da visão atual somente após persistência confirmada.
- Consultas mensais consideram ano e mês, evitando misturar o mesmo mês de anos diferentes.
- Backlog sem data continua disponível independentemente do mês.
- Error Boundary impede uma falha de renderização de derrubar a aplicação inteira.
- Back/Forward e deep links foram integrados ao estado de navegação.

## UX e interface

- Central editorial permanece como entrada operacional.
- Calendário, semana, agenda, Kanban e tabela têm papéis distintos em vez de duplicarem a mesma interação.
- Seletor de data próprio substitui digitação manual e funciona como popover no desktop e bottom sheet no mobile.
- Drawers, modais, busca e seletores possuem Escape, foco contido e restauração do foco.
- Estados de loading, erro, vazio, offline e salvamento são explícitos.
- Confirmação destrutiva própria substitui `window.confirm`.
- Ações em massa, backlog, Kanban e cards móveis receberam feedback e controles adequados.

## Responsividade

- Mobile não é apenas desktop reduzido: há navegação inferior, superfícies em tela cheia e composição própria.
- Alvos de toque críticos foram ampliados.
- Tabela permanece ferramenta secundária; agenda/cards são priorizados em telas estreitas.
- Layouts usam `min-width: 0`, wrapping e truncamento deliberado nos pontos de maior risco.

## Acessibilidade

- Controles interativos críticos usam elementos semânticos focáveis.
- Botões têm `type` explícito e nomes acessíveis onde o ícone isolado não é suficiente.
- Estados atuais usam `aria-current`/`aria-pressed` quando aplicável.
- Focus-visible consistente.
- Diálogos possuem foco contido, Escape e retorno ao disparador.
- Contraste de textos secundários foi elevado.
- `prefers-reduced-motion: reduce` é respeitado.
- Formulário público possui labels, required, validação e feedback de erro.

## Onboarding por navegador

- Identificador aleatório `cxp_client_id`, gerado localmente por navegador.
- Sem IP, fingerprint ou atributos invasivos do dispositivo.
- Estado persistido em localStorage com fallback para sessionStorage.
- `ONBOARDING_VERSION = 3` permite reapresentar um novo tutorial em futuras versões.
- Progresso, conclusão e etapa são separados por navegador, mesmo com login compartilhado.
- Ajuda permanente permite reiniciar o tour sem trocar a identidade local.
- Alvos ausentes são tratados sem derrubar o produto.

## Segurança

O frontend usa uma chave pública/publishable do Supabase. Ela não é tratada como segredo nem como autorização. O controle real é feito por RLS e privilégios no banco.

`SECURITY-HARDENING.sql`:
- restringe `postagens` à equipe autenticada;
- permite ao visitante apenas INSERT dos campos públicos necessários em `clientes`;
- restringe leitura/edição do CRM a autenticados;
- torna `influencers` privado para a equipe;
- mantém somente uma RPC pública, validada e pequena, para contabilizar clique de influencer.

Nunca coloque `service_role` no frontend.

## Performance

- Ícones gigantes foram redimensionados para tamanhos compatíveis com uso real/retina.
- Dois `.png` que continham WebP foram convertidos para PNG real.
- Chamadas duplicadas e polling excessivo foram reduzidos.
- Nenhuma nova biblioteca pesada foi adicionada.
- Motion privilegia transform/opacity e possui modo reduzido.

## Formulário público

- Regra 18+ agora é realmente validada.
- WhatsApp/contato, nome e campos obrigatórios possuem limites e mensagens.
- Enter/submit funciona de maneira previsível.
- Duplo envio é bloqueado.
- Ref/UTM são sanitizados e limitados.
- A seleção “Nunca joguei” é mutuamente exclusiva com sistemas já jogados.
- Tracking em storage possui fallback seguro quando armazenamento é bloqueado.

## QA executado neste ambiente

- Parse/checagem TypeScript independente de todo `src` com `noUnusedLocals` e `noUnusedParameters`.
- Busca por código morto, `TODO/FIXME`, `dangerouslySetInnerHTML`, `service_role`, `fetch()` direto e `window.confirm`.
- Verificação de tipos de arquivo dos PNGs.
- Validação JSON de `package.json` e `tsconfig.json`.
- Conferência de rewrite SPA.
- Conferência de botões do `App.tsx`: todos com `type` explícito.
- Revisão estática de navegação, onboarding e estados críticos.

### Limitação do ambiente de QA

O build real `npm run build` não pôde concluir neste container porque as dependências locais ficaram incompletas e o ambiente não consegue resolver `registry.npmjs.org`. O erro é de tipos ausentes (`vite/client` e `node`) antes da compilação da aplicação.

Por isso, rode `npm.cmd install`, `npm.cmd run build` e `npm.cmd run lint` na máquina local antes do deploy. Esse passo não deve ser omitido.

## Arquivos principais alterados/adicionados

- `src/App.tsx`
- `src/LandingPage.tsx`
- `src/main.tsx`
- `src/index.css`
- `src/lib/supabase.ts`
- `src/components/ErrorBoundary.tsx`
- `src/components/Onboarding.tsx`
- `public/icons/*`
- `vercel.json`
- `README.md`
- `SECURITY-HARDENING.sql`
- `DEPLOY-CHECKLIST.md`

Nenhuma dependência npm nova foi adicionada nesta revisão.
