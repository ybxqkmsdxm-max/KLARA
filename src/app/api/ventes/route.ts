import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const createSaleSchema = z.object({
  clientName: z.string().optional(),
  status: z.enum(["BROUILLON", "CONFIRMEE", "ANNULEE", "REMBOURSEE"]).default("CONFIRMEE"),
  paymentMethod: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CARTE", "CREDIT"]).default("ESPECES"),
  subtotalAmount: z.number().int().min(0),
  discountAmount: z.number().int().min(0).default(0),
  paidAmount: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  soldAt: z.string().optional(),
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
    const paymentMethod = searchParams.get("paymentMethod")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") === "totalAmount" ? "totalAmount" : "soldAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (q) {
      where.OR = [
        { clientName: { contains: q } },
        { saleNumber: { contains: q } },
      ];
    }

    if (dateFrom || dateTo) {
      where.soldAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [items, total, totals, cancelled] = await Promise.all([
      db.salesTransaction.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.salesTransaction.count({ where }),
      db.salesTransaction.aggregate({
        where,
        _sum: {
          totalAmount: true,
          paidAmount: true,
        },
      }),
      db.salesTransaction.count({
        where: { ...where, status: "ANNULEE" },
      }),
    ]);

    const stats = {
      totalVentes: totals._sum.totalAmount ?? 0,
      totalEncaisse: totals._sum.paidAmount ?? 0,
      cancelled,
    };

    return NextResponse.json({
      items,
      sales: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats,
    });
  } catch (error) {
    console.error("GET /api/ventes error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const parsed = createSaleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const count = await db.salesTransaction.count({ where: { organizationId } });
    const year = new Date().getFullYear();
    const saleNumber = `VTE-${year}-${(count + 1).toString().padStart(3, "0")}`;
    const totalAmount = Math.max(0, data.subtotalAmount - data.discountAmount);
    const paidAmount = data.paidAmount ?? totalAmount;

    const item = await db.salesTransaction.create({
      data: {
        organizationId,
        saleNumber,
        status: data.status,
        clientName: data.clientName || null,
        paymentMethod: data.paymentMethod,
        subtotalAmount: data.subtotalAmount,
        discountAmount: data.discountAmount,
        totalAmount,
        paidAmount,
        notes: data.notes || null,
        soldAt: data.soldAt ? new Date(data.soldAt) : new Date(),
      },
    });

    return NextResponse.json({ item, sale: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ventes error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
