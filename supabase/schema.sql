-- ============================================================================
-- SCOALA DUMINICALA - Schema Supabase completa
-- ============================================================================
-- Ruleaza acest fisier in Supabase Dashboard -> SQL Editor -> New query -> Run
-- Poti rula tot fisierul dintr-o data.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSII
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- pentru gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. ENUM-URI (liste fixe)
-- ----------------------------------------------------------------------------

-- Clasele fixe de la scoala. Ordinea (sort_order) e importanta pt incrementare an scolar.
create table if not exists clase_scolare (
  cod text primary key,             -- ex: 'GM', 'GMj', 'GMa', 'C0', 'C1', ..., 'C12'
  nume_afisat text not null,        -- ex: 'Grupa mica', 'Clasa 0', 'Clasa 1'
  sort_order int not null unique
);

insert into clase_scolare (cod, nume_afisat, sort_order) values
  ('GM',  'Grădinița - grupa mică',    0),
  ('GMj', 'Grădinița - grupa mijlocie',1),
  ('GMa', 'Grădinița - grupa mare',    2),
  ('C0',  'Clasa 0',                   3),
  ('C1',  'Clasa 1',                   4),
  ('C2',  'Clasa 2',                   5),
  ('C3',  'Clasa 3',                   6),
  ('C4',  'Clasa 4',                   7),
  ('C5',  'Clasa 5',                   8),
  ('C6',  'Clasa 6',                   9),
  ('C7',  'Clasa 7',                  10),
  ('C8',  'Clasa 8',                  11),
  ('C9',  'Clasa 9',                  12),
  ('C10', 'Clasa 10',                 13),
  ('C11', 'Clasa 11',                 14),
  ('C12', 'Clasa 12',                 15),
  ('ABS', 'Absolvent',                16)
on conflict (cod) do nothing;

-- ----------------------------------------------------------------------------
-- 2. UTILIZATORI (autentificare proprie, NU Supabase Auth)
-- ----------------------------------------------------------------------------
-- Motiv: cerinta explicita e user/parola text simplu setate de admin, fara reset.
-- Design open-closed: rolul e text liber validat de un check, usor de extins.

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password text not null,           -- text simplu, per cerinta (aplicatie interna)
  rol text not null check (rol in ('admin', 'invatator')), -- adauga aici rol nou (ex 'dirijor','parinte')
  nume text,                        -- nume complet (gol pt admin)
  prenume text,
  activ boolean not null default true,
  creat_la timestamptz not null default now()
);

insert into app_users (username, password, rol, nume, prenume)
values ('admin', 'admin', 'admin', 'Administrator', '')
on conflict (username) do nothing;

-- ----------------------------------------------------------------------------
-- 3. AN SCOLAR CURENT (setare globala, un singur rand)
-- ----------------------------------------------------------------------------
create table if not exists setari_an_scolar (
  id int primary key default 1,
  an_scolar text not null default '2026-2027',   -- ex "2026-2027"
  constraint un_singur_rand check (id = 1)
);
insert into setari_an_scolar (id, an_scolar) values (1, '2026-2027')
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 4. GRUPE
-- ----------------------------------------------------------------------------
create table if not exists grupe (
  id uuid primary key default gen_random_uuid(),
  nume text not null,
  culoare_hex text not null default '#4A90D9',  -- cod hex culoare
  link_materiale text,                          -- link Drive, optional
  creat_la timestamptz not null default now()
);

-- Ce clase compun o grupa (relatie many-to-many)
create table if not exists grupe_clase (
  grupa_id uuid not null references grupe(id) on delete cascade,
  clasa_cod text not null references clase_scolare(cod),
  primary key (grupa_id, clasa_cod)
);

-- Invatatori arondati unei grupe (many-to-many)
create table if not exists grupe_invatatori (
  grupa_id uuid not null references grupe(id) on delete cascade,
  invatator_id uuid not null references app_users(id) on delete cascade,
  primary key (grupa_id, invatator_id)
);

-- ----------------------------------------------------------------------------
-- 5. COPII
-- ----------------------------------------------------------------------------
create table if not exists copii (
  id uuid primary key default gen_random_uuid(),
  nume_prenume text not null,
  clasa_cod text not null references clase_scolare(cod),
  scoala text,
  adresa text,
  data_nasterii date,
  are_nevoie_adeverinta boolean not null default false,
  grupa_id uuid references grupe(id) on delete set null,  -- calculat automat, dar stocat pt performanta filtrarii
  creat_la timestamptz not null default now(),
  actualizat_la timestamptz not null default now()
);

create index if not exists idx_copii_grupa on copii(grupa_id);
create index if not exists idx_copii_clasa on copii(clasa_cod);

-- ----------------------------------------------------------------------------
-- 6. MATERIALE NECESARE (per grupa, listă de bifat)
-- ----------------------------------------------------------------------------
create table if not exists materiale (
  id uuid primary key default gen_random_uuid(),
  grupa_id uuid not null references grupe(id) on delete cascade,
  denumire text not null,
  cantitate text not null,          -- text liber, ex "2 pachete", "10 buc"
  creat_la timestamptz not null default now()
);
-- Bifarea = stergerea randului (cerinta explicita: "sa se stearga din lista")

-- ----------------------------------------------------------------------------
-- 7. PROGRAMARI (lectii planificate de admin pentru o grupa)
-- ----------------------------------------------------------------------------
create table if not exists programari (
  id uuid primary key default gen_random_uuid(),
  grupa_id uuid not null references grupe(id) on delete cascade,
  data_lectie date not null,
  titlu text not null,
  invatator_principal_id uuid references app_users(id) on delete set null,
  vizibil_pentru_toti boolean not null default true,
  creat_la timestamptz not null default now(),
  unique (grupa_id, data_lectie) -- o singura lectie/grupa/zi
);

-- Invatatori ajutor (0..N) pentru o programare
create table if not exists programari_ajutoare (
  programare_id uuid not null references programari(id) on delete cascade,
  invatator_id uuid not null references app_users(id) on delete cascade,
  primary key (programare_id, invatator_id)
);

create index if not exists idx_programari_grupa_data on programari(grupa_id, data_lectie);

-- ----------------------------------------------------------------------------
-- 8. LECTII PARCURSE + STATISTICI PER COPIL (draft live -> istoric)
-- ----------------------------------------------------------------------------
-- O lectie parcursa e legata 1-la-1 de o programare (cand se "intra" pe ea).
-- Statisticile per copil se salveaza live (upsert la fiecare modificare).

create table if not exists lectii_parcurse (
  id uuid primary key default gen_random_uuid(),
  programare_id uuid not null unique references programari(id) on delete cascade,
  grupa_id uuid not null references grupe(id) on delete cascade,
  data_lectie date not null,
  titlu text not null,              -- copiat din programare la momentul inceperii (istoric stabil)
  invatator_principal_id uuid references app_users(id) on delete set null,
  creat_la timestamptz not null default now(),
  actualizat_la timestamptz not null default now()
);

create table if not exists lectii_parcurse_ajutoare (
  lectie_id uuid not null references lectii_parcurse(id) on delete cascade,
  invatator_id uuid not null references app_users(id) on delete cascade,
  primary key (lectie_id, invatator_id)
);

create table if not exists lectii_copii (
  id uuid primary key default gen_random_uuid(),
  lectie_id uuid not null references lectii_parcurse(id) on delete cascade,
  copil_id uuid not null references copii(id) on delete cascade,
  prezent_fix boolean not null default false,
  prezent boolean not null default false,
  biblie boolean not null default false,
  caiet boolean not null default false,
  pix boolean not null default false,
  puncte_plus int not null default 0,
  puncte_minus int not null default 0,
  bonus int not null default 0,
  total int generated always as (puncte_plus - puncte_minus + bonus) stored,
  actualizat_la timestamptz not null default now(),
  unique (lectie_id, copil_id)
);

create index if not exists idx_lectii_copii_copil on lectii_copii(copil_id);
create index if not exists idx_lectii_parcurse_grupa on lectii_parcurse(grupa_id);

-- ----------------------------------------------------------------------------
-- 9. FUNCTIE: recalculeaza grupa unui copil in functie de clasa lui curenta
-- ----------------------------------------------------------------------------
create or replace function recalculeaza_grupa_copil(p_copil_id uuid)
returns void as $$
declare
  v_clasa text;
  v_grupa uuid;
begin
  select clasa_cod into v_clasa from copii where id = p_copil_id;
  select gc.grupa_id into v_grupa
    from grupe_clase gc
    where gc.clasa_cod = v_clasa
    limit 1;
  update copii set grupa_id = v_grupa, actualizat_la = now() where id = p_copil_id;
end;
$$ language plpgsql;

-- Recalculeaza grupele pentru TOTI copiii (folosit dupa schimbare configuratie grupe)
create or replace function recalculeaza_toate_grupele()
returns void as $$
begin
  update copii c set
    grupa_id = (select gc.grupa_id from grupe_clase gc where gc.clasa_cod = c.clasa_cod limit 1),
    actualizat_la = now();
end;
$$ language plpgsql;

-- Trigger: cand se modifica grupe_clase (asignarea claselor la grupe), recalculeaza tot
create or replace function trg_grupe_clase_changed()
returns trigger as $$
begin
  perform recalculeaza_toate_grupele();
  return null;
end;
$$ language plpgsql;

drop trigger if exists on_grupe_clase_change on grupe_clase;
create trigger on_grupe_clase_change
after insert or update or delete on grupe_clase
for each statement execute function trg_grupe_clase_changed();

-- Trigger: cand se insereaza/schimba clasa unui copil, ii calculam grupa
create or replace function trg_copil_clasa_changed()
returns trigger as $$
begin
  new.grupa_id := (select gc.grupa_id from grupe_clase gc where gc.clasa_cod = new.clasa_cod limit 1);
  return new;
end;
$$ language plpgsql;

-- Doua triggere separate: unul pt orice INSERT (necondiționat), unul pt
-- UPDATE doar cand se schimba efectiv clasa. "of clasa_cod" pe INSERT e
-- ambiguu pt PostgREST/Supabase si poate sa nu se declanseze fiabil.
drop trigger if exists on_copil_clasa_change on copii;
drop trigger if exists on_copil_insert on copii;
create trigger on_copil_insert
before insert on copii
for each row execute function trg_copil_clasa_changed();

drop trigger if exists on_copil_clasa_update on copii;
create trigger on_copil_clasa_update
before update of clasa_cod on copii
for each row execute function trg_copil_clasa_changed();

-- ----------------------------------------------------------------------------
-- 10. FUNCTIE: incrementeaza / decrementeaza clasa tuturor copiilor (an scolar nou)
-- ----------------------------------------------------------------------------
create or replace function schimba_an_scolar(p_an_nou text, p_directie text)
returns void as $$
declare
  v_delta int;
begin
  if p_directie = 'incrementeaza' then
    v_delta := 1;
  elsif p_directie = 'decrementeaza' then
    v_delta := -1;
  else
    raise exception 'Directie invalida: %', p_directie;
  end if;

  -- JOIN explicit in loc de subquery + exists: planul de executie contine
  -- mereu o clauza WHERE statica si clara, evitand erori de "unsafe update"
  -- pe unele configurari Postgres/PgBouncer.
  update copii c
  set clasa_cod = tinta.cod_nou
  from (
    select cs1.cod as cod_vechi, cs2.cod as cod_nou
    from clase_scolare cs1
    join clase_scolare cs2 on cs2.sort_order = cs1.sort_order + v_delta
  ) as tinta
  where c.clasa_cod = tinta.cod_vechi;
  -- copiii care ar iesi din interval (sub prima clasa sau peste Absolvent)
  -- raman neschimbati - nu exista rand "tinta" pt ei in JOIN.

  update setari_an_scolar set an_scolar = p_an_nou where id = 1;
  perform recalculeaza_toate_grupele();
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 11. VIEW: statistici agregate per copil (pt tab "per total")
-- ----------------------------------------------------------------------------
create or replace view v_statistici_copii as
select
  c.id as copil_id,
  c.nume_prenume,
  c.clasa_cod,
  c.grupa_id,
  count(lc.id) as nr_lectii,
  coalesce(sum(case when lc.prezent then 1 else 0 end), 0) as nr_prezente,
  coalesce(sum(case when lc.prezent_fix then 1 else 0 end), 0) as nr_prezente_fix,
  coalesce(sum(case when lc.biblie then 1 else 0 end), 0) as nr_biblie,
  coalesce(sum(case when lc.caiet then 1 else 0 end), 0) as nr_caiet,
  coalesce(sum(case when lc.pix then 1 else 0 end), 0) as nr_pix,
  coalesce(sum(lc.puncte_plus), 0) as total_puncte_plus,
  coalesce(sum(lc.puncte_minus), 0) as total_puncte_minus,
  coalesce(sum(lc.bonus), 0) as total_bonus,
  coalesce(sum(lc.total), 0) as total_general
from copii c
left join lectii_copii lc on lc.copil_id = c.id
group by c.id, c.nume_prenume, c.clasa_cod, c.grupa_id;

-- ----------------------------------------------------------------------------
-- 12. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
-- Aplicatia NU foloseste Supabase Auth, deci nu avem auth.uid().
-- Folosim cheia "anon" doar prin API-ul aplicatiei; RLS permite acces via
-- rolul anon DOAR pt ca aplicatia noastra e singura care are proiectul (schema).
-- Recomandare: RLS activ pe toate tabelele, policy permisiva pt rolul anon,
-- pentru ca verificarea reala de user/parola/rol se face in aplicatie (nu la
-- nivel de DB). Aceasta e limitarea acceptata explicit (parole simple, app mica).

alter table app_users enable row level security;
alter table clase_scolare enable row level security;
alter table setari_an_scolar enable row level security;
alter table grupe enable row level security;
alter table grupe_clase enable row level security;
alter table grupe_invatatori enable row level security;
alter table copii enable row level security;
alter table materiale enable row level security;
alter table programari enable row level security;
alter table programari_ajutoare enable row level security;
alter table lectii_parcurse enable row level security;
alter table lectii_parcurse_ajutoare enable row level security;
alter table lectii_copii enable row level security;

-- Policy generica: anon poate face orice (select/insert/update/delete).
-- ATENTIE: aplicatia are login propriu, nu bazat pe Supabase Auth, deci
-- protectia "cine poate ce" se face 100% in front-end. Pentru o aplicatie
-- interna de biserica, cu 2 tipuri de user si fara date financiare/medicale,
-- acest compromis e acceptabil. Daca vrei protectie suplimentara la nivel de
-- DB, foloseste Supabase Auth cu useri reali si RLS bazat pe auth.uid().

do $$
declare
  t text;
begin
  foreach t in array array['app_users','clase_scolare','setari_an_scolar','grupe',
    'grupe_clase','grupe_invatatori','copii','materiale','programari',
    'programari_ajutoare','lectii_parcurse','lectii_parcurse_ajutoare','lectii_copii']
  loop
    execute format('drop policy if exists anon_all on %I;', t);
    execute format('create policy anon_all on %I for all using (true) with check (true);', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- GATA. Urmatorul pas: in Supabase Dashboard -> Settings -> API, copiaza
-- "Project URL" si "anon public" key in fisierul .env al aplicatiei React.
-- ----------------------------------------------------------------------------
