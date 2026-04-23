import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const cashMethodSchema = z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE", "CARTE"]);

const purchaseStockLineSchema = z.object({
  stockItemId: z.string().min(1, "Article de stock requis"),
  quantity: z.number().int().positive("Quantite invalide"),
  unitCost: z.number().int().min(0).optional(),
  reason: z.string().optional(),
});

const updatePurchaseSchema = z.object({
  supplierName: z.string().min(1).optional(),
  status: z.enum(["BROUILLON", "EN_COURS", "RECU", "PAYE", "ANNULE"]).optional(),
  totalAmount: z.number().int().min(0).optional(),
  paidAmount: z.number().int().min(0).optional(),
  paymentMethod: cashMethodSchema.optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receivedAt: z.string().nullable().optional(),
  stockItems: z.array(purchaseStockLineSchema).optional(),
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
    const paidDelta = data.paidAmount !== undefined ? data.paidAmount - existing.paidAmount : 0;
    const cashMethod = data.paymentMethod ?? "ESPECES";
    const nextStatus = data.status ?? existing.status;
    const isTransitionToReceived = existing.status !== "RECU" && nextStatus === "RECU";
    const stockItems = data.stockItems ?? [];

    if (isTransitionToReceived && stockItems.length === 0) {
      return NextResponse.json(
        { error: "Articles de stock requis pour passer la commande en RECU" },
        { status: 422 }
      );
    }

    const item = await db.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...(data.supplierName ? { supplierName: data.supplierName } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.totalAmount !== undefined ? { totalAmount: data.totalAmount } : {}),
          ...(data.paidAmount !== undefined ? { paidAmount: data.paidAmount } : {}),
          dueAmount: Math.max(0, totalAmount - paidAmount),
          ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
          ...(
            data.receivedAt !== undefined
              ? { receivedAt: data.receivedAt ? new Date(data.receivedAt) : null }
              : isTransitionToReceived
                ? { receivedAt: new Date() }
                : {}
          ),
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      if (isTransitionToReceived) {
        const merged = new Map<string, { quantity: number; unitCost?: number; reason?: string }>();
        for (const line of stockItems) {
          const prev = merged.get(line.stockItemId);
          merged.set(line.stockItemId, {
            quantity: (prev?.quantity ?? 0) + line.quantity,
            unitCost: line.unitCost ?? prev?.unitCost,
            reason: line.reason || prev?.reason,
          });
        }

        const stockIds = Array.from(merged.keys());
        const existingItems = await tx.stockItem.findMany({
          where: { id: { in: stockIds }, organizationId, isActive: true },
        });
        if (existingItems.length !== stockIds.length) {
          throw new Error("Un ou plusieurs articles de stock sont introuvables");
        }
        const byId = new Map(existingItems.map((s) => [s.id, s]));

        for (const [stockItemId, line] of merged.entries()) {
          const stock = byId.get(stockItemId)!;
          await tx.stockItem.update({
            where: { id: stockItemId },
            data: { quantity: { increment: line.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              organizationId,
              stockItemId,
              type: "ENTREE",
              quantity: line.quantity,
              unitCost: line.unitCost ?? stock.purchasePrice,
              reason: line.reason || `Reception achat ${updated.orderNumber}`,
            },
          });
        }
      }

      if (paidDelta !== 0) {
        await tx.cashTransaction.create({
          data: {
            organizationId,
            type: paidDelta > 0 ? "DECAISSEMENT" : "REMBOURSEMENT",
            amount: Math.abs(paidDelta),
            method: cashMethod,
            description:
              paidDelta > 0
                ? `Ajustement paiement achat ${updated.orderNumber}`
                : `Remboursement achat ${updated.orderNumber}`,
            reference: updated.orderNumber,
            happenedAt: new Date(),
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/achats/[id] error:", error);
    if (error instanceof Error && error.message.toLowerCase().includes("stock")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
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

export const PATCH = PUT;
