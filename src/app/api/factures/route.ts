import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { generateInvoiceNumber } from "@/lib/formatters";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const createInvoiceSchema = z.object({
  clientId: z.string().min(1, "Le client est requis"),
  issueDate: z.string().min(1, "La date d'émission est requise"),
  dueDate: z.string().min(1, "La date d'échéance est requise"),
  taxRate: z.number().min(0).max(100).default(18),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  status: z.enum(["BROUILLON", "ENVOYEE"]).optional().default("BROUILLON"),
  items: z.array(z.object({
    description: z.string().min(1, "La description est requise"),
    quantity: z.number().min(0.01, "La quantité doit être positive"),
    unitPrice: z.number().min(0, "Le prix doit être positif"),
  })).min(1, "Au moins un article est requis"),
});

/**
 * GET /api/factures - Liste des factures
 */
export async function GET(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.InvoiceWhereInput = { organizationId };
    if (status && status !== "TOUS") where.status = status;
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { client: { name: { contains: search } } },
      ];
    }

    const [factures, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: { client: true, items: true },
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

/**
 * POST /api/factures - Créer une facture
 */
export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const result = createInvoiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { clientId, issueDate, dueDate, items, taxRate, notes, termsAndConditions, status: invoiceStatus } = result.data;

    const count = await db.invoice.count({ where: { organizationId } });
    const number = generateInvoiceNumber(count);

    const subtotal = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
    const taxAmount = Math.round(subtotal * taxRate / 100);
    const total = subtotal + taxAmount;

    const facture = await db.invoice.create({
      data: {
        organizationId, clientId, number,
        status: invoiceStatus,
        issueDate: new Date(issueDate), dueDate: new Date(dueDate),
        sentAt: invoiceStatus === "ENVOYEE" ? new Date() : null,
        subtotal, taxRate, taxAmount, total,
        notes: notes || null, termsAndConditions: termsAndConditions || null,
        items: {
          create: items.map((item, index) => ({
            description: item.description, quantity: item.quantity, unitPrice: item.unitPrice,
            total: Math.round(item.quantity * item.unitPrice), order: index,
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
