import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/export?type=factures|depenses|clients&format=csv
 * Export data as CSV file
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "factures";
    const format = searchParams.get("format") || "csv";

    if (format !== "csv") {
      return NextResponse.json({ error: "Format non supporté. Utilisez csv." }, { status: 400 });
    }

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    let csv = "";
    let filename = "";

    if (type === "factures") {
      filename = "factures_klara.csv";
      const invoices = await db.invoice.findMany({
        where: { organizationId: organization.id },
        orderBy: { createdAt: "desc" },
        include: { client: true },
      });

      const headers = ["Numéro", "Client", "Email Client", "Statut", "Date émission", "Date échéance", "Sous-total", "TVA", "Total TTC", "Montant payé", "Devise"];
      csv = headers.join(";") + "\n";

      for (const inv of invoices) {
        const statusMap: Record<string, string> = {
          BROUILLON: "Brouillon",
          ENVOYEE: "Envoyée",
          PAYEE: "Payée",
          EN_RETARD: "En retard",
          ANNULEE: "Annulée",
        };
        const row = [
          inv.number,
          inv.client?.name || "",
          inv.client?.email || "",
          statusMap[inv.status] || inv.status,
          inv.issueDate?.toISOString().split("T")[0] || "",
          inv.dueDate?.toISOString().split("T")[0] || "",
          inv.subtotal.toString(),
          inv.taxAmount.toString(),
          inv.total.toString(),
          (inv.paidAmount || 0).toString(),
          inv.currency || "XOF",
        ];
        csv += row.join(";") + "\n";
      }
    } else if (type === "depenses") {
      filename = "depenses_klara.csv";
      const expenses = await db.expense.findMany({
        where: { organizationId: organization.id },
        orderBy: { date: "desc" },
      });

      const headers = ["Description", "Catégorie", "Montant", "Date", "Mode de paiement", "Devise"];
      csv = headers.join(";") + "\n";

      const categoryMap: Record<string, string> = {
        LOYER: "Loyer",
        SALAIRES: "Salaires",
        FOURNITURES: "Fournitures",
        TRANSPORT: "Transport",
        COMMUNICATION: "Communication",
        MARKETING: "Marketing",
        IMPOTS: "Impôts",
        MAINTENANCE: "Maintenance",
        AUTRE: "Autre",
      };
      const methodMap: Record<string, string> = {
        ESPECES: "Espèces",
        MOBILE_MONEY: "Mobile Money",
        VIREMENT: "Virement",
        CHEQUE: "Chèque",
      };

      for (const exp of expenses) {
        const row = [
          exp.description,
          categoryMap[exp.category] || exp.category,
          exp.amount.toString(),
          exp.date?.toISOString().split("T")[0] || "",
          methodMap[exp.paymentMethod] || exp.paymentMethod,
          exp.currency || "XOF",
        ];
        csv += row.join(";") + "\n";
      }
    } else if (type === "clients") {
      filename = "clients_klara.csv";
      const clients = await db.client.findMany({
        where: { organizationId: organization.id, deletedAt: null },
        orderBy: { createdAt: "desc" },
      });

      const headers = ["Nom", "Email", "Téléphone", "Ville", "Type", "NIF", "Date création"];
      csv = headers.join(";") + "\n";

      for (const client of clients) {
        const row = [
          client.name,
          client.email || "",
          client.phone || "",
          client.city || "",
          client.type === "ENTREPRISE" ? "Entreprise" : "Particulier",
          client.taxNumber || "",
          client.createdAt?.toISOString().split("T")[0] || "",
        ];
        csv += row.join(";") + "\n";
      }
    } else {
      return NextResponse.json({ error: "Type non supporté. Utilisez factures, depenses ou clients." }, { status: 400 });
    }

    // Add BOM for Excel UTF-8 support
    const bom = "\uFEFF";
    const csvBuffer = bom + csv;

    return new NextResponse(csvBuffer, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Erreur export:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
