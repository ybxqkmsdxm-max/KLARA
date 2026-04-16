import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/dashboard/stats
 * Statistiques du tableau de bord pour l'organisation démo
 */
export async function GET() {
  try {
    const organization = await db.organization.findUnique({
      where: { clerkOrgId: "org_demo_klara" },
    });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Encaissements du mois
    const paymentsThisMonth = await db.payment.findMany({
      where: { organizationId: organization.id, status: "CONFIRME", paidAt: { gte: thirtyDaysAgo } },
    });
    const encaissementsMois = paymentsThisMonth.reduce((s, p) => s + p.amount, 0);

    // Dépenses du mois
    const expensesThisMonth = await db.expense.findMany({
      where: { organizationId: organization.id, date: { gte: thirtyDaysAgo } },
    });
    const depensesMois = expensesThisMonth.reduce((s, e) => s + e.amount, 0);

    // Variation vs mois précédent
    const paymentsPrevMonth = await db.payment.findMany({
      where: { organizationId: organization.id, status: "CONFIRME", paidAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    });
    const encaissementsMoisPrecedent = paymentsPrevMonth.reduce((s, p) => s + p.amount, 0);
    const soldeEstime = encaissementsMois - depensesMois;
    const variation = encaissementsMoisPrecedent > 0 ? Math.round(((encaissementsMois - encaissementsMoisPrecedent) / encaissementsMoisPrecedent) * 100) : encaissementsMois > 0 ? 100 : 0;

    // Factures
    const allInvoices = await db.invoice.findMany({
      where: { organizationId: organization.id },
      include: { client: true, payments: true },
    });
    const enAttente = allInvoices.filter((i) => i.status === "ENVOYEE");
    const enRetard = allInvoices.filter((i) => i.status === "EN_RETARD");
    const payees = allInvoices.filter((i) => i.status === "PAYEE");
    const montantEnRetard = enRetard.reduce((s, i) => s + i.total, 0);
    const montantEnAttente = enAttente.reduce((s, i) => s + i.total, 0);
    const tauxRecouvrement = allInvoices.length > 0 ? Math.round((payees.length / allInvoices.length) * 100) : 0;

    // Top clients
    const clientsWithInvoices = await db.client.findMany({
      where: { organizationId: organization.id },
      include: { invoices: { where: { organizationId: organization.id }, include: { payments: true } } },
    });
    const topClients = clientsWithInvoices
      .map((c) => ({
        clientId: c.id, name: c.name,
        totalFacture: c.invoices.reduce((s, i) => s + i.total, 0),
        totalPaye: c.invoices.reduce((s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0), 0),
        nombreFactures: c.invoices.length,
      }))
      .sort((a, b) => b.totalFacture - a.totalFacture)
      .slice(0, 5);

    // Flux mensuels (6 derniers mois)
    const fluxMensuels = [];
    const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const mp = await db.payment.findMany({ where: { organizationId: organization.id, status: "CONFIRME", paidAt: { gte: start, lt: end } } });
      const me = await db.expense.findMany({ where: { organizationId: organization.id, date: { gte: start, lt: end } } });
      fluxMensuels.push({ mois: moisNoms[d.getMonth()], encaissements: mp.reduce((s, p) => s + p.amount, 0), depenses: me.reduce((s, e) => s + e.amount, 0) });
    }

    // Dernières factures
    const recentInvoices = await db.invoice.findMany({
      where: { organizationId: organization.id },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      tresorerie: { soldeEstime, encaissementsMois, depensesMois, variation },
      factures: { total: allInvoices.length, enAttente: enAttente.length, enRetard: enRetard.length, montantEnRetard, montantEnAttente, tauxRecouvrement },
      topClients,
      fluxMensuels,
      recentInvoices: recentInvoices.map((inv) => ({ id: inv.id, number: inv.number, status: inv.status, total: inv.total, issueDate: inv.issueDate, dueDate: inv.dueDate, clientName: inv.client.name })),
    });
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
