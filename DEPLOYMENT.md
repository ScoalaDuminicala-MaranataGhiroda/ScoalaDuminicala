# Deployment pe GitHub Pages

Ai două variante. Recomand varianta A (automată) — o dată configurată, orice
push pe `main` republică aplicația singur.

## Varianta A — automat, cu GitHub Actions (recomandat)

### 1. Creează un repository nou pe GitHub

Ex: `scoala-duminicala` (dacă alegi alt nume, schimbă `REPO_NAME` din
`vite.config.ts` să corespundă exact).

### 2. Urcă codul

```bash
cd scoala-duminicala
git init
git add .
git commit -m "Inițializare aplicație Școala Duminicală"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

### 3. Adaugă secretele Supabase în repository

GitHub → repository-ul tău → **Settings** → **Secrets and variables** →
**Actions** → **New repository secret**. Adaugă două secrete:

- `VITE_SUPABASE_URL` → valoarea din Supabase (Project Settings → API)
- `VITE_SUPABASE_ANON_KEY` → cheia anon din Supabase

Aceste secrete sunt folosite doar în timpul build-ului (fișierul
`.github/workflows/deploy.yml` e deja inclus în proiect) — nu ajung
niciodată expuse ca fișier `.env` în repository.

### 4. Activează GitHub Pages cu sursă "GitHub Actions"

Repository → **Settings** → **Pages** → la **Source**, alege
**GitHub Actions** (nu "Deploy from a branch").

### 5. Declanșează primul deploy

Orice push nou pe `main` pornește automat workflow-ul. Poți urmări progresul
în tab-ul **Actions** al repository-ului. La final, aplicația va fi
disponibilă la:

```
https://<user>.github.io/<repo>/
```

## Varianta B — manual, cu pachetul `gh-pages`

Mai simplu de pornit, dar trebuie rulat manual de fiecare dată când vrei să
publici o actualizare.

```bash
# o singura data: seteaza cheile local
cp .env.example .env
# editeaza .env cu valorile tale reale din Supabase

npm install
npm run deploy
```

Comanda `npm run deploy` face build și publică automat folderul `dist` pe
branch-ul `gh-pages` (are nevoie de pachetul `gh-pages`, deja în
`devDependencies`). Apoi în **Settings → Pages**, la **Source**, alege
**Deploy from a branch** → branch `gh-pages` → folder `/ (root)`.

**Atenție**: cu această variantă, cheile Supabase ajung incluse în build-ul
JavaScript din branch-ul `gh-pages` (asta e oricum inevitabil pentru orice
site static — cheia `anon` e făcută să fie publică). Nu urca niciodată
fișierul `.env` propriu-zis pe `main`.

## Verificare după deploy

1. Deschide URL-ul aplicației.
2. Ar trebui să vezi ecranul de login.
3. Loghează-te cu `admin` / `admin`.
4. Dacă vezi o eroare de conexiune, verifică Console-ul browserului
   (F12) — cel mai probabil cheile Supabase nu sunt corecte sau RLS-ul
   nu a fost activat corect (revezi `supabase/CONFIGURARE.md`).

## Instalare ca aplicație (PWA)

Odată publicată, aplicația poate fi "instalată" ca aplicație nativă:
- **Pe telefon (Android/Chrome)**: meniul browserului → "Adaugă pe ecranul
  principal" / "Instalează aplicația".
- **Pe iPhone (Safari)**: butonul de share → "Adaugă pe ecranul principal".
- **Pe laptop (Chrome/Edge)**: iconița de instalare din bara de adrese.
