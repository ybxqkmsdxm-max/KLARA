import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const updateLoanSchema = z.object({
  lenderName: z.string().min(1).optional(),
  principalAmount: z.number().int().positive().optional(),
  ratePercent: z.number().min(0).optional(),
  termMonths: z.number().int().min(0).optional(),
  monthlyPayment: z.number().int().min(0).optional(),
  outstandingAmount: z.number().int().min(0).optional(),
  status: z.enum(["ACTIF", "SOLDE", "EN_RETARD"]).optional(),
  startDate: z.string().optional(),
  nextDueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.creditLoan.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Pret non trouve" }, { status: 404 });

    const body = await request.json();
    const parsed = updateLoanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.creditLoan.update({
      where: { id },
      data: {
        ...(data.lenderName ? { lenderName: data.lenderName } : {}),
        ...(data.principalAmount !== undefined ? { principalAmount: data.principalAmount } : {}),
        ...(data.ratePercent !== undefined ? { ratePercent: data.ratePercent } : {}),
        ...(data.termMonths !== undefined ? { termMonths: data.termMonths } : {}),
        ...(data.monthlyPayment !== undefined ? { monthlyPayment: data.monthlyPayment } : {}),
        ...(data.outstandingAmount !== undefined ? { outstandingAmount: data.outstandingAmount } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.nextDueDate !== undefined ? { nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/credit/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.creditLoan.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Pret non trouve" }, { status: 404 });

    await db.creditLoan.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/credit/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
