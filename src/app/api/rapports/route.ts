import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/rapports
 * Données analytiques financières pour la page Rapports de KLARA
 * Org ID : org_demo_klara (hardcodé)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "tout";

    // ── Organisation ──────────────────────────────────────────────────────────
    const organization = await db.organization.findUnique({
      where: { clerkOrgId: "org_demo_klara" },
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const orgId = organization.id;
    const now = new Date();

    // ── Date range helpers ────────────────────────────────────────────────────
    const getDateRange = (r: string) => {
      switch (r) {
        case "mois": {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          return { start, end: now };
        }
        case "trimestre": {
          const q = Math.floor(now.getMonth() / 3);
          const start = new Date(now.getFullYear(), q * 3, 1);
          return { start, end: now };
        }
        case "annee": {
          const start = new Date(now.getFullYear(), 0, 1);
          return { start, end: now };
        }
        default:
          return null; // "tout" → pas de filtre
      }
    };

    const dateRange = getDateRange(range);
    const invoiceWhere: Record<string, unknown> = { organizationId: orgId };
    const expenseWhere: Record<string, unknown> = { organizationId: orgId };
    const paymentWhere: Record<string, unknown> = {
      organizationId: orgId,
      status: "CONFIRME",
    };

    if (dateRange) {
      invoiceWhere.issueDate = { gte: dateRange.start, lte: dateRange.end };
      expenseWhere.date = { gte: dateRange.start, lte: dateRange.end };
      paymentWhere.paidAt = { gte: dateRange.start, lte: dateRange.end };
    }

    // ── 1. Monthly revenue breakdown (6 derniers mois) ───────────────────────
    const moisNoms = [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Jul",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ];

    const revenueMensuelle: Array<{
      mois: string;
      moisIndex: number;
      factures: number;
      encaissements: number;
    }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const [monthInvoices, monthPayments] = await Promise.all([
        db.invoice.findMany({
          where: {
            organizationId: orgId,
            issueDate: { gte: start, lt: end },
            status: { notIn: ["BROUILLON", "ANNULEE"] },
          },
        }),
        db.payment.findMany({
          where: {
            organizationId: orgId,
            status: "CONFIRME",
            paidAt: { gte: start, lt: end },
          },
        }),
      ]);

      revenueMensuelle.push({
        mois: moisNoms[d.getMonth()],
        moisIndex: d.getMonth(),
        factures: monthInvoices.reduce((s, inv) => s + inv.total, 0),
        encaissements: monthPayments.reduce((s, p) => s + p.amount, 0),
      });
    }

    // ── 2. Revenue by client (top clients) ───────────────────────────────────
    const clientsWithInvoices = await db.client.findMany({
      where: { organizationId: orgId },
      include: {
        invoices: {
          where: dateRange
            ? { organizationId: orgId, issueDate: { gte: dateRange.start, lte: dateRange.end } }
            : { organizationId: orgId },
          include: { payments: true },
        },
      },
    });

    const clientsPerformance = clientsWithInvoices
      .map((c) => {
        const nonDraftInvoices = c.invoices.filter(
          (inv) => inv.status !== "ANNULEE"
        );
        const totalFacture = nonDraftInvoices.reduce((s, inv) => s + inv.total, 0);
        const totalPaye = nonDraftInvoices.reduce(
          (s, inv) => s + inv.payments.reduce((ps, p) => ps + p.amount, 0),
          0
        );
        const nbFactures = nonDraftInvoices.length;
        const impaye = totalFacture - totalPaye;
        const tauxRecouvrement =
          totalFacture > 0 ? Math.round((totalPaye / totalFacture) * 100) : 0;

        return {
          clientId: c.id,
          name: c.name,
          totalFacture,
          totalPaye,
          impaye,
          nbFactures,
          tauxRecouvrement,
        };
      })
      .filter((c) => c.nbFactures > 0)
      .sort((a, b) => b.totalFacture - a.totalFacture);

    // ── 3. Expense categories breakdown ──────────────────────────────────────
    const allExpenses = await db.expense.findMany({
      where: expenseWhere,
    });

    const totalDepenses = allExpenses.reduce((s, e) => s + e.amount, 0);
    const depensesParCategorie: Array<{
      categorie: string;
      montant: number;
      pourcentage: number;
}> = [];

    const categoryMap = allExpenses.reduce(
      (acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
      },
      {} as Record<string, number>
    );

    for (const [cat, montant] of Object.entries(categoryMap)) {
      depensesParCategorie.push({
        categorie: cat,
        montant,
        pourcentage:
          totalDepenses > 0
            ? Math.round((montant / totalDepenses) * 1000) / 10
            : 0,
      });
    }

    depensesParCategorie.sort((a, b) => b.montant - a.montant);

    // ── 4. Invoice status distribution ───────────────────────────────────────
    const allInvoices = await db.invoice.findMany({
      where: invoiceWhere,
      include: { payments: true },
    });

    const statusDistribution: Array<{
      status: string;
      label: string;
      count: number;
      montant: number;
}> = [];

    const statusLabels: Record<string, string> = {
      BROUILLON: "Brouillon",
      ENVOYEE: "Envoyée",
      PAYEE: "Payée",
      EN_RETARD: "En retard",
      ANNULEE: "Annulée",
    };

    for (const status of Object.keys(statusLabels)) {
      const invoicesByStatus = allInvoices.filter(
        (inv) => inv.status === status
      );
      if (invoicesByStatus.length > 0) {
        statusDistribution.push({
          status,
          label: statusLabels[status],
          count: invoicesByStatus.length,
          montant: invoicesByStatus.reduce((s, inv) => s + inv.total, 0),
        });
      }
    }

    // ── 5. KPIs ──────────────────────────────────────────────────────────────
    // Total facturé (hors brouillon et annulée)
    const activeInvoices = allInvoices.filter(
      (inv) => !["BROUILLON", "ANNULEE"].includes(inv.status)
    );
    const chiffreAffaires = activeInvoices.reduce((s, inv) => s + inv.total, 0);

    // Total encaissé (via paiements confirmés)
    const rangePayments = await db.payment.findMany({
      where: paymentWhere,
    });
    const montantEncaisse = rangePayments.reduce((s, p) => s + p.amount, 0);

    // Taux de recouvrement
    const tauxRecouvrement =
      chiffreAffaires > 0
        ? Math.round((montantEncaisse / chiffreAffaires) * 1000) / 10
        : 0;

    // Montant en retard
    const facturesEnRetard = allInvoices.filter(
      (inv) => inv.status === "EN_RETARD"
    );
    const montantEnRetard = facturesEnRetard.reduce(
      (s, inv) => s + inv.total,
      0
    );

    // Valeur moyenne facture
    const valeurMoyenneFacture =
      activeInvoices.length > 0
        ? Math.round(chiffreAffaires / activeInvoices.length)
        : 0;

    // Délai moyen de paiement (en jours)
    const paidInvoices = allInvoices.filter(
      (inv) => inv.status === "PAYEE" && inv.paidAt
    );
    let delaiMoyenPaiement = 0;
    if (paidInvoices.length > 0) {
      const totalDelai = paidInvoices.reduce((s, inv) => {
        const diff =
          inv.paidAt!.getTime() - new Date(inv.issueDate).getTime();
        return s + diff / (1000 * 60 * 60 * 24);
      }, 0);
      delaiMoyenPaiement = Math.round(totalDelai / paidInvoices.length);
    }

    // Taux de fidélisation client
    const totalClients = clientsWithInvoices.length;
    const clientsActifs = clientsWithInvoices.filter(
      (c) => c.invoices.length > 0
    ).length;
    const clientsPlusieursFactures = clientsWithInvoices.filter(
      (c) =>
        c.invoices.filter((inv) => !["BROUILLON", "ANNULEE"].includes(inv.status)).length > 1
    ).length;
    const tauxFidelisation =
      clientsActifs > 0
        ? Math.round((clientsPlusieursFactures / clientsActifs) * 100)
        : 0;

    return NextResponse.json({
      kpis: {
        chiffreAffaires,
        montantEncaisse,
        tauxRecouvrement,
        montantEnRetard,
        valeurMoyenneFacture,
        delaiMoyenPaiement,
        tauxFidelisation,
      },
      revenueMensuelle,
      clientsPerformance,
      depensesParCategorie,
      totalDepenses,
      statusDistribution,
    });
  } catch (error) {
    console.error("Erreur rapports:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
