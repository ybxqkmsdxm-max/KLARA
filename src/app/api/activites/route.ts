import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const createActivitySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.string().optional(),
  monthlyBudget: z.number().int().min(0).default(0),
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED"]).default("ACTIVE"),
});

const createTransferSchema = z.object({
  mode: z.literal("TRANSFER"),
  fromActivityName: z.string().min(1),
  toActivityName: z.string().min(1),
  amount: z.number().int().positive(),
  note: z.string().optional(),
  transferredAt: z.string().optional(),
});

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "TRANSFER" ? "TRANSFER" : "ACTIVITY";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const requestedLimit = Math.max(1, Number(searchParams.get("limit") || String(DEFAULT_LIMIT)));
    const limit = Math.min(MAX_LIMIT, requestedLimit);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    if (mode === "TRANSFER") {
      const where: Record<string, unknown> = { organizationId };
      if (q) {
        where.OR = [
          { fromActivityName: { contains: q } },
          { toActivityName: { contains: q } },
          { note: { contains: q } },
        ];
      }

      const [items, total, transferAgg] = await Promise.all([
        db.activityTransfer.findMany({
          where,
          orderBy: { transferredAt: sortDir },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.activityTransfer.count({ where }),
        db.activityTransfer.aggregate({
          where: { organizationId },
          _count: { _all: true },
          _sum: { amount: true },
        }),
      ]);

      const stats = {
        transfersCount: transferAgg._count._all ?? 0,
        totalTransfers: transferAgg._sum.amount ?? 0,
      };

      return NextResponse.json({
        items,
        transfers: items,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        stats,
      });
    }

    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { type: { contains: q } },
      ];
    }

    const [items, total, activeActivities, totalBudgetAgg, totalTransfersAgg] = await Promise.all([
      db.activity.findMany({
        where,
        orderBy: { createdAt: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.activity.count({ where }),
      db.activity.count({ where: { organizationId, status: "ACTIVE" } }),
      db.activity.aggregate({ where: { organizationId }, _sum: { monthlyBudget: true } }),
      db.activityTransfer.aggregate({ where: { organizationId }, _sum: { amount: true } }),
    ]);

    const stats = {
      activeActivities,
      totalBudget: totalBudgetAgg._sum.monthlyBudget ?? 0,
      totalTransfers: totalTransfersAgg._sum.amount ?? 0,
    };

    return NextResponse.json({
      items,
      activities: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats,
    });
  } catch (error) {
    console.error("GET /api/activites error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    if (body?.mode === "TRANSFER") {
      const parsedTransfer = createTransferSchema.safeParse(body);
      if (!parsedTransfer.success) {
        return NextResponse.json(
          { error: "Donnees invalides", details: parsedTransfer.error.flatten().fieldErrors },
          { status: 422 }
        );
      }

      const data = parsedTransfer.data;
      const item = await db.activityTransfer.create({
        data: {
          organizationId,
          fromActivityName: data.fromActivityName,
          toActivityName: data.toActivityName,
          amount: data.amount,
          note: data.note || null,
          transferredAt: data.transferredAt ? new Date(data.transferredAt) : new Date(),
        },
      });

      return NextResponse.json({ item, transfer: item }, { status: 201 });
    }

    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.activity.create({
      data: {
        organizationId,
        name: data.name,
        type: data.type || null,
        monthlyBudget: data.monthlyBudget,
        status: data.status,
      },
    });

    return NextResponse.json({ item, activity: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/activites error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
