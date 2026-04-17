import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

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

    if (!quote) return NextResponse.json({ error: "Devis non trouvé" }, { status: 404 });

    return NextResponse.json({
      id: quote.id, number: quote.number, status: quote.status,
      issueDate: quote.issueDate.toISOString(), expiryDate: quote.expiryDate.toISOString(),
      subtotal: quote.subtotal, taxRate: quote.taxRate, taxAmount: quote.taxAmount, total: quote.total,
      currency: quote.currency, notes: quote.notes, convertedToInvoiceId: quote.convertedToInvoiceId,
      createdAt: quote.createdAt.toISOString(), updatedAt: quote.updatedAt.toISOString(),
      client: { id: quote.client.id, name: quote.client.name, email: quote.client.email, phone: quote.client.phone, type: quote.client.type },
      items: quote.items.map((item) => ({ id: item.id, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, total: item.total })),
    });
  } catch (error) {
    console.error("Erreur détail devis:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
