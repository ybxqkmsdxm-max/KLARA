import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/clients - Liste des clients
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    const where: Record<string, unknown> = {
      organizationId: organization.id,
      deletedAt: null,
    };
    if (search) where.name = { contains: search };
    if (type && type !== "TOUS") where.type = type;

    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        include: { invoices: { include: { payments: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.client.count({ where }),
    ]);

    return NextResponse.json({
      clients: clients.map((c) => {
        const totalFacture = c.invoices.reduce((s, i) => s + i.total, 0);
        const totalPaye = c.invoices.reduce((s, i) => s + i.payments.reduce((ps, p) => ps + p.amount, 0), 0);
        return {
          id: c.id, name: c.name, email: c.email, phone: c.phone,
          city: c.city, type: c.type,
          totalFacture, totalPaye, nombreFactures: c.invoices.length,
          derniereFacture: c.invoices.length > 0 ? c.invoices[0].createdAt : null,
        };
      }),
      total, page, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erreur clients:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * POST /api/clients - Créer un client
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, address, city, type, taxNumber, notes } = body;

    if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    const client = await db.client.create({
      data: {
        organizationId: organization.id, name,
        email: email || null, phone: phone || null,
        address: address || null, city: city || null,
        type: type || "PARTICULIER",
        taxNumber: taxNumber || null, notes: notes || null,
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Erreur création client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
