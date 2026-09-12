-- ============================================================================
-- FIX: arondare automata grupa la INSERT, eroare UPDATE la schimbare an scolar,
--      si clasa "Absolvent" ca stare reala, reversibila
-- ============================================================================
-- Ruleaza tot fisierul o singura data in Supabase SQL Editor.
-- Sigur de rulat de mai multe ori (foloseste "or replace" / "if not exists").
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX 1: adauga clasa "Absolvent" ca stare reala in secventa de clase
-- ----------------------------------------------------------------------------
-- Asa incrementul din Clasa 12 merge intr-un loc real (nu inventat), iar
-- decrementul din Absolvent intoarce corect in Clasa 12. Fara fundatura.
insert into clase_scolare (cod, nume_afisat, sort_order) values
  ('ABS', 'Absolvent', 16)
on conflict (cod) do nothing;

-- ----------------------------------------------------------------------------
-- FIX 2: triggerul de recalculare grupa la INSERT nu se declansa fiabil
-- ----------------------------------------------------------------------------
-- Problema: "before insert or update of clasa_cod" e ambiguu pt PostgREST -
-- clauza "of clasa_cod" e menita pt UPDATE, nu pt INSERT. Separam explicit
-- in doua triggere: unul necondiționat pe INSERT, unul pe UPDATE of clasa_cod.

drop trigger if exists on_copil_clasa_change on copii;
drop trigger if exists on_copil_insert on copii;
drop trigger if exists on_copil_clasa_update on copii;

create or replace function trg_copil_clasa_changed()
returns trigger as $$
begin
  new.grupa_id := (select gc.grupa_id from grupe_clase gc where gc.clasa_cod = new.clasa_cod limit 1);
  return new;
end;
$$ language plpgsql;

-- se declanseaza la fiecare INSERT, indiferent ce coloane sunt trimise
create trigger on_copil_insert
before insert on copii
for each row execute function trg_copil_clasa_changed();

-- se declanseaza doar cand se schimba efectiv clasa (editare copil)
create trigger on_copil_clasa_update
before update of clasa_cod on copii
for each row execute function trg_copil_clasa_changed();

-- Recalculeaza acum, o singura data, grupa pt toti copiii existenti care
-- au ramas cu grupa gresita/lipsa din cauza bug-ului de mai sus.
update copii c set
  grupa_id = (select gc.grupa_id from grupe_clase gc where gc.clasa_cod = c.clasa_cod limit 1),
  actualizat_la = now()
where true;

-- ----------------------------------------------------------------------------
-- FIX 3: eroarea "UPDATE requires a WHERE clause" la schimba_an_scolar
-- ----------------------------------------------------------------------------
-- Rescriem update-ul cu un JOIN explicit in loc de subquery + exists, ca sa
-- planul de executie contina intotdeauna o clauza WHERE statica si clara
-- (unele medii Postgres/PgBouncer resping update-uri unde WHERE-ul e doar
-- un "exists" pe un subquery corelat, tratandu-l ca update nesigur).

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

  update copii c
  set clasa_cod = tinta.cod_nou
  from (
    select cs1.cod as cod_vechi, cs2.cod as cod_nou
    from clase_scolare cs1
    join clase_scolare cs2 on cs2.sort_order = cs1.sort_order + v_delta
  ) as tinta
  where c.clasa_cod = tinta.cod_vechi;
  -- copiii care ar iesi din interval (ex incrementare din Absolvent, sau
  -- decrementare din prima clasa) raman neschimbati - nu exista rand "tinta"
  -- pt ei, deci JOIN-ul pur si simplu nu ii include in update.

  update setari_an_scolar set an_scolar = p_an_nou where id = 1;
  perform recalculeaza_toate_grupele();
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- GATA. Testeaza:
-- 1. Adauga un copil nou intr-o clasa care apartine unei grupe -> ar trebui
--    sa apara imediat cu grupa corecta, nu cu "-".
-- 2. Incrementeaza/decrementeaza anul scolar -> nu ar trebui sa mai apara
--    eroarea de WHERE clause.
-- 3. Un copil in Clasa 12, dupa incrementare, ajunge in "Absolvent"; daca
--    apoi decrementezi anul scolar, se intoarce corect in Clasa 12.
-- ----------------------------------------------------------------------------
