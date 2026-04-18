import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const createMobileMoneyTxSchema = z.object({
  direction: z.enum(["IN", "OUT"]).default("IN"),
  operator: z.enum(["FLOOZ", "TMONEY", "WAVE", "MTN", "ORANGE"]).default("WAVE"),
  amount: z.number().int().positive("Le montant est requis"),
  fees: z.number().int().min(0).default(0),
  phoneNumber: z.string().optional(),
  externalRef: z.string().optional(),
  linkedInvoiceId: z.string().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "FAILED", "REFUNDED"]).default("PENDING"),
  happenedAt: z.string().optional(),
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
    const direction = searchParams.get("direction")?.trim();
    const operator = searchParams.get("operator")?.trim();
    const status = searchParams.get("status")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") === "amount" ? "amount" : "happenedAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = { organizationId };
    if (direction) where.direction = direction;
    if (operator) where.operator = operator;
    if (status) where.status = status;

    if (q) {
      where.OR = [
        { phoneNumber: { contains: q } },
        { externalRef: { contains: q } },
        { linkedInvoiceId: { contains: q } },
      ];
    }

    if (dateFrom || dateTo) {
      where.happenedAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [items, total, aggregate] = await Promise.all([
      db.mobileMoneyTransaction.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.mobileMoneyTransaction.count({ where }),
      db.mobileMoneyTransaction.findMany({ where: { organizationId } }),
    ]);

    const stats = aggregate.reduce(
      (acc, tx) => {
        if (tx.direction === "IN") acc.inflow += tx.amount;
        else acc.outflow += tx.amount;
        acc.fees += tx.fees;
        return acc;
      },
      { inflow: 0, outflow: 0, fees: 0 }
    );

    return NextResponse.json({
      items,
      transactions: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats,
    });
  } catch (error) {
    console.error("GET /api/paiements error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const parsed = createMobileMoneyTxSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.mobileMoneyTransaction.create({
      data: {
        organizationId,
        direction: data.direction,
        operator: data.operator,
        amount: data.amount,
        fees: data.fees,
        phoneNumber: data.phoneNumber || null,
        externalRef: data.externalRef || null,
        linkedInvoiceId: data.linkedInvoiceId || null,
        status: data.status,
        happenedAt: data.happenedAt ? new Date(data.happenedAt) : new Date(),
      },
    });

    return NextResponse.json({ item, transaction: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/paiements error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
