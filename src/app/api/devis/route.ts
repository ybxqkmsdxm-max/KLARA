import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/devis - Liste des devis
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    const where: Record<string, unknown> = { organizationId: organization.id };
    if (status && status !== "TOUS") where.status = status;

    const [devis, total] = await Promise.all([
      db.quote.findMany({
        where,
        include: { client: true, items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.quote.count({ where }),
    ]);

    return NextResponse.json({
      devis: devis.map((d) => ({
        id: d.id, number: d.number, status: d.status,
        issueDate: d.issueDate, expiryDate: d.expiryDate,
        subtotal: d.subtotal, taxRate: d.taxRate, taxAmount: d.taxAmount, total: d.total,
        clientName: d.client.name, clientEmail: d.client.email,
        itemsCount: d.items.length,
      })),
      total, page, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erreur devis:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * POST /api/devis - Créer un devis
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, issueDate, expiryDate, items, taxRate = 18, notes } = body;

    if (!clientId || !items || items.length === 0) return NextResponse.json({ error: "Client et lignes requis" }, { status: 400 });

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    const count = await db.quote.count({ where: { organizationId: organization.id } });
    const year = new Date().getFullYear();
    const number = `DEV-${year}-${(count + 1).toString().padStart(3, "0")}`;

    const subtotal = items.reduce((s: number, item: { quantity: number; unitPrice: number }) => s + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * taxRate / 100);
    const total = subtotal + taxAmount;

    const devis = await db.quote.create({
      data: {
        organizationId: organization.id, clientId, number,
        status: "BROUILLON",
        issueDate: new Date(issueDate), expiryDate: new Date(expiryDate),
        subtotal, taxRate, taxAmount, total, notes: notes || null,
        items: { create: items.map((item: { description: string; quantity: number; unitPrice: number }, index: number) => ({
          description: item.description, quantity: item.quantity, unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice, order: index,
        })) },
      },
      include: { client: true, items: true },
    });

    return NextResponse.json({ devis }, { status: 201 });
  } catch (error) {
    console.error("Erreur création devis:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
