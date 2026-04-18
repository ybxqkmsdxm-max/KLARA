import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { z } from "zod";

const createPaymentSchema = z.object({
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  method: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE", "CARTE", "AUTRE", "MANUEL"]),
  date: z.string().optional(),
  reference: z.string().optional(),
});

/**
 * POST /api/factures/[id]/pay
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const result = createPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { amount, method, date, reference } = result.data;

    const invoice = await db.invoice.findFirst({
      where: { id, organizationId },
      include: { payments: true },
    });

    if (!invoice) return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    if (invoice.status === "PAYEE") return NextResponse.json({ error: "Cette facture est déjà payée" }, { status: 400 });
    if (invoice.status === "ANNULEE") return NextResponse.json({ error: "Facture annulée" }, { status: 400 });

    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (amount > invoice.total - currentPaid) {
      return NextResponse.json({ error: `Le montant dépasse le reste à payer` }, { status: 400 });
    }

    const payment = await db.payment.create({
      data: {
        organizationId,
        invoiceId: invoice.id,
        amount,
        method,
        paidAt: date ? new Date(date) : new Date(),
        transactionId: reference || null,
      },
    });

    const newPaid = currentPaid + amount;
    const isFullyPaid = newPaid >= invoice.total;

    await db.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaid,
        status: isFullyPaid ? "PAYEE" : invoice.status,
        paidAt: isFullyPaid ? new Date() : invoice.paidAt,
      },
    });

    const updatedPayments = await db.payment.findMany({ where: { invoiceId: invoice.id }, orderBy: { paidAt: "desc" } });
    const totalPayments = updatedPayments.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      payment: { id: payment.id, amount: payment.amount, method: payment.method, status: payment.status, paidAt: payment.paidAt.toISOString() },
      invoice: { id: invoice.id, status: isFullyPaid ? "PAYEE" : invoice.status, paidAmount: totalPayments, total: invoice.total },
      payments: updatedPayments.map((p) => ({ id: p.id, amount: p.amount, method: p.method, status: p.status, paidAt: p.paidAt.toISOString() })),
    });
  } catch (error) {
    console.error("Erreur paiement:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
