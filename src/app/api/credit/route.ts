import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const createLoanSchema = z.object({
  lenderName: z.string().min(1, "Le preteur est requis"),
  principalAmount: z.number().int().positive("Le montant est requis"),
  ratePercent: z.number().min(0).default(0),
  termMonths: z.number().int().min(0).default(0),
  monthlyPayment: z.number().int().min(0).default(0),
  outstandingAmount: z.number().int().min(0),
  status: z.enum(["ACTIF", "SOLDE", "EN_RETARD"]).default("ACTIF"),
  startDate: z.string().optional(),
  nextDueDate: z.string().optional(),
  notes: z.string().optional(),
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
    const sortBy = searchParams.get("sortBy") === "outstandingAmount" ? "outstandingAmount" : "createdAt";
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (q) where.lenderName = { contains: q };

    const [items, total, aggregate] = await Promise.all([
      db.creditLoan.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.creditLoan.count({ where }),
      db.creditLoan.findMany({ where: { organizationId } }),
    ]);

    const stats = {
      activeLoans: aggregate.filter((l) => l.status === "ACTIF").length,
      outstandingTotal: aggregate.reduce((sum, l) => sum + l.outstandingAmount, 0),
      principalTotal: aggregate.reduce((sum, l) => sum + l.principalAmount, 0),
    };

    return NextResponse.json({
      items,
      loans: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats,
    });
  } catch (error) {
    console.error("GET /api/credit error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const parsed = createLoanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.creditLoan.create({
      data: {
        organizationId,
        lenderName: data.lenderName,
        principalAmount: data.principalAmount,
        ratePercent: data.ratePercent,
        termMonths: data.termMonths,
        monthlyPayment: data.monthlyPayment,
        outstandingAmount: data.outstandingAmount,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ item, loan: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/credit error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
