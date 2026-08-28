-- Criando XP · Conteúdo Operacional v2
-- Execute uma vez no SQL Editor do Supabase antes/de junto do deploy.

begin;

-- ────────────────────────────────────────────────────────────────────────────
-- POSTAGENS: fluxo editorial, datas reais, checklist, histórico e performance
-- ────────────────────────────────────────────────────────────────────────────
alter table public.postagens add column if not exists data_iso date;
alter table public.postagens add column if not exists hook text not null default '';
alter table public.postagens add column if not exists roteiro text not null default '';
alter table public.postagens add column if not exists cta text not null default '';
alter table public.postagens add column if not exists referencias text not null default '';
alter table public.postagens add column if not exists checklist jsonb not null default '[]'::jsonb;
alter table public.postagens add column if not exists historico jsonb not null default '[]'::jsonb;
alter table public.postagens add column if not exists views bigint not null default 0;
alter table public.postagens add column if not exists likes bigint not null default 0;
alter table public.postagens add column if not exists shares bigint not null default 0;
alter table public.postagens add column if not exists saves bigint not null default 0;
alter table public.postagens add column if not exists followers_gained bigint not null default 0;
alter table public.postagens add column if not exists published_at timestamptz;
alter table public.postagens add column if not exists created_at timestamptz not null default now();

-- Backfill da data ISO a partir do dd/mm/aaaa legado.
update public.postagens
set data_iso = to_date(data, 'DD/MM/YYYY')
where data_iso is null
  and coalesce(data, '') ~ '^([0-2][0-9]|3[0-1])/(0[1-9]|1[0-2])/[0-9]{4}$';

-- Mantém mes coerente com a data quando houver data definida.
update public.postagens
set mes = extract(month from data_iso)::int - 1
where data_iso is not null;

-- Migra os status antigos para o fluxo editorial novo.
-- Primeiro remove checks antigos que mencionem a coluna status, independentemente do nome.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.postagens'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.postagens drop constraint %I', c.conname);
  end loop;
end $$;

update public.postagens set status = 'Ideia' where status = 'Planejado';
update public.postagens set status = 'Produção' where status = 'Em produção';

alter table public.postagens
  add constraint postagens_status_fluxo_check
  check (status in ('Ideia','Roteiro','Produção','Edição','Agendado','Publicado','Cancelado'));

create index if not exists idx_postagens_mes on public.postagens(mes);
create index if not exists idx_postagens_data_iso on public.postagens(data_iso);
create index if not exists idx_postagens_status on public.postagens(status);

-- ────────────────────────────────────────────────────────────────────────────
-- CLIENTES: mini CRM + origem estruturada
-- ────────────────────────────────────────────────────────────────────────────
alter table public.clientes add column if not exists origem text not null default '';
alter table public.clientes add column if not exists utm_source text not null default '';
alter table public.clientes add column if not exists utm_campaign text not null default '';
alter table public.clientes add column if not exists influencer_codigo text not null default '';
alter table public.clientes add column if not exists proxima_acao text not null default '';
alter table public.clientes add column if not exists follow_up_date date;
alter table public.clientes add column if not exists responsavel text not null default '';
alter table public.clientes add column if not exists ultimo_contato date;
alter table public.clientes add column if not exists anotacao_rapida text not null default '';

-- Aproveita o campo legado "Origem: ..." onde já existir.
update public.clientes
set origem = trim(regexp_replace(notas, '^Origem:\s*', '', 'i'))
where coalesce(origem, '') = ''
  and coalesce(notas, '') ~* '^Origem:';

create index if not exists idx_clientes_status on public.clientes(status);
create index if not exists idx_clientes_origem on public.clientes(origem);
create index if not exists idx_clientes_followup on public.clientes(follow_up_date);
create index if not exists idx_clientes_influencer on public.clientes(influencer_codigo);

commit;
