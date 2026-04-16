import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/factures/[id] - Détail complet d'une facture
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

    const invoice = await db.invoice.findFirst({
      where: { id, organizationId: organization.id },
      include: {
        client: true,
        items: { orderBy: { order: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      );
    }

    const totalPayments = invoice.payments.reduce(
      (sum: number, p: { amount: number }) => sum + p.amount,
      0
    );

    return NextResponse.json({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      paidAmount: totalPayments,
      currency: invoice.currency,
      notes: invoice.notes,
      termsAndConditions: invoice.termsAndConditions,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      sentAt: invoice.sentAt?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      client: {
        id: invoice.client.id,
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        type: invoice.client.type,
      },
      items: invoice.items.map(
        (item: {
          id: string;
          description: string;
          quantity: number;
          unitPrice: number;
          total: number;
        }) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })
      ),
      payments: invoice.payments.map(
        (p: {
          id: string;
          amount: number;
          method: string;
          status: string;
          paidAt: Date;
        }) => ({
          id: p.id,
          amount: p.amount,
          method: p.method,
          status: p.status,
          paidAt: p.paidAt.toISOString(),
        })
      ),
    });
  } catch (error) {
    console.error("Erreur détail facture:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
