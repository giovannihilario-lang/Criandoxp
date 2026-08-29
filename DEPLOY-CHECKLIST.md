# Deploy checklist — Criando XP

## 1. Banco de dados

No Supabase SQL Editor, execute nesta ordem:

1. `supabase_conteudo_operacional_v2.sql` — se ainda não foi executado nesta base.
2. `supabase_influencers.sql` — somente se a estrutura de influencers ainda não existir.
3. `SECURITY-HARDENING.sql` — recomendado para esta versão final.

O hardening deve ser aplicado por último, depois das estruturas existirem.

## 2. Variáveis de ambiente

O projeto aceita:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

A chave deve ser a pública/publishable/anon do projeto. Nunca use `service_role` no navegador.

## 3. Validação local

No PowerShell, use `.cmd` se a política de execução bloquear `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run build
npm.cmd run lint
```

Não publique se build ou lint falharem.

## 4. Smoke test antes do push

- abrir `/`;
- abrir `/inscrever` diretamente e atualizar;
- enviar formulário válido;
- confirmar bloqueio para idade menor de 18;
- entrar em `/central?tab=hoje`;
- criar postagem;
- editar tema/data/status;
- atualizar a página e confirmar persistência;
- mover postagem para outro mês;
- criar/editar/excluir lead;
- criar/pausar/excluir influencer;
- testar Ctrl+K;
- testar Back/Forward;
- testar offline/online se possível;
- testar onboarding em dois navegadores diferentes com o mesmo login;
- reiniciar tutorial pela Ajuda;
- testar 375px e 1366×768;
- navegar só pelo teclado e conferir foco visível.

## 5. Git

```powershell
git add .
git commit -m "feat: finaliza revisao profunda de produto"
git push
```

## 6. Depois do deploy

- conferir console do navegador;
- conferir requests com erro na aba Network;
- repetir uma alteração de status e recarregar;
- conferir se o Supabase persistiu a alteração;
- testar formulário público fora da sessão autenticada;
- confirmar que dados de CRM/influencers não podem ser lidos anonimamente.
