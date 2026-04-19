# Plan des nouvelles integrations - KLARA

> Principe fondamental : KLARA enregistre et rapporte les flux financiers.
> KLARA ne touche jamais l'argent.

Roadmap etablie le 19 avril 2026 - KLARA v2

---

## Phase 1 - Maintenant

### Integrations inter-modules

| Integration | Effort | Description |
|-------------|--------|-------------|
| Ventes -> stocks | 2-3 j | Une vente enregistree decremente automatiquement le stock du produit vendu |
| Achats -> fournisseurs | 2-3 j | Un achat cree une dette fournisseur et alimente la tresorerie en temps reel |
| Factures -> tresorerie | 1-2 j | Chaque paiement confirme met a jour le solde de tresorerie instantanement |

Priorite absolue : les modules doivent cesser d'etre des CRUD isoles et devenir un systeme coherent.

### Notifications et alertes

| Integration | Effort | Description |
|-------------|--------|-------------|
| WhatsApp Business API | 3-5 j | Rappel automatique quand une facture arrive a echeance ou est en retard |
| Email - Resend | 1 j | Envoi de factures, recus et rappels (tier gratuit utile au demarrage) |
| Alertes stock bas | 1 j | Notification interne + email quand un article passe sous un seuil configurable |

Notes produit :
- WhatsApp est le canal prioritaire PME (fort taux d'ouverture terrain).
- Resend est simple a integrer, fiable, et tres adapte a Next.js/TypeScript.

---

## Phase 2 - Dans 2-3 mois

### Conformite fiscale UEMOA

| Integration | Effort | Description |
|-------------|--------|-------------|
| Export declaration DGI | 5-7 j | Declaration TVA/IBIC pre-remplie, prete a depot DGI Togo |
| Bordereau CNSS | 3-4 j | Bordereau mensuel calcule depuis les fiches paie |
| Calendrier fiscal | 2 j | Rappels automatiques avant chaque echeance fiscale |

Objectif : transformer KLARA de calculateur en outil de conformite operationnelle.

### Portail client et partage

| Integration | Effort | Description |
|-------------|--------|-------------|
| Lien facture public | 2-3 j | URL partageable : facture + coordonnees de paiement du commercant |
| Signature devis en ligne | 3-4 j | Signature client avec date/IP de validation |
| Export PDF factures/devis | 1-2 j | PDF propre et brande avec logo organisation |

Flux cible Mobile Money (hors KLARA) :

```text
KLARA genere la facture
  -> envoi lien WhatsApp/email
    -> client voit montant + numero Flooz/T-Money du commercant
      -> client paie directement hors KLARA
        -> commercant confirme le paiement dans KLARA
          -> tresorerie mise a jour
```

Stack PDF recommandee :
- Puppeteer (headless) via endpoint Next.js
- ou @react-pdf/renderer (100% JavaScript)

---

## Phase 3 - Dans 4-6 mois

### Comptabilite SYSCOHADA

| Integration | Effort | Description |
|-------------|--------|-------------|
| Journal des ecritures | 2-3 sem | Partie double selon plan SYSCOHADA revise |
| Grand livre et balance | 1-2 sem | Restitution comptable prete expert-comptable |
| Bilan et compte de resultat | 1-2 sem | Etats financiers annuels conformes SYSCOHADA |

Exemples de generation d'ecritures :
- Vente -> 411 Clients / 701 Ventes de marchandises
- Achat -> 601 Achats / 401 Fournisseurs
- Salaire -> 661 Remunerations / 421 Remunerations dues
- Declaration TVA -> 4431 TVA facturee / 5... Tresorerie

### Connecteurs tiers (lecture seule)

| Integration | Effort | Description |
|-------------|--------|-------------|
| Flooz / T-Money (lecture) | Selon API | Import releves Mobile Money pour rapprochement |
| Releve bancaire auto (BSIC, UTB) | Selon API | Import mouvements bancaires pour reconciliation |
| API publique KLARA | 1-2 sem | Endpoints REST documentes pour Excel, Power BI, app mobile |

Principe lecture seule :
- Import et rapprochement uniquement
- Aucune initiation de paiement
- Aucun stockage de credentials bancaires
- Aucun transit de fonds

---

## Recapitulatif

| Phase | Quand | Priorite | Ce que ca change |
|-------|-------|----------|------------------|
| Inter-modules + alertes | Maintenant | Critique | KLARA devient un systeme coherent |
| Fiscalite + portail client | 2-3 mois | Haute | Differenciation UEMOA |
| SYSCOHADA + connecteurs | 4-6 mois | Strategique | KLARA devient ERP |

## Ce que KLARA n'integrera jamais

- Traitement de paiements (agregateur Mobile Money)
- Stockage de fonds pour compte de tiers
- Tout ce qui exige une licence BCEAO

Ces points sont un choix strategique pour eviter la complexite compliance et accelerer le produit.
