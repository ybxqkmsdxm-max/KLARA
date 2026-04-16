# Task 3: Rapports (Reports) Analytics Page

## Files Created/Modified

### 1. Created: `/src/app/api/rapports/route.ts`
- GET endpoint accepting `?range=mois|trimestre|annee|tout` query parameter
- Returns comprehensive financial analytics data:
  - **KPIs**: chiffreAffaires, montantEncaisse, tauxRecouvrement, montantEnRetard, valeurMoyenneFacture, delaiMoyenPaiement, tauxFidelisation
  - **Revenue mensuelle**: 6-month breakdown of factures vs encaissements per month
  - **Clients performance**: All clients with totalFacture, totalPaye, impaye, nbFactures, tauxRecouvrement
  - **Dépenses par catégorie**: Category, amount, percentage breakdown
  - **Statut des factures**: Count and amount per status (BROUILLON, ENVOYEE, PAYEE, EN_RETARD, ANNULEE)
- Uses Prisma to query Invoice, Client, Expense, Payment tables
- Organization hardcoded as `org_demo_klara`

### 2. Created: `/src/app/dashboard/rapports/page.tsx`
- `"use client"` page with full framer-motion page transitions
- **Header**: Title "Rapports financiers" with BarChart3 icon, date range Select dropdown, CSV export button
- **KPI Cards (4)**: Chiffre d'affaires, Montant encaissé, Taux de recouvrement, Montant en retard
- **Charts (2 columns)**:
  - Left: BarChart showing monthly revenue trend (factures in blue, encaissements in green)
  - Right: PieChart showing expense distribution by category
- **Bottom section (2 columns)**:
  - Left: Client performance table (top 5 with name, total facturé, payé, nb factures, taux recouvrement badge)
  - Right: Invoice status distribution with colored progress bars and summary
- **Additional KPIs**: Valeur moyenne facture, Délai moyen paiement, Fidélisation client
- Loading skeleton states for all sections
- Error state with retry button
- Client-side CSV export with UTF-8 BOM for French characters
- KLARA brand colors: #1A1A2E, #00D4AA, #FFB347, #FF6B6B
- Mobile-first responsive design
- All text in French

### 3. Modified: `/src/app/dashboard/layout.tsx`
- Added `BarChart3` import from lucide-react
- Added `{ href: "/dashboard/rapports", label: "Rapports", icon: BarChart3 }` to navItems (between Dépenses and Paramètres)
- Added `if (pathname.startsWith("/dashboard/rapports")) return "Rapports";` to getPageTitle

### 4. Modified: `/src/components/command-palette.tsx`
- Added `BarChart3` import from lucide-react
- Added Rapports entry to navigationItems with keywords: reports, analytics, statistiques, analyses, graphiques, chiffres

## Verification
- ESLint passes with no errors
- API endpoint returns correct data (tested with curl)
- Page loads with HTTP 200 at /dashboard/rapports
- Database seeded with demo data for testing
