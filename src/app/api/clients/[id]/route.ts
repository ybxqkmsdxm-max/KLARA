import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  type: z.enum(["PARTICULIER", "ENTREPRISE"]).optional(),
  taxNumber: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/clients/[id]
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const client = await db.client.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { invoices: { include: { payments: true }, orderBy: { createdAt: "desc" } } },
    });

    if (!client) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

    const totalFacture = client.invoices.reduce((s, i) => s + i.total, 0);
    const totalPaye = client.invoices.reduce((s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0), 0);

    return NextResponse.json({
      client: {
        id: client.id, name: client.name, email: client.email, phone: client.phone,
        address: client.address, city: client.city, type: client.type,
        taxNumber: client.taxNumber, notes: client.notes,
        createdAt: client.createdAt, updatedAt: client.updatedAt,
        totalFacture, totalPaye, montantDu: totalFacture - totalPaye, nombreFactures: client.invoices.length,
        factures: client.invoices.map((inv) => {
          const invTotalPaye = inv.payments.reduce((s, p) => s + p.amount, 0);
          return { id: inv.id, number: inv.number, status: inv.status, issueDate: inv.issueDate, dueDate: inv.dueDate, total: inv.total, paidAmount: invTotalPaye, montantDu: inv.total - invTotalPaye };
        }),
      },
    });
  } catch (error) {
    console.error("Erreur détail client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * PUT /api/clients/[id]
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const result = updateClientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.flatten().fieldErrors }, { status: 422 });
    }

    const existing = await db.client.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

    const updated = await db.client.update({
      where: { id },
      data: Object.fromEntries(Object.entries(result.data).filter(([, v]) => v !== undefined)),
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("Erreur modification client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id] — Soft delete
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existing = await db.client.findFirst({ where: { id, organizationId, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });

    await db.client.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ success: true, message: "Client supprimé" });
  } catch (error) {
    console.error("Erreur suppression client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
