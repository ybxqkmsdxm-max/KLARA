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

const createPurchaseSchema = z.object({
  supplierName: z.string().min(1, "Le fournisseur est requis"),
  status: z.enum(["BROUILLON", "EN_COURS", "RECU", "PAYE", "ANNULE"]).default("BROUILLON"),
  totalAmount: z.number().int().min(0).default(0),
  paidAmount: z.number().int().min(0).default(0),
  paymentMethod: cashMethodSchema.default("ESPECES"),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  receivedAt: z.string().optional(),
  stockItems: z.array(purchaseStockLineSchema).optional(),
});

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const requestedLimit = Math.max(1, Number(searchParams.get("limit") || String(DEFAULT_LIMIT)));
    const limit = Math.min(MAX_LIMIT, requestedLimit);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") === "totalAmount" ? "totalAmount" : "orderedAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { supplierName: { contains: q } },
        { orderNumber: { contains: q } },
      ];
    }

    if (dateFrom || dateTo) {
      where.orderedAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [items, total, aggregate] = await Promise.all([
      db.purchaseOrder.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.purchaseOrder.count({ where }),
      db.purchaseOrder.findMany({ where }),
    ]);

    const stats = aggregate.reduce(
      (acc, order) => {
        acc.totalAchats += order.totalAmount;
        acc.totalDues += order.dueAmount;
        if (order.status === "EN_COURS") acc.pending += 1;
        return acc;
      },
      { totalAchats: 0, totalDues: 0, pending: 0 }
    );

    return NextResponse.json({
      items,
      orders: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats,
    });
  } catch (error) {
    console.error("GET /api/achats error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const parsed = createPurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const count = await db.purchaseOrder.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const orderNumber = `ACH-${year}-${(count + 1).toString().padStart(3, "0")}`;
    const dueAmount = Math.max(0, data.totalAmount - data.paidAmount);
    const shouldImpactCash = data.paidAmount > 0 && data.status !== "ANNULE";
    const stockItems = data.stockItems ?? [];
    const shouldImpactStock = data.status === "RECU";

    if (shouldImpactStock && stockItems.length === 0) {
      return NextResponse.json(
        { error: "Articles de stock requis pour enregistrer la reception" },
        { status: 422 }
      );
    }

    const item = await db.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          organizationId,
          orderNumber,
          supplierName: data.supplierName,
          status: data.status,
          totalAmount: data.totalAmount,
          paidAmount: data.paidAmount,
          dueAmount,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes || null,
          receivedAt: data.status === "RECU" ? (data.receivedAt ? new Date(data.receivedAt) : new Date()) : null,
        },
      });

      if (shouldImpactStock) {
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
              reason: line.reason || `Reception achat ${orderNumber}`,
            },
          });
        }
      }

      if (shouldImpactCash) {
        await tx.cashTransaction.create({
          data: {
            organizationId,
            type: "DECAISSEMENT",
            amount: data.paidAmount,
            method: data.paymentMethod,
            description: `Paiement achat ${orderNumber} - ${data.supplierName}`,
            reference: orderNumber,
            happenedAt: new Date(),
          },
        });
      }

      return created;
    });

    return NextResponse.json({ item, order: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/achats error:", error);
    if (error instanceof Error && error.message.toLowerCase().includes("stock")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
