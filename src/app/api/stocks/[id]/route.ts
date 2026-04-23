import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const updateStockItemSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().nullable().optional(),
  unit: z.string().optional(),
  purchasePrice: z.number().int().min(0).optional(),
  salePrice: z.number().int().min(0).optional(),
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  movementReason: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.stockItem.findFirst({ where: { id, organizationId, isActive: true } });
    if (!existing) return NextResponse.json({ error: "Article non trouve" }, { status: 404 });

    const body = await request.json();
    const parsed = updateStockItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const previousQty = existing.quantity;
    const nextQty = data.quantity;

    const item = await db.stockItem.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.unit ? { unit: data.unit } : {}),
        ...(data.purchasePrice !== undefined ? { purchasePrice: data.purchasePrice } : {}),
        ...(data.salePrice !== undefined ? { salePrice: data.salePrice } : {}),
        ...(nextQty !== undefined ? { quantity: nextQty } : {}),
        ...(data.lowStockThreshold !== undefined ? { lowStockThreshold: data.lowStockThreshold } : {}),
      },
    });

    if (nextQty !== undefined && nextQty !== previousQty) {
      const diff = nextQty - previousQty;
      await db.stockMovement.create({
        data: {
          organizationId,
          stockItemId: item.id,
          type: diff > 0 ? "ENTREE" : "SORTIE",
          quantity: Math.abs(diff),
          unitCost: item.purchasePrice,
          reason: data.movementReason || "Ajustement manuel",
        },
      });
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/stocks/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.stockItem.findFirst({ where: { id, organizationId, isActive: true } });
    if (!existing) return NextResponse.json({ error: "Article non trouve" }, { status: 404 });

    await db.stockItem.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/stocks/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export const PATCH = PUT;
