import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "factures";
    const format = searchParams.get("format") || "csv";

    if (format !== "csv") return NextResponse.json({ error: "Format non supporté" }, { status: 400 });

    let csv = "";
    let filename = "";

    if (type === "factures") {
      filename = "factures_klara.csv";
      const invoices = await db.invoice.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" }, include: { client: true } });
      csv = "Numéro;Client;Email Client;Statut;Date émission;Date échéance;Sous-total;TVA;Total TTC;Montant payé;Devise\n";
      const statusMap: Record<string, string> = { BROUILLON: "Brouillon", ENVOYEE: "Envoyée", PAYEE: "Payée", EN_RETARD: "En retard", ANNULEE: "Annulée" };
      for (const inv of invoices) {
        csv += [inv.number, inv.client?.name || "", inv.client?.email || "", statusMap[inv.status] || inv.status, inv.issueDate?.toISOString().split("T")[0] || "", inv.dueDate?.toISOString().split("T")[0] || "", inv.subtotal, inv.taxAmount, inv.total, inv.paidAmount || 0, inv.currency || "XOF"].join(";") + "\n";
      }
    } else if (type === "depenses") {
      filename = "depenses_klara.csv";
      const expenses = await db.expense.findMany({ where: { organizationId }, orderBy: { date: "desc" } });
      csv = "Description;Catégorie;Montant;Date;Mode de paiement;Devise\n";
      for (const exp of expenses) {
        csv += [exp.description, exp.category, exp.amount, exp.date?.toISOString().split("T")[0] || "", exp.paymentMethod, exp.currency || "XOF"].join(";") + "\n";
      }
    } else if (type === "clients") {
      filename = "clients_klara.csv";
      const clients = await db.client.findMany({ where: { organizationId, deletedAt: null }, orderBy: { createdAt: "desc" } });
      csv = "Nom;Email;Téléphone;Ville;Type;NIF;Date création\n";
      for (const client of clients) {
        csv += [client.name, client.email || "", client.phone || "", client.city || "", client.type === "ENTREPRISE" ? "Entreprise" : "Particulier", client.taxNumber || "", client.createdAt?.toISOString().split("T")[0] || ""].join(";") + "\n";
      }
    } else {
      return NextResponse.json({ error: "Type non supporté" }, { status: 400 });
    }

    return new NextResponse("\uFEFF" + csv, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"` },
    });
  } catch (error) {
    console.error("Erreur export:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
