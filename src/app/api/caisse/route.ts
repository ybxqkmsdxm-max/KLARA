import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const createCashTransactionSchema = z.object({
  type: z.enum(["ENCAISSEMENT", "DECAISSEMENT", "REMBOURSEMENT", "AJUSTEMENT"]).default("ENCAISSEMENT"),
  amount: z.number().int().positive("Le montant doit etre positif"),
  method: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE", "CARTE"]).default("ESPECES"),
  description: z.string().optional(),
  reference: z.string().optional(),
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
    const type = searchParams.get("type")?.trim();
    const method = searchParams.get("method")?.trim();
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const sortBy = searchParams.get("sortBy") === "amount" ? "amount" : "happenedAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = { organizationId };
    if (type) where.type = type;
    if (method) where.method = method;
    if (q) {
      where.OR = [
        { description: { contains: q } },
        { reference: { contains: q } },
      ];
    }

    if (dateFrom || dateTo) {
      where.happenedAt = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(dateTo) } : {}),
      };
    }

    const [items, total, aggregate] = await Promise.all([
      db.cashTransaction.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.cashTransaction.count({ where }),
      db.cashTransaction.findMany({ where }),
    ]);

    const totals = aggregate.reduce(
      (acc, tx) => {
        if (tx.type === "ENCAISSEMENT") acc.inflow += tx.amount;
        else acc.outflow += tx.amount;
        return acc;
      },
      { inflow: 0, outflow: 0 }
    );

    const stats = {
      totalEncaisse: totals.inflow,
      totalDecaisse: totals.outflow,
      soldeNet: totals.inflow - totals.outflow,
    };

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
    console.error("GET /api/caisse error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const parsed = createCashTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.cashTransaction.create({
      data: {
        organizationId,
        type: data.type,
        amount: data.amount,
        method: data.method,
        description: data.description || null,
        reference: data.reference || null,
        happenedAt: data.happenedAt ? new Date(data.happenedAt) : new Date(),
      },
    });

    return NextResponse.json({ item, transaction: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/caisse error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
