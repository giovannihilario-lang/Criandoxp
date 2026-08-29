-- Criando XP · reparo focado no calendário/postagens
-- Seguro para executar mesmo se SECURITY-HARDENING.sql já tiver sido rodado.
-- Não altera clientes nem influencers.

begin;

-- Garante acesso à Data API para o papel usado por usuários logados.
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.postagens to authenticated;

alter table public.postagens enable row level security;

-- Remove apenas as policies de postagens para reconstruí-las de forma explícita.
do $$
declare p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'postagens'
  loop
    execute format('drop policy if exists %I on public.postagens', p.policyname);
  end loop;
end $$;

create policy postagens_authenticated_select
  on public.postagens
  for select
  to authenticated
  using (true);

create policy postagens_authenticated_insert
  on public.postagens
  for insert
  to authenticated
  with check (true);

create policy postagens_authenticated_update
  on public.postagens
  for update
  to authenticated
  using (true)
  with check (true);

create policy postagens_authenticated_delete
  on public.postagens
  for delete
  to authenticated
  using (true);

commit;

-- Diagnóstico: o resultado deve mostrar SELECT/INSERT/UPDATE/DELETE para authenticated.
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'postagens'
  and grantee = 'authenticated'
order by privilege_type;

-- Diagnóstico: devem aparecer as quatro policies acima.
select policyname, cmd, roles
from pg_policies
where schemaname = 'public'
  and tablename = 'postagens'
order by policyname;
