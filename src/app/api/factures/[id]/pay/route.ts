import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/factures/[id]/pay — Enregistrer un paiement sur une facture
 */
export async function POST(
  request: Request,
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
      include: { payments: true },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { amount, method, date, reference } = body;

    // Validation
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Le montant doit être supérieur à 0" },
        { status: 400 }
      );
    }

    const validMethods = ["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE", "CARTE", "AUTRE"];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json(
        { error: "Méthode de paiement invalide" },
        { status: 400 }
      );
    }

    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = invoice.total - currentPaid;

    if (amount > remaining) {
      return NextResponse.json(
        { error: `Le montant ne peut pas dépasser le reste à payer (${remaining} FCFA)` },
        { status: 400 }
      );
    }

    if (invoice.status === "PAYEE") {
      return NextResponse.json(
        { error: "Cette facture est déjà intégralement payée" },
        { status: 400 }
      );
    }

    if (invoice.status === "ANNULEE") {
      return NextResponse.json(
        { error: "Impossible d'enregistrer un paiement sur une facture annulée" },
        { status: 400 }
      );
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        organizationId: organization.id,
        invoiceId: invoice.id,
        amount,
        method,
        paidAt: date ? new Date(date) : new Date(),
        transactionId: reference || null,
      },
    });

    // Recalculate total paid
    const newPaid = currentPaid + amount;
    const isFullyPaid = newPaid >= invoice.total;

    // Update invoice
    const updatedInvoice = await db.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaid,
        status: isFullyPaid ? "PAYEE" : invoice.status,
        paidAt: isFullyPaid ? new Date() : invoice.paidAt,
      },
    });

    // Return updated payment info
    const updatedPayments = await db.payment.findMany({
      where: { invoiceId: invoice.id },
      orderBy: { paidAt: "desc" },
    });

    const totalPayments = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        paidAt: payment.paidAt.toISOString(),
      },
      invoice: {
        id: updatedInvoice.id,
        status: updatedInvoice.status,
        paidAmount: totalPayments,
        total: updatedInvoice.total,
        paidAt: updatedInvoice.paidAt?.toISOString() ?? null,
      },
      payments: updatedPayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erreur enregistrement paiement:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
