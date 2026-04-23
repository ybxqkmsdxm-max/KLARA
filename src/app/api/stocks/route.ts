import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const createStockItemSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  sku: z.string().optional(),
  unit: z.string().default("u"),
  purchasePrice: z.number().int().min(0).default(0),
  salePrice: z.number().int().min(0).default(0),
  quantity: z.number().int().min(0).default(0),
  lowStockThreshold: z.number().int().min(0).default(5),
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
    const lowOnly = searchParams.get("lowOnly") === "true";
    const sortBy = searchParams.get("sortBy") === "quantity" ? "quantity" : "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const baseWhere: Record<string, unknown> = { organizationId, isActive: true };
    if (q) {
      baseWhere.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
      ];
    }

    // Main path: DB-side sort + pagination.
    // lowOnly=true needs quantity <= lowStockThreshold (field-to-field comparison), so it stays in memory.
    const [items, total, statsRows] = await Promise.all([
      lowOnly
        ? db.stockItem.findMany({ where: baseWhere })
        : db.stockItem.findMany({
            where: baseWhere,
            orderBy: sortBy === "quantity" ? { quantity: sortDir } : { createdAt: sortDir },
            skip: (page - 1) * limit,
            take: limit,
          }),
      lowOnly
        ? db.stockItem.count({ where: baseWhere })
        : db.stockItem.count({ where: baseWhere }),
      db.stockItem.findMany({
        where: { organizationId, isActive: true },
        select: { quantity: true, purchasePrice: true, lowStockThreshold: true },
      }),
    ]);

    const resolvedItems = lowOnly
      ? [...items]
          .filter((item) => item.quantity <= item.lowStockThreshold)
          .sort((a, b) => {
            const left = sortBy === "quantity" ? a.quantity : new Date(a.createdAt).getTime();
            const right = sortBy === "quantity" ? b.quantity : new Date(b.createdAt).getTime();
            return sortDir === "asc" ? left - right : right - left;
          })
          .slice((page - 1) * limit, page * limit)
      : items;

    const resolvedTotal = lowOnly
      ? items.filter((item) => item.quantity <= item.lowStockThreshold).length
      : total;

    const stats = statsRows.reduce(
      (acc, item) => {
        acc.totalItems += 1;
        acc.stockValue += item.quantity * item.purchasePrice;
        if (item.quantity <= item.lowStockThreshold) acc.lowStockItems += 1;
        return acc;
      },
      { totalItems: 0, stockValue: 0, lowStockItems: 0 }
    );

    return NextResponse.json({
      items: resolvedItems,
      total: resolvedTotal,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(resolvedTotal / limit)),
      stats,
    });
  } catch (error) {
    console.error("GET /api/stocks error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const parsed = createStockItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;

    const item = await db.stockItem.create({
      data: {
        organizationId,
        name: data.name,
        sku: data.sku || null,
        unit: data.unit,
        purchasePrice: data.purchasePrice,
        salePrice: data.salePrice,
        quantity: data.quantity,
        lowStockThreshold: data.lowStockThreshold,
      },
    });

    if (data.quantity > 0) {
      await db.stockMovement.create({
        data: {
          organizationId,
          stockItemId: item.id,
          type: "ENTREE",
          quantity: data.quantity,
          unitCost: data.purchasePrice,
          reason: "Stock initial",
        },
      });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/stocks error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
