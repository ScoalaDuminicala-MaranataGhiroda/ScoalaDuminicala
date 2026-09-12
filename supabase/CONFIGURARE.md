# Configurare Supabase

## 1. Creează proiectul (dacă nu-l ai deja pe cel existent)

Dacă vrei să folosești baza de date pe care o ai deja (recomandat, ca să nu
consumi al doilea proiect gratuit): intră direct pe proiectul existent,
Supabase permite mai multe "schema"-uri / seturi de tabele în același proiect,
atât timp cât numele tabelelor nu se suprapun cu ce ai deja acolo.

Dacă vrei proiect nou:
1. https://supabase.com/dashboard → **New project**
2. Alege un nume (ex: `scoala-duminicala-maranata`), o parolă pentru DB
   (nu are legătură cu userii aplicației) și regiunea cea mai apropiată
   (ex: `eu-central-1`).
3. Așteaptă ~2 minute să se creeze proiectul.

## 2. Rulează schema SQL

1. În dashboard, mergi la **SQL Editor** (iconița din stânga).
2. **New query**.
3. Deschide fișierul `supabase/schema.sql` din acest proiect, copiază tot
   conținutul și lipește-l în editor.
4. Apasă **Run** (sau Ctrl+Enter).
5. Ar trebui să vezi "Success. No rows returned." — asta înseamnă că toate
   tabelele, funcțiile și regulile de securitate au fost create.

Poți rula fișierul din nou oricând fără probleme — toate comenzile sunt
scrise cu `if not exists` / `on conflict do nothing`, deci nu vei duplica date.

## 3. Verifică tabelele create

Mergi la **Table Editor** din stânga — ar trebui să vezi tabelele:
`app_users`, `clase_scolare`, `setari_an_scolar`, `grupe`, `grupe_clase`,
`grupe_invatatori`, `copii`, `materiale`, `programari`, `programari_ajutoare`,
`lectii_parcurse`, `lectii_parcurse_ajutoare`, `lectii_copii`.

În `app_users` ar trebui să existe deja un rând: `admin` / `admin` / rol `admin`.

## 4. Ia cheile de conectare

1. Mergi la **Project Settings** (iconița rotiță, jos în stânga) → **API**.
2. Copiază:
   - **Project URL** (arată ca `https://xxxxxxxxxxxx.supabase.co`)
   - **anon public** key (un string lung, JWT)

## 5. Configurează aplicația

În rădăcina proiectului React, creează un fișier `.env` (copiază din
`.env.example`) cu:

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...................
```

**Nu urca fișierul `.env` pe GitHub** (e deja în `.gitignore`). Pentru
deployment pe GitHub Pages, aceste chei trebuie puse ca **GitHub Secrets**
(vezi `DEPLOYMENT.md`), pentru că build-ul static le include în JS —
cheia `anon` e făcută să fie publică (protecția reală vine din RLS), dar
tot e bine să nu fie hardcodată direct în commit-uri.

## 6. (Opțional) Restricționează accesul la proiect

Dacă vrei un nivel suplimentar de siguranță dincolo de user/parolă din
aplicație: în **Authentication → Policies**, RLS e deja activ pe toate
tabelele cu o politică permisivă (orice cerere cu cheia anon poate citi/scrie).
Aceasta e o alegere deliberată explicată în `schema.sql` — aplicația face
propriul login, nu Supabase Auth. Dacă în viitor vrei protecție mai strictă,
va trebui migrat la Supabase Auth real (necesită schimbări suplimentare).

## 7. Spațiu de stocare folosit

Acest design **nu stochează niciun fișier binar** în Supabase — nici poze,
nici PDF-uri. Totul e text/numere în tabele obișnuite Postgres, plus
link-uri (text) către Google Drive pentru materialele fiecărei grupe. Chiar
și cu sute de copii și mii de înregistrări de lecții, dimensiunea totală va
fi de ordinul a câțiva MB — o fracțiune infimă din limita de 500MB (planul
free Supabase are 500MB storage DB per proiect, nu 500GB — verifică în
Project Settings → Usage cât mai ai disponibil pe proiectul existent).
