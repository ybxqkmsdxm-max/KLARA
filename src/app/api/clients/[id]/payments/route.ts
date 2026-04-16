import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/clients/[id]/payments — Historique des paiements d'un client
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const organization = await db.organization.findUnique({
      where: { clerkOrgId: "org_demo_klara" },
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const client = await db.client.findFirst({
      where: {
        id,
        organizationId: organization.id,
        deletedAt: null,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    // Fetch all payments through client's invoices
    const invoices = await db.invoice.findMany({
      where: {
        clientId: client.id,
        organizationId: organization.id,
      },
      include: {
        payments: {
          orderBy: { paidAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten payments with invoice info
    const payments: Array<{
      id: string;
      amount: number;
      method: string;
      status: string;
      paidAt: string;
      invoiceNumber: string;
      invoiceId: string;
      invoiceStatus: string;
    }> = [];

    let totalPayments = 0;

    for (const invoice of invoices) {
      for (const payment of invoice.payments) {
        payments.push({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt.toISOString(),
          invoiceNumber: invoice.number,
          invoiceId: invoice.id,
          invoiceStatus: invoice.status,
        });
        totalPayments += payment.amount;
      }
    }

    // Sort all payments by date descending
    payments.sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );

    return NextResponse.json({
      payments,
      totalPayments,
      totalPaymentsCount: payments.length,
    });
  } catch (error) {
    console.error("Erreur paiements client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
