import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const updateMobileMoneyTxSchema = z.object({
  direction: z.enum(["IN", "OUT"]).optional(),
  operator: z.enum(["FLOOZ", "TMONEY", "WAVE", "MTN", "ORANGE"]).optional(),
  amount: z.number().int().positive().optional(),
  fees: z.number().int().min(0).optional(),
  phoneNumber: z.string().nullable().optional(),
  externalRef: z.string().nullable().optional(),
  linkedInvoiceId: z.string().nullable().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "FAILED", "REFUNDED"]).optional(),
  happenedAt: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.mobileMoneyTransaction.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Transaction non trouvee" }, { status: 404 });

    const body = await request.json();
    const parsed = updateMobileMoneyTxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.mobileMoneyTransaction.update({
      where: { id },
      data: {
        ...(data.direction ? { direction: data.direction } : {}),
        ...(data.operator ? { operator: data.operator } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.fees !== undefined ? { fees: data.fees } : {}),
        ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
        ...(data.externalRef !== undefined ? { externalRef: data.externalRef } : {}),
        ...(data.linkedInvoiceId !== undefined ? { linkedInvoiceId: data.linkedInvoiceId } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.happenedAt ? { happenedAt: new Date(data.happenedAt) } : {}),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/paiements/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.mobileMoneyTransaction.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Transaction non trouvee" }, { status: 404 });

    await db.mobileMoneyTransaction.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/paiements/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
