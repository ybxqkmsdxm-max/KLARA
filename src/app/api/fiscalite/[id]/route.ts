import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const updateTaxDeclarationSchema = z.object({
  periodMonth: z.string().min(7).optional(),
  taxType: z.enum(["TVA", "IS", "IRPP", "CNSS", "AUTRE"]).optional(),
  status: z.enum(["BROUILLON", "PRET", "VALIDE", "DEPOT"]).optional(),
  taxableAmount: z.number().int().min(0).optional(),
  taxAmount: z.number().int().min(0).optional(),
  dueDate: z.string().nullable().optional(),
  filedAt: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.taxDeclaration.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Declaration non trouvee" }, { status: 404 });

    const body = await request.json();
    const parsed = updateTaxDeclarationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.taxDeclaration.update({
      where: { id },
      data: {
        ...(data.periodMonth ? { periodMonth: data.periodMonth } : {}),
        ...(data.taxType ? { taxType: data.taxType } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.taxableAmount !== undefined ? { taxableAmount: data.taxableAmount } : {}),
        ...(data.taxAmount !== undefined ? { taxAmount: data.taxAmount } : {}),
        ...(data.dueDate !== undefined ? { dueDate: data.dueDate ? new Date(data.dueDate) : null } : {}),
        ...(data.filedAt !== undefined ? { filedAt: data.filedAt ? new Date(data.filedAt) : null } : {}),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/fiscalite/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.taxDeclaration.findFirst({ where: { id, organizationId } });
    if (!existing) return NextResponse.json({ error: "Declaration non trouvee" }, { status: 404 });

    await db.taxDeclaration.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/fiscalite/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
