import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { z } from "zod";

const createPaymentSchema = z.object({
  amount: z.number().min(0.01, "Le montant doit etre superieur a 0"),
  method: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE", "CARTE", "AUTRE", "MANUEL"]),
  date: z.string().optional(),
  reference: z.string().optional(),
});

function mapCashMethod(method: string): "ESPECES" | "MOBILE_MONEY" | "VIREMENT" | "CHEQUE" | "CARTE" {
  if (method === "MOBILE_MONEY") return "MOBILE_MONEY";
  if (method === "VIREMENT") return "VIREMENT";
  if (method === "CHEQUE") return "CHEQUE";
  if (method === "CARTE") return "CARTE";
  return "ESPECES";
}

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
        { error: "Donnees invalides", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { amount, method, date, reference } = result.data;

    const invoice = await db.invoice.findFirst({
      where: { id, organizationId },
      include: { payments: true },
    });

    if (!invoice) return NextResponse.json({ error: "Facture non trouvee" }, { status: 404 });
    if (invoice.status === "PAYEE") return NextResponse.json({ error: "Cette facture est deja payee" }, { status: 400 });
    if (invoice.status === "ANNULEE") return NextResponse.json({ error: "Facture annulee" }, { status: 400 });

    const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
    if (amount > invoice.total - currentPaid) {
      return NextResponse.json({ error: "Le montant depasse le reste a payer" }, { status: 400 });
    }

    const paymentDate = date ? new Date(date) : new Date();
    const { payment, isFullyPaid } = await db.$transaction(async (tx) => {
      const createdPayment = await tx.payment.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          amount,
          method,
          paidAt: paymentDate,
          transactionId: reference || null,
        },
      });

      const newPaid = currentPaid + amount;
      const fullyPaid = newPaid >= invoice.total;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaid,
          status: fullyPaid ? "PAYEE" : invoice.status,
          paidAt: fullyPaid ? new Date() : invoice.paidAt,
        },
      });

      await tx.cashTransaction.create({
        data: {
          organizationId,
          type: "ENCAISSEMENT",
          amount,
          method: mapCashMethod(method),
          description: `Paiement facture ${invoice.number}`,
          reference: reference || invoice.number,
          happenedAt: paymentDate,
        },
      });

      return { payment: createdPayment, isFullyPaid: fullyPaid };
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
