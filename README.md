# Criando XP

Aplicação React + TypeScript da landing pública da Criando XP e da Central de Operações editorial.

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
npm run lint
```

No PowerShell com execução de scripts bloqueada, use `npm.cmd` no lugar de `npm`.

## Rotas

- `/` — landing page pública
- `/inscrever` — formulário de inscrição
- `/central?tab=hoje` — Central de Hoje
- `/central?tab=conteudo` — calendário, Kanban e tabela
- `/central?tab=produtividade` — indicadores editoriais
- `/central?tab=leads` — CRM
- `/central?tab=influencers` — parceiros e links

A Vercel usa rewrite para `index.html`, então refresh e deep links dessas rotas continuam funcionando.

## Variáveis de ambiente

Opcionalmente configure:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_DASHBOARD_EMAIL
```

A publishable/anon key do Supabase é pública por definição. Autorização é responsabilidade dos grants e das políticas de Row Level Security no banco. Nunca coloque `service_role` no frontend.

## Banco · ordem recomendada

1. `supabase_conteudo_operacional_v2.sql` — estrutura editorial, datas ISO, checklist, histórico, métricas e campos do CRM.
2. `supabase_influencers.sql` — somente se a tabela/RPC de influencers ainda não existir.
3. `SECURITY-HARDENING.sql` — grants mínimos e RLS final de `postagens`, `clientes` e `influencers`.

O arquivo `SECURITY-HARDENING.sql` deve ser considerado a política final. Teste login, cadastro público, mudança de status, CRM e tracking de influencer depois de aplicá-lo.

## Onboarding por navegador

O tutorial não é salvo no login compartilhado. Cada navegador recebe um UUID aleatório (`cxp_client_id`) armazenado localmente, sem IP ou fingerprinting. O estado inclui versão, etapa e conclusão. Se o `localStorage` estiver bloqueado, o app tenta `sessionStorage`.

A versão atual é controlada por `ONBOARDING_VERSION` em `src/components/Onboarding.tsx`. Incrementar esse número reinicia o tutorial para a nova versão sem precisar apagar o `client_id`.

## Qualidade e segurança

- mutações de postagens são serializadas por item para evitar race conditions;
- falhas otimistas recarregam o estado real do servidor;
- updates/deletes críticos confirmam linha afetada;
- Error Boundary evita tela branca por falha de renderização;
- modais/drawers tratam Escape e foco;
- `prefers-reduced-motion` é respeitado;
- assets de ícones foram reduzidos e normalizados;
- a landing valida idade 18+, contato e campos obrigatórios também antes de enviar.
