import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { generateQuoteNumber } from "@/lib/formatters";
import { z } from "zod";

const createQuoteSchema = z.object({
  clientId: z.string().min(1, "Le client est requis"),
  issueDate: z.string().min(1, "La date d'émission est requise"),
  expiryDate: z.string().min(1, "La date d'expiration est requise"),
  taxRate: z.number().min(0).max(100).default(18),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, "La description est requise"),
    quantity: z.number().min(0.01, "La quantité doit être positive"),
    unitPrice: z.number().min(0, "Le prix doit être positif"),
  })).min(1, "Au moins un article est requis"),
});

export async function GET(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = { organizationId };
    if (status && status !== "TOUS") where.status = status;

    const [devis, total] = await Promise.all([
      db.quote.findMany({ where, include: { client: true, items: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      db.quote.count({ where }),
    ]);

    return NextResponse.json({
      devis: devis.map((d) => ({
        id: d.id, number: d.number, status: d.status, issueDate: d.issueDate, expiryDate: d.expiryDate,
        subtotal: d.subtotal, taxRate: d.taxRate, taxAmount: d.taxAmount, total: d.total,
        clientName: d.client.name, clientEmail: d.client.email, itemsCount: d.items.length,
      })),
      total, page, totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Erreur devis:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const result = createQuoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.flatten().fieldErrors }, { status: 422 });
    }

    const { clientId, issueDate, expiryDate, items, taxRate, notes } = result.data;

    const count = await db.quote.count({ where: { organizationId } });
    const number = generateQuoteNumber(count);

    const subtotal = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * taxRate / 100);
    const total = subtotal + taxAmount;

    const devis = await db.quote.create({
      data: {
        organizationId, clientId, number, status: "BROUILLON",
        issueDate: new Date(issueDate), expiryDate: new Date(expiryDate),
        subtotal, taxRate, taxAmount, total, notes: notes || null,
        items: { create: items.map((item, index) => ({
          description: item.description, quantity: item.quantity, unitPrice: item.unitPrice,
          total: Math.round(item.quantity * item.unitPrice), order: index,
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
