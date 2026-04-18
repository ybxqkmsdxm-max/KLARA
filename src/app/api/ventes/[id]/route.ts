import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const updateSaleSchema = z.object({
  clientName: z.string().nullable().optional(),
  status: z.enum(["BROUILLON", "CONFIRMEE", "ANNULEE", "REMBOURSEE"]).optional(),
  paymentMethod: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CARTE", "CREDIT"]).optional(),
  subtotalAmount: z.number().int().min(0).optional(),
  discountAmount: z.number().int().min(0).optional(),
  paidAmount: z.number().int().min(0).optional(),
  notes: z.string().nullable().optional(),
  soldAt: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.salesTransaction.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Vente non trouvee" }, { status: 404 });

    const body = await request.json();
    const parsed = updateSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const subtotalAmount = data.subtotalAmount ?? existing.subtotalAmount;
    const discountAmount = data.discountAmount ?? existing.discountAmount;
    const totalAmount = Math.max(0, subtotalAmount - discountAmount);
    const paidAmount = data.paidAmount ?? existing.paidAmount;

    const item = await db.salesTransaction.update({
      where: { id },
      data: {
        ...(data.clientName !== undefined ? { clientName: data.clientName } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.paymentMethod ? { paymentMethod: data.paymentMethod } : {}),
        ...(data.subtotalAmount !== undefined ? { subtotalAmount: data.subtotalAmount } : {}),
        ...(data.discountAmount !== undefined ? { discountAmount: data.discountAmount } : {}),
        totalAmount,
        paidAmount,
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.soldAt ? { soldAt: new Date(data.soldAt) } : {}),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/ventes/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.salesTransaction.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Vente non trouvee" }, { status: 404 });

    await db.salesTransaction.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/ventes/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
