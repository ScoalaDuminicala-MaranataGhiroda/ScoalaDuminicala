# Școala Duminicală — Maranata Ghiroda

Aplicație PWA pentru gestiunea grupelor, copiilor, materialelor și
programărilor de la Școala Duminicală. React + TypeScript + Supabase,
hostată pe GitHub Pages.

Parola baza de date: T4SGkUu5gQd6X0nW

## Structură

```
supabase/
  schema.sql          — toate tabelele, funcțiile și RLS (rulează o dată în Supabase)
  CONFIGURARE.md       — pași de configurare Supabase

src/
  types/               — tipuri TypeScript (oglindesc schema SQL)
  lib/                 — client Supabase, utilitare (clase, export Excel)
  contexts/            — AuthContext (login, "ține-mă minte", sesiune)
  hooks/               — logica de acces la date, pe entitate (grupe, copii, ...)
  components/
    common/             — UI reutilizabil, Login, Layout cu navigație pe rol
    admin/              — toate paginile de administrator
    invatator/          — toate paginile de învățător
  AppRouter.tsx         — rutare pe rol (aici se adaugă un rol nou)

.github/workflows/deploy.yml  — deploy automat pe GitHub Pages
DEPLOYMENT.md                  — pași detaliați de publicare
```

## Pornire rapidă (dezvoltare locală)

```bash
npm install
cp .env.example .env
# editeaza .env cu URL-ul si cheia anon din Supabase (vezi supabase/CONFIGURARE.md)
npm run dev
```

## Publicare

Vezi `DEPLOYMENT.md` — recomandat: GitHub Actions (automat la fiecare push).

## Cum adaugi un rol nou (ex: "dirijor", "părinte")

Design-ul e explicit open-closed — nu trebuie modificat codul existent:

1. `supabase/schema.sql` → adaugă valoarea în constrângerea
   `check (rol in ('admin', 'invatator', ...))` de pe tabela `app_users`.
   Rulează din nou fișierul în Supabase SQL Editor (e sigur, nu duce la
   duplicate).
2. `src/types/index.ts` → adaugă rolul în tipul `Rol`.
3. Creează `src/components/<rol>/` cu paginile specifice noului rol.
4. `src/AppRouter.tsx` → adaugă un bloc `{user.rol === '<rol>' && (...)}`
   cu rutele lui.
5. `src/components/common/Layout.tsx` → adaugă intrarea în `NAV_PE_ROL`.

Niciun cod din modulele `admin` sau `invatator` nu trebuie atins.

## Note despre design

- **Autentificare proprie** (nu Supabase Auth) — cerință explicită: user/parolă
  text simplu, setate de admin, fără reset. RLS e activ dar permisiv (vezi
  explicația din `schema.sql`); protecția reală e la nivel de aplicație.
- **Zero fișiere binare** în Supabase — toate datele sunt text/numere;
  materialele de lecție rămân linkuri externe (Google Drive). Consumul de
  spațiu în baza de date va fi neglijabil față de limita planului free.
- **Salvare live** pe pagina "Lecția actuală" — fiecare bifă/număr introdus
  de învățător face un update imediat în Supabase; nu există concept de
  "salvare la final de zi", deci nu există risc de pierdere de date dacă
  se închide fila sau pică conexiunea.
