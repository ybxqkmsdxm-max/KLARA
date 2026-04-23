import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { generateInvoiceNumber } from "@/lib/formatters";
import { z } from "zod";

const updateQuoteSchema = z.object({
  status: z.enum(["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE", "EXPIRE"]).optional(),
  convertToInvoice: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const quote = await db.quote.findFirst({
      where: { id, organizationId },
      include: { client: true, items: { orderBy: { order: "asc" } } },
    });

    if (!quote) return NextResponse.json({ error: "Devis non trouve" }, { status: 404 });

    return NextResponse.json({
      id: quote.id,
      number: quote.number,
      status: quote.status,
      issueDate: quote.issueDate.toISOString(),
      expiryDate: quote.expiryDate.toISOString(),
      subtotal: quote.subtotal,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      currency: quote.currency,
      notes: quote.notes,
      convertedToInvoiceId: quote.convertedToInvoiceId,
      createdAt: quote.createdAt.toISOString(),
      updatedAt: quote.updatedAt.toISOString(),
      client: {
        id: quote.client.id,
        name: quote.client.name,
        email: quote.client.email,
        phone: quote.client.phone,
        type: quote.client.type,
      },
      items: quote.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
    });
  } catch (error) {
    console.error("Erreur detail devis:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * PATCH /api/devis/[id]
 * - Mise a jour du statut
 * - Conversion en facture (convertToInvoice: true)
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
    const parsed = updateQuoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { status, convertToInvoice } = parsed.data;
    if (status === undefined && !convertToInvoice) {
      return NextResponse.json(
        { error: "Aucune operation demandee (status ou convertToInvoice requis)" },
        { status: 400 }
      );
    }

    const existingQuote = await db.quote.findFirst({
      where: { id, organizationId },
      include: { items: { orderBy: { order: "asc" } } },
    });

    if (!existingQuote) {
      return NextResponse.json({ error: "Devis non trouve" }, { status: 404 });
    }

    if (convertToInvoice) {
      if (existingQuote.status !== "ACCEPTE") {
        return NextResponse.json(
          { error: "Seuls les devis acceptes peuvent etre convertis en facture" },
          { status: 400 }
        );
      }
      if (existingQuote.convertedToInvoiceId) {
        return NextResponse.json(
          {
            error: "Ce devis est deja converti en facture",
            invoiceId: existingQuote.convertedToInvoiceId,
          },
          { status: 409 }
        );
      }
    }

    const result = await db.$transaction(async (tx) => {
      let invoiceId: string | null = null;
      let invoiceNumber: string | null = null;

      if (convertToInvoice) {
        const invoiceCount = await tx.invoice.count({ where: { organizationId } });
        const number = generateInvoiceNumber(invoiceCount);

        const createdInvoice = await tx.invoice.create({
          data: {
            organizationId,
            clientId: existingQuote.clientId,
            number,
            status: "BROUILLON",
            issueDate: new Date(),
            dueDate: new Date(existingQuote.expiryDate),
            subtotal: existingQuote.subtotal,
            taxRate: existingQuote.taxRate,
            taxAmount: existingQuote.taxAmount,
            total: existingQuote.total,
            currency: existingQuote.currency,
            notes: existingQuote.notes || null,
            items: {
              create: existingQuote.items.map((item, index) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.total,
                order: index,
              })),
            },
          },
        });

        invoiceId = createdInvoice.id;
        invoiceNumber = createdInvoice.number;
      }

      const updatedQuote = await tx.quote.update({
        where: { id: existingQuote.id },
        data: {
          ...(status ? { status } : {}),
          ...(invoiceId ? { convertedToInvoiceId: invoiceId } : {}),
        },
        include: { client: true, items: { orderBy: { order: "asc" } } },
      });

      return { updatedQuote, invoiceId, invoiceNumber };
    });

    return NextResponse.json({
      id: result.updatedQuote.id,
      number: result.updatedQuote.number,
      status: result.updatedQuote.status,
      issueDate: result.updatedQuote.issueDate.toISOString(),
      expiryDate: result.updatedQuote.expiryDate.toISOString(),
      subtotal: result.updatedQuote.subtotal,
      taxRate: result.updatedQuote.taxRate,
      taxAmount: result.updatedQuote.taxAmount,
      total: result.updatedQuote.total,
      currency: result.updatedQuote.currency,
      notes: result.updatedQuote.notes,
      convertedToInvoiceId: result.updatedQuote.convertedToInvoiceId,
      createdAt: result.updatedQuote.createdAt.toISOString(),
      updatedAt: result.updatedQuote.updatedAt.toISOString(),
      client: {
        id: result.updatedQuote.client.id,
        name: result.updatedQuote.client.name,
        email: result.updatedQuote.client.email,
        phone: result.updatedQuote.client.phone,
        type: result.updatedQuote.client.type,
      },
      items: result.updatedQuote.items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      })),
      convertedInvoice: result.invoiceId
        ? { id: result.invoiceId, number: result.invoiceNumber }
        : null,
    });
  } catch (error) {
    console.error("Erreur modification devis:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * DELETE /api/devis/[id]
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const existingQuote = await db.quote.findFirst({ where: { id, organizationId } });
    if (!existingQuote) {
      return NextResponse.json({ error: "Devis non trouve" }, { status: 404 });
    }

    await db.quote.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Erreur suppression devis:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
