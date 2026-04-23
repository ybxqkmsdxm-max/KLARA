import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession, requireRole } from "@/lib/auth-helper";

/**
 * GET /api/dashboard/stats
 */
export async function GET() {
  try {
    const { error, organizationId, session } = await getAuthSession();
    if (error) return error;
    const roleError = await requireRole(organizationId, session.user.id, ["OWNER", "ADMIN"]);
    if (roleError) return roleError;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const confirmedPaymentStatuses = ["CONFIRME", "CONFIRMED"];

    const [paymentsThisMonth, expensesThisMonth, paymentsPrevMonth, allInvoices, clientsWithInvoices] = await Promise.all([
      db.payment.aggregate({
        where: { organizationId, status: { in: confirmedPaymentStatuses }, paidAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      db.expense.aggregate({
        where: { organizationId, date: { gte: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: { organizationId, status: { in: confirmedPaymentStatuses }, paidAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
        _sum: { amount: true },
      }),
      db.invoice.findMany({ where: { organizationId }, include: { client: true, payments: true } }),
      db.client.findMany({ where: { organizationId, deletedAt: null }, include: { invoices: { where: { organizationId }, include: { payments: true } } } }),
    ]);

    const encaissementsMois = paymentsThisMonth._sum.amount ?? 0;
    const depensesMois = expensesThisMonth._sum.amount ?? 0;
    const encaissementsMoisPrecedent = paymentsPrevMonth._sum.amount ?? 0;
    const soldeEstime = encaissementsMois - depensesMois;
    const variation = encaissementsMoisPrecedent > 0 ? Math.round(((encaissementsMois - encaissementsMoisPrecedent) / encaissementsMoisPrecedent) * 100) : encaissementsMois > 0 ? 100 : 0;

    const enAttente = allInvoices.filter((i) => i.status === "ENVOYEE");
    const enRetard = allInvoices.filter((i) => i.status === "EN_RETARD");
    const payees = allInvoices.filter((i) => i.status === "PAYEE");
    const montantEnRetard = enRetard.reduce((s, i) => s + i.total, 0);
    const montantEnAttente = enAttente.reduce((s, i) => s + i.total, 0);
    const tauxRecouvrement = allInvoices.length > 0 ? Math.round((payees.length / allInvoices.length) * 100) : 0;

    const topClients = clientsWithInvoices
      .map((c) => ({
        clientId: c.id, name: c.name,
        totalFacture: c.invoices.reduce((s, i) => s + i.total, 0),
        totalPaye: c.invoices.reduce((s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0), 0),
        nombreFactures: c.invoices.length,
      }))
      .sort((a, b) => b.totalFacture - a.totalFacture)
      .slice(0, 5);

    // Flux mensuels — Promise.all() fix for N+1
    const moisNoms = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
    const fluxMensuels = await Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        return Promise.all([
          db.payment.aggregate({
            where: { organizationId, status: { in: confirmedPaymentStatuses }, paidAt: { gte: start, lt: end } },
            _sum: { amount: true },
          }),
          db.expense.aggregate({
            where: { organizationId, date: { gte: start, lt: end } },
            _sum: { amount: true },
          }),
        ]).then(([mp, me]) => ({
          mois: moisNoms[d.getMonth()],
          encaissements: mp._sum.amount ?? 0,
          depenses: me._sum.amount ?? 0,
        }));
      })
    );

    const recentInvoices = await db.invoice.findMany({
      where: { organizationId },
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
