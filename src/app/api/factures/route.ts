import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/factures - Liste des factures
 * POST /api/factures - Créer une facture
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    const where: Record<string, unknown> = { organizationId: organization.id };
    if (status && status !== "TOUS") where.status = status;

    const [factures, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: { client: true, items: true, payments: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      factures: factures.map((f) => ({
        id: f.id, number: f.number, status: f.status,
        issueDate: f.issueDate, dueDate: f.dueDate,
        subtotal: f.subtotal, taxRate: f.taxRate, taxAmount: f.taxAmount, total: f.total,
        paidAmount: f.paidAmount, clientName: f.client.name, clientEmail: f.client.email,
        itemsCount: f.items.length,
      })),
      total, page, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erreur factures:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, issueDate, dueDate, items, taxRate = 18, notes, termsAndConditions, status: invoiceStatus } = body;

    if (!clientId || !items || items.length === 0) {
      return NextResponse.json({ error: "Client et lignes requis" }, { status: 400 });
    }

    // Valider le statut autorisé
    const allowedStatuses = ["BROUILLON", "ENVOYEE"];
    const finalStatus = allowedStatuses.includes(invoiceStatus) ? invoiceStatus : "BROUILLON";

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    // Compter les factures existantes pour le numéro
    const count = await db.invoice.count({ where: { organizationId: organization.id } });
    const year = new Date().getFullYear();
    const number = `FAC-${year}-${(count + 1).toString().padStart(3, "0")}`;

    // Calculer les totaux
    const subtotal = items.reduce((s: number, item: { quantity: number; unitPrice: number }) => s + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * taxRate / 100);
    const total = subtotal + taxAmount;

    const facture = await db.invoice.create({
      data: {
        organizationId: organization.id, clientId, number,
        status: finalStatus,
        issueDate: new Date(issueDate), dueDate: new Date(dueDate),
        sentAt: finalStatus === "ENVOYEE" ? new Date() : null,
        subtotal, taxRate, taxAmount, total,
        notes: notes || null, termsAndConditions: termsAndConditions || null,
        items: {
          create: items.map((item: { description: string; quantity: number; unitPrice: number }, index: number) => ({
            description: item.description, quantity: item.quantity, unitPrice: item.unitPrice,
            total: item.quantity * item.unitPrice, order: index,
          })),
        },
      },
      include: { client: true, items: true },
    });

    return NextResponse.json({ facture }, { status: 201 });
  } catch (error) {
    console.error("Erreur création facture:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
