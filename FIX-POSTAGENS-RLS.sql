-- Garante CRUD da tabela postagens para usuários autenticados.
-- Execute no SQL Editor do Supabase apenas se o App.tsx acusar erro de RLS/policy.

alter table public.postagens enable row level security;

drop policy if exists "postagens_authenticated_select" on public.postagens;
drop policy if exists "postagens_authenticated_insert" on public.postagens;
drop policy if exists "postagens_authenticated_update" on public.postagens;
drop policy if exists "postagens_authenticated_delete" on public.postagens;

create policy "postagens_authenticated_select"
on public.postagens
for select
to authenticated
using (true);

create policy "postagens_authenticated_insert"
on public.postagens
for insert
to authenticated
with check (true);

create policy "postagens_authenticated_update"
on public.postagens
for update
to authenticated
using (true)
with check (true);

create policy "postagens_authenticated_delete"
on public.postagens
for delete
to authenticated
using (true);
