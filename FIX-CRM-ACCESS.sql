-- Criando XP · correção focada de acesso ao CRM
-- Use se a Central carregar leads, mas alterações de status/edição não persistirem.
-- Seguro para reaplicar: não remove a policy do formulário público nem libera leitura para anon.

begin;

alter table public.clientes enable row level security;

-- A equipe autenticada precisa enxergar a linha para poder atualizá-la sob RLS.
grant select, insert, update on table public.clientes to authenticated;

drop policy if exists clientes_authenticated_select on public.clientes;
drop policy if exists clientes_authenticated_insert on public.clientes;
drop policy if exists clientes_authenticated_update on public.clientes;

create policy clientes_authenticated_select
  on public.clientes
  for select
  to authenticated
  using (true);

create policy clientes_authenticated_insert
  on public.clientes
  for insert
  to authenticated
  with check (true);

create policy clientes_authenticated_update
  on public.clientes
  for update
  to authenticated
  using (true)
  with check (true);

commit;

-- Verificação rápida no SQL Editor:
-- select policyname, cmd, roles from pg_policies
-- where schemaname = 'public' and tablename = 'clientes'
-- order by policyname;
