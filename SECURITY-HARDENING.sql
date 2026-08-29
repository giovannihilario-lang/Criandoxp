-- Criando XP · Security Hardening
-- Execute no SQL Editor do Supabase DEPOIS de:
--   1) supabase_conteudo_operacional_v2.sql
--   2) supabase_influencers.sql (caso a tabela de influencers ainda não exista)
--
-- Objetivo: deixar o acesso pela Data API explícito e mínimo.
-- A chave pública/anon do frontend NÃO é autorização; o RLS é.

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- POSTAGENS · somente equipe autenticada
-- ────────────────────────────────────────────────────────────────────────────
alter table public.postagens enable row level security;
revoke all on table public.postagens from anon, authenticated;
grant select, insert, update, delete on table public.postagens to authenticated;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='postagens'
  loop execute format('drop policy if exists %I on public.postagens', p.policyname); end loop;
end $$;

create policy postagens_authenticated_select on public.postagens for select to authenticated using (true);
create policy postagens_authenticated_insert on public.postagens for insert to authenticated with check (true);
create policy postagens_authenticated_update on public.postagens for update to authenticated using (true) with check (true);
create policy postagens_authenticated_delete on public.postagens for delete to authenticated using (true);

-- ────────────────────────────────────────────────────────────────────────────
-- CLIENTES · visitante pode APENAS inserir os campos do formulário público.
-- A equipe autenticada pode consultar, criar e atualizar o CRM.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.clientes enable row level security;
revoke all on table public.clientes from anon, authenticated;

grant insert (
  nome, idade, whatsapp_discord, tempo_rpg, sistemas_jogados, sistemas_desejados,
  melhor_dia, melhor_periodo, ciente_valores, ciente_compromisso, ciente_contrato,
  ciente_taxa, ciente_tolerancia, ciente_consentimento, pronto_ingressar,
  codigo_desconto, status, origem, utm_source, utm_campaign, influencer_codigo, notas
) on public.clientes to anon;

grant select, insert, update on table public.clientes to authenticated;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='clientes'
  loop execute format('drop policy if exists %I on public.clientes', p.policyname); end loop;
end $$;

create policy clientes_public_signup on public.clientes
  for insert to anon
  with check (
    status = 'Novo lead'
    and length(coalesce(nome,'')) between 2 and 100
    and case when coalesce(idade::text,'') ~ '^[0-9]{1,3}$' then idade::text::integer between 18 and 100 else false end
    and length(coalesce(whatsapp_discord,'')) between 8 and 80
  );
create policy clientes_authenticated_select on public.clientes for select to authenticated using (true);
create policy clientes_authenticated_insert on public.clientes for insert to authenticated with check (true);
create policy clientes_authenticated_update on public.clientes for update to authenticated using (true) with check (true);

-- ────────────────────────────────────────────────────────────────────────────
-- INFLUENCERS · tabela privada para a equipe; landing usa somente RPC controlada.
-- ────────────────────────────────────────────────────────────────────────────
alter table public.influencers enable row level security;
revoke all on table public.influencers from anon, authenticated;
grant select, insert, update, delete on table public.influencers to authenticated;

do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname='public' and tablename='influencers'
  loop execute format('drop policy if exists %I on public.influencers', p.policyname); end loop;
end $$;

create policy influencers_authenticated_select on public.influencers for select to authenticated using (true);
create policy influencers_authenticated_insert on public.influencers for insert to authenticated with check (true);
create policy influencers_authenticated_update on public.influencers for update to authenticated using (true) with check (true);
create policy influencers_authenticated_delete on public.influencers for delete to authenticated using (true);

-- RPC pública, pequena e validada. Ela não retorna a tabela nem aceita SQL dinâmico.
create or replace function public.increment_influencer_click(p_codigo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_codigo is null
     or length(p_codigo) > 64
     or p_codigo !~ '^[a-z0-9_-]+$' then
    return;
  end if;

  update public.influencers
  set clicks = coalesce(clicks, 0) + 1
  where codigo = p_codigo and ativo = true;
end;
$$;

revoke all on function public.increment_influencer_click(text) from public;
grant execute on function public.increment_influencer_click(text) to anon, authenticated;

commit;
