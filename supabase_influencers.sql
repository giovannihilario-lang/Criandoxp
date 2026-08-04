-- ============================================================
-- Criando XP · Tabela de Influencers + tracking de cliques
-- Rode isso inteiro no SQL Editor do Supabase (Project > SQL Editor)
-- ============================================================

-- 1) Tabela de influencers
create table if not exists public.influencers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  nome text not null,
  codigo text not null unique,
  ativo boolean not null default true,
  clicks integer not null default 0
);

-- 2) Função para incrementar cliques de forma atômica (chamada pela landing page)
create or replace function public.increment_influencer_click(p_codigo text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.influencers
  set clicks = clicks + 1
  where codigo = p_codigo and ativo = true;
$$;

-- 3) Segurança (RLS)
alter table public.influencers enable row level security;

-- Qualquer um (inclusive a landing page, sem login) pode ler a lista
drop policy if exists "influencers_select_all" on public.influencers;
create policy "influencers_select_all"
  on public.influencers for select
  using (true);

-- Só usuário logado (o painel) pode criar/editar/excluir influencers
drop policy if exists "influencers_insert_auth" on public.influencers;
create policy "influencers_insert_auth"
  on public.influencers for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "influencers_update_auth" on public.influencers;
create policy "influencers_update_auth"
  on public.influencers for update
  using (auth.role() = 'authenticated');

drop policy if exists "influencers_delete_auth" on public.influencers;
create policy "influencers_delete_auth"
  on public.influencers for delete
  using (auth.role() = 'authenticated');

-- Libera a função de incremento de clique pra visitante anônimo (chave anon) e logado
grant execute on function public.increment_influencer_click(text) to anon, authenticated;

-- 4) (Opcional) Já cadastra o Mayoou e o Zonad20 que já existiam manualmente no código
insert into public.influencers (nome, codigo)
values ('Mayoou', 'mayoou'), ('Zonad20', 'zonad20')
on conflict (codigo) do nothing;
