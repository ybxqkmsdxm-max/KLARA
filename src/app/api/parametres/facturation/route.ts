import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const billingSchema = z.object({
  taxRate: z.string().trim().min(1, "Le taux de TVA est requis"),
  paymentTerms: z.string().trim().min(1, "Le délai de paiement est requis"),
  defaultNotes: z.string().optional().default(""),
  defaultTerms: z.string().optional().default(""),
});

const BILLING_DEFAULTS = {
  taxRate: "18",
  paymentTerms: "30",
  defaultNotes:
    "Merci pour votre confiance.\n\nLe paiement est attendu dans les délais convenus.\n\nCordialement,\nL'équipe Boutique Excellence",
  defaultTerms:
    "Paiement à réception de la facture. Tout retard de paiement entraînera des pénalités de retard calculées au taux annuel de 10%.",
};

type BillingRow = {
  taxRate: number;
  paymentTerms: string;
  defaultNotes: string;
  defaultTerms: string;
};

async function ensureBillingSettingsTable() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS organization_billing_settings (
      organization_id TEXT PRIMARY KEY,
      tax_rate INTEGER NOT NULL DEFAULT 18,
      payment_terms TEXT NOT NULL DEFAULT '30',
      default_notes TEXT NOT NULL DEFAULT '',
      default_terms TEXT NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function normalizeBilling(row?: BillingRow) {
  if (!row) return BILLING_DEFAULTS;
  return {
    taxRate: String(row.taxRate),
    paymentTerms: row.paymentTerms || BILLING_DEFAULTS.paymentTerms,
    defaultNotes: row.defaultNotes ?? BILLING_DEFAULTS.defaultNotes,
    defaultTerms: row.defaultTerms ?? BILLING_DEFAULTS.defaultTerms,
  };
}

export async function GET() {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    await ensureBillingSettingsTable();

    const rows = await db.$queryRawUnsafe<BillingRow[]>(
      `SELECT tax_rate as taxRate, payment_terms as paymentTerms, default_notes as defaultNotes, default_terms as defaultTerms
       FROM organization_billing_settings
       WHERE organization_id = ?
       LIMIT 1`,
      organizationId
    );

    return NextResponse.json({ billing: normalizeBilling(rows[0]) });
  } catch (error) {
    console.error("Erreur récupération paramètres facturation:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const result = billingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const taxRateNumber = Number.parseFloat(result.data.taxRate);
    if (!Number.isFinite(taxRateNumber) || taxRateNumber < 0 || taxRateNumber > 100) {
      return NextResponse.json(
        { error: "Données invalides", details: { taxRate: ["Le taux de TVA doit être entre 0 et 100"] } },
        { status: 422 }
      );
    }

    await ensureBillingSettingsTable();

    await db.$executeRawUnsafe(
      `INSERT INTO organization_billing_settings (
         organization_id, tax_rate, payment_terms, default_notes, default_terms
       ) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(organization_id) DO UPDATE SET
         tax_rate = excluded.tax_rate,
         payment_terms = excluded.payment_terms,
         default_notes = excluded.default_notes,
         default_terms = excluded.default_terms,
         updated_at = CURRENT_TIMESTAMP`,
      organizationId,
      Math.round(taxRateNumber),
      result.data.paymentTerms,
      result.data.defaultNotes ?? "",
      result.data.defaultTerms ?? ""
    );

    const rows = await db.$queryRawUnsafe<BillingRow[]>(
      `SELECT tax_rate as taxRate, payment_terms as paymentTerms, default_notes as defaultNotes, default_terms as defaultTerms
       FROM organization_billing_settings
       WHERE organization_id = ?
       LIMIT 1`,
      organizationId
    );

    return NextResponse.json({ billing: normalizeBilling(rows[0]) });
  } catch (error) {
    console.error("Erreur sauvegarde paramètres facturation:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
