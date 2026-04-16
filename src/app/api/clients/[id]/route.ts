import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/clients/[id] — Détail d'un client avec ses factures et paiements
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const organization = await db.organization.findUnique({
      where: { clerkOrgId: "org_demo_klara" },
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const client = await db.client.findFirst({
      where: {
        id,
        organizationId: organization.id,
        deletedAt: null,
      },
      include: {
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    // Calculs agrégés
    const totalFacture = client.invoices.reduce((s, i) => s + i.total, 0);
    const totalPaye = client.invoices.reduce(
      (s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0),
      0
    );
    const montantDu = totalFacture - totalPaye;

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
        city: client.city,
        type: client.type,
        taxNumber: client.taxNumber,
        notes: client.notes,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        // Stats
        totalFacture,
        totalPaye,
        montantDu,
        nombreFactures: client.invoices.length,
        // Factures détaillées
        factures: client.invoices.map((inv) => {
          const invTotalPaye = inv.payments.reduce(
            (s, p) => s + p.amount,
            0
          );
          return {
            id: inv.id,
            number: inv.number,
            status: inv.status,
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            total: inv.total,
            paidAmount: invTotalPaye,
            montantDu: inv.total - invTotalPaye,
          };
        }),
      },
    });
  } catch (error) {
    console.error("Erreur détail client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * PUT /api/clients/[id] — Modifier un client
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const organization = await db.organization.findUnique({
      where: { clerkOrgId: "org_demo_klara" },
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, email, phone, address, city, type, taxNumber, notes } = body;

    const existing = await db.client.findFirst({
      where: {
        id,
        organizationId: organization.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    const updated = await db.client.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(type !== undefined && { type }),
        ...(taxNumber !== undefined && { taxNumber }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json({ client: updated });
  } catch (error) {
    console.error("Erreur modification client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * DELETE /api/clients/[id] — Supprimer un client (soft delete)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const organization = await db.organization.findUnique({
      where: { clerkOrgId: "org_demo_klara" },
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const existing = await db.client.findFirst({
      where: {
        id,
        organizationId: organization.id,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Client non trouvé" },
        { status: 404 }
      );
    }

    await db.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Client supprimé" });
  } catch (error) {
    console.error("Erreur suppression client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
