import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const updatePurchaseSchema = z.object({
  supplierName: z.string().min(1).optional(),
  status: z.enum(["BROUILLON", "EN_COURS", "RECU", "PAYE", "ANNULE"]).optional(),
  totalAmount: z.number().int().min(0).optional(),
  paidAmount: z.number().int().min(0).optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receivedAt: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.purchaseOrder.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Commande non trouvee" }, { status: 404 });

    const body = await request.json();
    const parsed = updatePurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const totalAmount = data.totalAmount ?? existing.totalAmount;
    const paidAmount = data.paidAmount ?? existing.paidAmount;

    const item = await db.purchaseOrder.update({
      where: { id },
      data: {
        ...(data.supplierName ? { supplierName: data.supplierName } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.totalAmount !== undefined ? { totalAmount: data.totalAmount } : {}),
        ...(data.paidAmount !== undefined ? { paidAmount: data.paidAmount } : {}),
        dueAmount: Math.max(0, totalAmount - paidAmount),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
        ...(data.receivedAt !== undefined ? { receivedAt: data.receivedAt ? new Date(data.receivedAt) : null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/achats/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.purchaseOrder.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Commande non trouvee" }, { status: 404 });

    await db.purchaseOrder.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/achats/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
