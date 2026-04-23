import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { z } from "zod";

const updateInvoiceSchema = z.object({
  status: z.enum(["BROUILLON", "ENVOYEE", "PAYEE", "EN_RETARD", "ANNULEE"]).optional(),
  dueDate: z.string().optional(),
  notes: z.string().nullable().optional(),
  termsAndConditions: z.string().nullable().optional(),
});

/**
 * GET /api/factures/[id] - Detail complet d'une facture
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: { id, organizationId },
      include: {
        client: true,
        items: { orderBy: { order: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvee" }, { status: 404 });
    }

    return NextResponse.json({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      issueDate: invoice.issueDate.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      paidAmount: invoice.paidAmount,
      currency: invoice.currency,
      notes: invoice.notes,
      termsAndConditions: invoice.termsAndConditions,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      sentAt: invoice.sentAt?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      client: {
        id: invoice.client.id,
        name: invoice.client.name,
        email: invoice.client.email,
        phone: invoice.client.phone,
        type: invoice.client.type,
      },
      items: invoice.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      payments: invoice.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erreur detail facture:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * PATCH /api/factures/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    if (
      data.status === undefined &&
      data.dueDate === undefined &&
      data.notes === undefined &&
      data.termsAndConditions === undefined
    ) {
      return NextResponse.json({ error: "Aucune donnee a modifier" }, { status: 400 });
    }

    const existing = await db.invoice.findFirst({
      where: { id, organizationId },
      include: { payments: { orderBy: { paidAt: "desc" } }, client: true, items: { orderBy: { order: "asc" } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Facture non trouvee" }, { status: 404 });
    }

    if (existing.status === "ANNULEE" && data.status && data.status !== "ANNULEE") {
      return NextResponse.json(
        { error: "Impossible de changer le statut d'une facture annulee" },
        { status: 400 }
      );
    }

    if (
      data.status === "EN_RETARD" &&
      ["PAYEE", "ANNULEE"].includes(existing.status)
    ) {
      return NextResponse.json(
        { error: "Le statut EN_RETARD est invalide pour cette facture" },
        { status: 400 }
      );
    }

    const updated = await db.invoice.update({
      where: { id: existing.id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.termsAndConditions !== undefined
          ? { termsAndConditions: data.termsAndConditions }
          : {}),
        ...(data.status === "ENVOYEE" && !existing.sentAt ? { sentAt: new Date() } : {}),
        ...(data.status === "PAYEE"
          ? {
              paidAt: existing.paidAt ?? new Date(),
              paidAmount: Math.max(existing.total, existing.paidAmount),
            }
          : {}),
      },
      include: {
        client: true,
        items: { orderBy: { order: "asc" } },
        payments: { orderBy: { paidAt: "desc" } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      number: updated.number,
      status: updated.status,
      issueDate: updated.issueDate.toISOString(),
      dueDate: updated.dueDate.toISOString(),
      subtotal: updated.subtotal,
      taxRate: updated.taxRate,
      taxAmount: updated.taxAmount,
      total: updated.total,
      paidAmount: updated.paidAmount,
      currency: updated.currency,
      notes: updated.notes,
      termsAndConditions: updated.termsAndConditions,
      paidAt: updated.paidAt?.toISOString() ?? null,
      sentAt: updated.sentAt?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      client: {
        id: updated.client.id,
        name: updated.client.name,
        email: updated.client.email,
        phone: updated.client.phone,
        type: updated.client.type,
      },
      items: updated.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      payments: updated.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        paidAt: p.paidAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erreur modification facture:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
