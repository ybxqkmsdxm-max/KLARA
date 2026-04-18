import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const updateCashTransactionSchema = z.object({
  type: z.enum(["ENCAISSEMENT", "DECAISSEMENT", "REMBOURSEMENT", "AJUSTEMENT"]).optional(),
  amount: z.number().int().positive("Le montant doit etre positif").optional(),
  method: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE", "CARTE"]).optional(),
  description: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  happenedAt: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.cashTransaction.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Transaction non trouvee" }, { status: 404 });

    const body = await request.json();
    const parsed = updateCashTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.cashTransaction.update({
      where: { id },
      data: {
        ...(data.type ? { type: data.type } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.method ? { method: data.method } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.reference !== undefined ? { reference: data.reference } : {}),
        ...(data.happenedAt ? { happenedAt: new Date(data.happenedAt) } : {}),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/caisse/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.cashTransaction.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Transaction non trouvee" }, { status: 404 });

    await db.cashTransaction.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/caisse/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
