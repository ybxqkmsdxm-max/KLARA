# Klara - Documentation projet (etat actuel)

## 1) Resume
Klara est une plateforme SaaS de gestion pour PME (focus UEMOA/Togo), construite avec Next.js App Router, Prisma (SQLite), NextAuth (credentials), et une interface dashboard modulaire.

Le projet couvre:
- Authentification et multi-tenant par `organizationId`
- Facturation, devis, clients, depenses, rapports
- Modules metier MVP additionnels: caisse, stocks, achats, ventes, paie, fiscalite, credit, activites, paiements mobile money

---

## 2) Stack technique
- Frontend: `Next.js 16`, `React 19`, `Tailwind`, `shadcn/ui`, `lucide-react`
- Backend API: `Next.js Route Handlers` (`src/app/api/**`)
- Auth: `NextAuth v4` (provider credentials)
- DB/ORM: `Prisma` + `SQLite` (`db/custom.db`)
- Validation: `zod`

---

## 3) Structure du repo
Racine utile:
- `src/` code applicatif
- `prisma/` schema Prisma
- `db/custom.db` base SQLite locale
- `public/` assets statiques
- `package.json` scripts npm
- `.env` variables locales

Routes principales:
- Public:
  - `/`
  - `/login`
  - `/register`
- Dashboard:
  - `/dashboard`
  - `/dashboard/factures`, `/dashboard/devis`, `/dashboard/clients`, `/dashboard/depenses`, `/dashboard/rapports`
  - `/dashboard/outils` (hub modules)
  - `/dashboard/caisse`, `/dashboard/stocks`, `/dashboard/achats`, `/dashboard/ventes`
  - `/dashboard/paie`, `/dashboard/fiscalite`, `/dashboard/credit`, `/dashboard/activites`, `/dashboard/paiements`

---

## 4) Authentification & multi-tenant
Fichiers:
- `src/lib/auth.ts`
- `src/lib/auth-helper.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`

Principes:
- Inscription cree 1 `Organization` + 1 `User` owner
- Login credentials (email/mot de passe hash bcrypt)
- Session JWT enrichie: `id`, `role`, `organizationId`, `organizationName`
- Toutes les APIs metier securisees lisent `organizationId` via `getAuthSession()`

---

## 5) Base de donnees (Prisma)
Fichier: `prisma/schema.prisma`

Tables coeur:
- `Organization`, `User`
- `Client`, `Invoice`, `InvoiceItem`, `Quote`, `QuoteItem`
- `Expense`, `Payment`, `ReminderLog`
- `OrganizationToolSelection`

Tables modules MVP ajoutees:
- Caisse: `CashTransaction`
- Stocks: `StockItem`, `StockMovement`
- Achats: `PurchaseOrder`
- Ventes: `SalesTransaction`
- Paie: `Employee`, `PayrollRun`
- Fiscalite: `TaxDeclaration`
- Credit: `CreditLoan`
- Activites: `Activity`, `ActivityTransfer`
- Paiements mobile money: `MobileMoneyTransaction`

---

## 6) APIs disponibles
### 6.1 Auth
- `POST /api/auth/register`
- `GET|POST /api/auth/[...nextauth]`

### 6.2 Coeur metier deja en place
- `GET|POST /api/clients`
- `GET|PATCH|DELETE /api/clients/[id]`
- `GET|POST /api/clients/[id]/payments`
- `GET|POST /api/factures`
- `GET|PATCH /api/factures/[id]`
- `POST /api/factures/[id]/pay`
- `GET|POST /api/devis`
- `GET|PATCH|DELETE /api/devis/[id]`
- `GET|POST /api/depenses`
- `PATCH|DELETE /api/depenses/[id]`
- `GET /api/dashboard/stats`
- `GET /api/rapports`
- `GET /api/export`
- `GET|PATCH /api/notifications/[id]`, `GET /api/notifications`
- `GET|PUT /api/outils/selection`

### 6.3 Modules MVP (backend ajoutes)
- `GET|POST /api/caisse`
- `GET|POST /api/stocks`
- `GET|POST /api/achats`
- `GET|POST /api/ventes`
- `GET|POST /api/paie`
- `GET|POST /api/fiscalite`
- `GET|POST /api/credit`
- `GET|POST /api/activites`
- `GET|POST /api/paiements`

---

## 7) Outils (hub)
Page: `src/app/dashboard/outils/page.tsx`

Fonction:
- Catalogue des outils modules
- Recherche
- Navigation par carte cliquable vers chaque page module

---

## 8) Scripts npm
`package.json`:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run db:push`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:reset`

Notes Windows:
- Le script `dev` utilise `tee` (non disponible nativement sous `cmd`).
- Alternative recommandee:
  - `npx next dev -p 3000`

---

## 9) Demarrage local (recommande)
1. Installer:
```bash
npm install
```
2. Synchroniser la DB:
```bash
npm run db:push
npm run db:generate
```
3. Lancer:
```bash
npx next dev -p 3000
```
4. Ouvrir:
- `http://localhost:3000`

---

## 10) Verification fonctionnelle recente
Valide:
- Build production `next build` OK
- Navigation dashboard/outils/modules OK
- Flux auth + session OK
- Flux metier coeur (client -> devis -> facture -> paiement -> stats/rapports) OK
- Flux API des 9 nouveaux modules (`POST` puis `GET`) OK avec compte test authentifie

---

## 11) Limites / prochaines etapes
- Les pages modules UI ne consomment pas encore toutes les nouvelles APIs (backend pret, branchement UI a finaliser).
- Ajouter `PUT/DELETE` pour les nouvelles routes modules.
- Ajouter pagination/filters avances sur nouveaux modules.
- Ajouter tests automatises e2e (Playwright/API contract).

---

## 12) Fichiers cles
- Auth:
  - `src/lib/auth.ts`
  - `src/lib/auth-helper.ts`
- DB:
  - `prisma/schema.prisma`
  - `src/lib/db.ts`
- Dashboard:
  - `src/app/dashboard/layout.tsx`
  - `src/app/dashboard/outils/page.tsx`
- Composants:
  - `src/components/module-workspace.tsx`
  - `src/components/command-palette.tsx`
- APIs modules:
  - `src/app/api/caisse/route.ts`
  - `src/app/api/stocks/route.ts`
  - `src/app/api/achats/route.ts`
  - `src/app/api/ventes/route.ts`
  - `src/app/api/paie/route.ts`
  - `src/app/api/fiscalite/route.ts`
  - `src/app/api/credit/route.ts`
  - `src/app/api/activites/route.ts`
  - `src/app/api/paiements/route.ts`

