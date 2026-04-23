import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession, requireRole } from "@/lib/auth-helper";

const createTaxDeclarationSchema = z.object({
  periodMonth: z.string().min(7, "Periode invalide (YYYY-MM)"),
  taxType: z.enum(["TVA", "IS", "IRPP", "CNSS", "AUTRE"]).default("TVA"),
  status: z.enum(["BROUILLON", "PRET", "VALIDE", "DEPOT"]).default("BROUILLON"),
  taxableAmount: z.number().int().min(0).default(0),
  taxAmount: z.number().int().min(0).default(0),
  dueDate: z.string().optional(),
  filedAt: z.string().optional(),
});

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const { error, organizationId, session } = await getAuthSession();
    if (error) return error;
    const roleError = await requireRole(organizationId, session.user.id, ["OWNER", "ADMIN"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const requestedLimit = Math.max(1, Number(searchParams.get("limit") || String(DEFAULT_LIMIT)));
    const limit = Math.min(MAX_LIMIT, requestedLimit);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const taxType = searchParams.get("taxType")?.trim();
    const sortBy = searchParams.get("sortBy") === "taxAmount" ? "taxAmount" : "periodMonth";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (taxType) where.taxType = taxType;
    if (q) where.periodMonth = { contains: q };

    const [items, total, pending, totalTaxAgg, lastDeclaration] = await Promise.all([
      db.taxDeclaration.findMany({
        where,
        orderBy: [{ [sortBy]: sortDir }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.taxDeclaration.count({ where }),
      db.taxDeclaration.count({ where: { organizationId, status: { not: "DEPOT" } } }),
      db.taxDeclaration.aggregate({ where: { organizationId }, _sum: { taxAmount: true } }),
      db.taxDeclaration.findFirst({ where: { organizationId }, orderBy: { periodMonth: "desc" } }),
    ]);

    const stats = {
      pending,
      totalTaxAmount: totalTaxAgg._sum.taxAmount ?? 0,
      lastDeclaration: lastDeclaration ?? null,
    };

    return NextResponse.json({
      items,
      declarations: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats,
    });
  } catch (error) {
    console.error("GET /api/fiscalite error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId, session } = await getAuthSession();
    if (error) return error;
    const roleError = await requireRole(organizationId, session.user.id, ["OWNER", "ADMIN"]);
    if (roleError) return roleError;

    const body = await request.json();
    const parsed = createTaxDeclarationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.taxDeclaration.create({
      data: {
        organizationId,
        periodMonth: data.periodMonth,
        taxType: data.taxType,
        status: data.status,
        taxableAmount: data.taxableAmount,
        taxAmount: data.taxAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        filedAt: data.filedAt ? new Date(data.filedAt) : null,
      },
    });

    return NextResponse.json({ item, declaration: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/fiscalite error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
