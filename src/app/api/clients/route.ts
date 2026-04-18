import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { z } from "zod";

const createClientSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  type: z.enum(["PARTICULIER", "ENTREPRISE"]).default("PARTICULIER"),
  taxNumber: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/clients
 */
export async function GET(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { organizationId, deletedAt: null };
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
 * POST /api/clients
 */
export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const result = createClientSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = result.data;
    const client = await db.client.create({
      data: {
        organizationId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        type: data.type,
        taxNumber: data.taxNumber || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Erreur création client:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
