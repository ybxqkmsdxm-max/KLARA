import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession, requireRole } from "@/lib/auth-helper";

/**
 * GET /api/rapports — N+1 fix: Promise.all() for monthly queries
 */
export async function GET(request: Request) {
  try {
    const { error, organizationId, session } = await getAuthSession();
    if (error) return error;
    const roleError = await requireRole(organizationId, session.user.id, ["OWNER", "ADMIN"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "tout";

    const now = new Date();
    const getDateRange = (r: string) => {
      switch (r) {
        case "mois": { const start = new Date(now.getFullYear(), now.getMonth(), 1); return { start, end: now }; }
        case "trimestre": { const q = Math.floor(now.getMonth() / 3); const start = new Date(now.getFullYear(), q * 3, 1); return { start, end: now }; }
        case "annee": { const start = new Date(now.getFullYear(), 0, 1); return { start, end: now }; }
        default: return null;
      }
    };

    const dateRange = getDateRange(range);
    const invoiceWhere: Record<string, unknown> = { organizationId };
    const expenseWhere: Record<string, unknown> = { organizationId };
    const paymentWhere: Record<string, unknown> = { organizationId, status: "CONFIRME" };

    if (dateRange) {
      invoiceWhere.issueDate = { gte: dateRange.start, lte: dateRange.end };
      expenseWhere.date = { gte: dateRange.start, lte: dateRange.end };
      paymentWhere.paidAt = { gte: dateRange.start, lte: dateRange.end };
    }

    const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

    // N+1 FIX: Use Promise.all() instead of sequential for-loop
    const revenueMensuelle = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        return Promise.all([
          db.invoice.findMany({ where: { organizationId, issueDate: { gte: start, lt: end }, status: { notIn: ["BROUILLON", "ANNULEE"] } } }),
          db.payment.findMany({ where: { organizationId, status: "CONFIRME", paidAt: { gte: start, lt: end } } }),
        ]).then(([monthInvoices, monthPayments]) => ({
          mois: moisNoms[d.getMonth()],
          moisIndex: d.getMonth(),
          factures: monthInvoices.reduce((s, inv) => s + inv.total, 0),
          encaissements: monthPayments.reduce((s, p) => s + p.amount, 0),
        }));
      })
    );

    const [clientsWithInvoices, allExpenses, allInvoices, rangePayments] = await Promise.all([
      db.client.findMany({
        where: { organizationId, deletedAt: null },
        include: {
          invoices: {
            where: dateRange ? { organizationId, issueDate: { gte: dateRange.start, lte: dateRange.end } } : { organizationId },
            include: { payments: true },
          },
        },
      }),
      db.expense.findMany({ where: expenseWhere }),
      db.invoice.findMany({ where: invoiceWhere, include: { payments: true } }),
      db.payment.findMany({ where: paymentWhere }),
    ]);

    const clientsPerformance = clientsWithInvoices
      .map((c) => {
        const nonDraftInvoices = c.invoices.filter((inv) => inv.status !== "ANNULEE");
        const totalFacture = nonDraftInvoices.reduce((s, inv) => s + inv.total, 0);
        const totalPaye = nonDraftInvoices.reduce((s, inv) => s + inv.payments.reduce((ps, p) => ps + p.amount, 0), 0);
        return { clientId: c.id, name: c.name, totalFacture, totalPaye, impaye: totalFacture - totalPaye, nbFactures: nonDraftInvoices.length, tauxRecouvrement: totalFacture > 0 ? Math.round((totalPaye / totalFacture) * 100) : 0 };
      })
      .filter((c) => c.nbFactures > 0)
      .sort((a, b) => b.totalFacture - a.totalFacture);

    const totalDepenses = allExpenses.reduce((s, e) => s + e.amount, 0);
    const categoryMap: Record<string, number> = {};
    allExpenses.forEach((e) => { categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount; });
    const depensesParCategorie = Object.entries(categoryMap).map(([categorie, montant]) => ({ categorie, montant, pourcentage: totalDepenses > 0 ? Math.round((montant / totalDepenses) * 1000) / 10 : 0 })).sort((a, b) => b.montant - a.montant);

    const statusLabels: Record<string, string> = { BROUILLON: "Brouillon", ENVOYEE: "Envoyée", PAYEE: "Payée", EN_RETARD: "En retard", ANNULEE: "Annulée" };
    const statusDistribution = Object.entries(statusLabels)
      .map(([status, label]) => { const invs = allInvoices.filter((inv) => inv.status === status); return invs.length > 0 ? { status, label, count: invs.length, montant: invs.reduce((s, inv) => s + inv.total, 0) } : null; })
      .filter(Boolean);

    const activeInvoices = allInvoices.filter((inv) => !["BROUILLON", "ANNULEE"].includes(inv.status));
    const chiffreAffaires = activeInvoices.reduce((s, inv) => s + inv.total, 0);
    const montantEncaisse = rangePayments.reduce((s, p) => s + p.amount, 0);
    const tauxRecouvrement = chiffreAffaires > 0 ? Math.round((montantEncaisse / chiffreAffaires) * 1000) / 10 : 0;
    const montantEnRetard = allInvoices.filter((inv) => inv.status === "EN_RETARD").reduce((s, inv) => s + inv.total, 0);
    const valeurMoyenneFacture = activeInvoices.length > 0 ? Math.round(chiffreAffaires / activeInvoices.length) : 0;

    const paidInvoices = allInvoices.filter((inv) => inv.status === "PAYEE" && inv.paidAt);
    const delaiMoyenPaiement = paidInvoices.length > 0 ? Math.round(paidInvoices.reduce((s, inv) => s + (inv.paidAt!.getTime() - new Date(inv.issueDate).getTime()) / (1000 * 60 * 60 * 24), 0) / paidInvoices.length) : 0;

    const totalClients = clientsWithInvoices.length;
    const clientsActifs = clientsWithInvoices.filter((c) => c.invoices.length > 0).length;
    const clientsPlusieursFactures = clientsWithInvoices.filter((c) => c.invoices.filter((inv) => !["BROUILLON", "ANNULEE"].includes(inv.status)).length > 1).length;
    const tauxFidelisation = clientsActifs > 0 ? Math.round((clientsPlusieursFactures / clientsActifs) * 100) : 0;

    return NextResponse.json({
      kpis: { chiffreAffaires, montantEncaisse, tauxRecouvrement, montantEnRetard, valeurMoyenneFacture, delaiMoyenPaiement, tauxFidelisation },
      revenueMensuelle, clientsPerformance, depensesParCategorie, totalDepenses, statusDistribution,
    });
  } catch (error) {
    console.error("Erreur rapports:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
