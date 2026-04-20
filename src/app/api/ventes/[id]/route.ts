import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const cashMethodSchema = z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE", "CARTE"]);

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

function mapCashMethod(method: string) {
  const result = cashMethodSchema.safeParse(method);
  return result.success ? result.data : "ESPECES";
}

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
    const paidDelta = data.paidAmount !== undefined ? data.paidAmount - existing.paidAmount : 0;
    const nextStatus = data.status ?? existing.status;
    const nextMethod = data.paymentMethod ?? existing.paymentMethod;

    const item = await db.$transaction(async (tx) => {
      const updated = await tx.salesTransaction.update({
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

      if (paidDelta !== 0 && nextStatus === "CONFIRMEE") {
        await tx.cashTransaction.create({
          data: {
            organizationId,
            type: paidDelta > 0 ? "ENCAISSEMENT" : "REMBOURSEMENT",
            amount: Math.abs(paidDelta),
            method: mapCashMethod(nextMethod),
            description:
              paidDelta > 0
                ? `Ajustement encaissement vente ${updated.saleNumber}`
                : `Remboursement vente ${updated.saleNumber}`,
            reference: updated.saleNumber,
            happenedAt: data.soldAt ? new Date(data.soldAt) : new Date(),
          },
        });
      }

      return updated;
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

    await db.$transaction(async (tx) => {
      const movements = await tx.stockMovement.findMany({
        where: {
          organizationId,
          type: "SORTIE",
          reason: { contains: existing.saleNumber },
        },
      });

      const qtyByStockItem = new Map<string, number>();
      for (const movement of movements) {
        qtyByStockItem.set(
          movement.stockItemId,
          (qtyByStockItem.get(movement.stockItemId) ?? 0) + movement.quantity
        );
      }

      for (const [stockItemId, quantity] of qtyByStockItem.entries()) {
        await tx.stockItem.update({
          where: { id: stockItemId },
          data: { quantity: { increment: quantity } },
        });
      }

      if (movements.length > 0) {
        await tx.stockMovement.deleteMany({
          where: { id: { in: movements.map((movement) => movement.id) } },
        });
      }

      await tx.salesTransaction.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/ventes/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
