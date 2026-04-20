"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { FileText, Printer, X, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";

// ── Types ────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
}

interface Invoice {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  currency: string;
  notes: string | null;
  termsAndConditions: string | null;
  paidAt: string | null;
  sentAt: string | null;
  createdAt: string;
  client: InvoiceClient;
  items: InvoiceItem[];
}

// ── Company Info (Mock) ──────────────────────────────────────────────────────

const COMPANY = {
  name: "Boutique Excellence",
  address: "45 Rue du Commerce",
  city: "Lomé, Togo",
  phone: "+228 90 12 34 56",
  email: "contact@boutique-excellence.tg",
  nif: "NIF-TO-2024-XXX",
  bank: "Ecobank Togo — IBAN: TG12 0001 0002 0003 0004 0005",
  rib: "RIB : 00012 00034 00056 00078",
};

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function PrintSkeleton() {
  return (
    <div className="max-w-[210mm] mx-auto p-8 space-y-8">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-16 w-48" />
      </div>
      <Separator />
      <div className="flex justify-between">
        <Skeleton className="h-32 w-56" />
        <Skeleton className="h-32 w-56" />
      </div>
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-28 w-64 ml-auto" />
      <Separator />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

// ── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center">
      <div className="h-16 w-16 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Erreur de chargement</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Impossible de charger les données de la facture.
      </p>
      <Button variant="outline" onClick={onRetry}>Réessayer</Button>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function InvoicePrintPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await fetch(`/api/factures/${id}`);
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setInvoice(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <PrintSkeleton />;
  if (error) return <ErrorState onRetry={fetchInvoice} />;
  if (!invoice) return <ErrorState onRetry={fetchInvoice} />;

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm 12mm 20mm 12mm;
          }

          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          .print-invoice {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .print-invoice * {
            box-shadow: none !important;
            color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }

          .print-table {
            width: 100% !important;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #e5e7eb !important;
            padding: 8px 12px !important;
          }

          .print-table thead th {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-total-section {
            page-break-inside: avoid !important;
          }

          .print-footer {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50">
        {/* ── Action Buttons (hidden in print) ─────────── */}
        <div className="no-print sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
          <div className="max-w-[210mm] mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Fermer</span>
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <Link href={`/dashboard/factures/${id}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Voir la facture
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-[#1A1A2E] hover:bg-[#1A1A2E]/90 text-white gap-2"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Imprimer / PDF</span>
                <span className="sm:hidden">Imprimer</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ── Invoice Document ────────────────────────────── */}
        <div className="max-w-[210mm] mx-auto p-4 sm:p-8 py-8 sm:py-12">
          <div className="print-invoice bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-10 space-y-8">

            {/* ── Header ──────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
              {/* Company info */}
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1A1A2E" }}>
                  Klara
                </h1>
                <div className="text-sm text-muted-foreground space-y-0.5 mt-2">
                  <p className="font-semibold text-foreground">{COMPANY.name}</p>
                  <p>{COMPANY.address}</p>
                  <p>{COMPANY.city}</p>
                  <p>{COMPANY.phone}</p>
                  <p>{COMPANY.email}</p>
                  <p className="font-medium text-foreground mt-1">
                    NIF : {COMPANY.nif}
                  </p>
                </div>
              </div>

              {/* Invoice title + info */}
              <div className="text-left sm:text-right space-y-2 sm:space-y-3">
                <h2
                  className="text-3xl sm:text-4xl font-extrabold tracking-tight"
                  style={{ color: "#1A1A2E" }}
                >
                  FACTURE
                </h2>
                <div className="space-y-1.5">
                  <div className="flex sm:justify-end gap-2 text-sm">
                    <span className="text-muted-foreground sm:hidden">N° :</span>
                    <span className="font-semibold">{invoice.number}</span>
                  </div>
                  <div className="flex sm:justify-end gap-2 text-sm">
                    <span className="text-muted-foreground sm:hidden">Date :</span>
                    <span>{formatDate(invoice.issueDate)}</span>
                  </div>
                  <div className="flex sm:justify-end gap-2 text-sm">
                    <span className="text-muted-foreground sm:hidden">Échéance :</span>
                    <span>{formatDate(invoice.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* ── Client Info ──────────────────────────────── */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Facturer à
              </h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 sm:p-5">
                <p className="text-base font-bold" style={{ color: "#1A1A2E" }}>
                  {invoice.client.name}
                </p>
                {invoice.client.email && (
                  <p className="text-sm text-muted-foreground mt-1">{invoice.client.email}</p>
                )}
                {invoice.client.phone && (
                  <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>
                )}
                {invoice.client.type === "ENTREPRISE" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Entreprise
                  </p>
                )}
              </div>
            </div>

            {/* ── Line Items Table ─────────────────────────── */}
            {invoice.items.length > 0 && (
              <div className="space-y-4">
                <div className="print-table overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                          Description
                        </th>
                        <th className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 w-20">
                          Qté
                        </th>
                        <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 w-36">
                          Prix unitaire
                        </th>
                        <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3 w-40">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr
                          key={item.id}
                          className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                        >
                          <td className="text-sm px-4 py-3 font-medium">
                            {item.description}
                          </td>
                          <td className="text-sm px-4 py-3 text-center tabular-nums">
                            {item.quantity}
                          </td>
                          <td className="text-sm px-4 py-3 text-right font-mono tabular-nums">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="text-sm px-4 py-3 text-right font-semibold font-mono tabular-nums">
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Totals ────────────────────────────────── */}
                <div className="print-total-section flex justify-end">
                  <div className="w-full sm:w-72 space-y-2">
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-muted-foreground">Sous-total HT</span>
                      <span className="font-medium font-mono tabular-nums">
                        {formatCurrency(invoice.subtotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 text-sm">
                      <span className="text-muted-foreground">
                        TVA ({invoice.taxRate}%)
                      </span>
                      <span className="font-medium font-mono tabular-nums">
                        {formatCurrency(invoice.taxAmount)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <span className="text-base font-bold" style={{ color: "#1A1A2E" }}>
                        Total TTC
                      </span>
                      <span
                        className="text-xl font-extrabold font-mono tabular-nums"
                        style={{ color: "#00D4AA" }}
                      >
                        {formatCurrency(invoice.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Notes ─────────────────────────────────────── */}
            {invoice.notes && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {invoice.notes}
                </p>
              </div>
            )}

            {/* ── Terms & Conditions ────────────────────────── */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Conditions
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {invoice.termsAndConditions ||
                  "Paiement dû à la date d'échéance indiquée. En cas de retard de paiement, des intérêts de retard au taux légal seront appliqués. Toute contestation doit être formulée par écrit dans les 8 jours suivant la réception de la facture."}
              </p>
            </div>

            <Separator />

            {/* ── Footer ───────────────────────────────────── */}
            <div className="print-footer space-y-4">
              {/* Bank info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Coordonnées bancaires
                  </h3>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>{COMPANY.bank}</p>
                    <p>{COMPANY.rib}</p>
                  </div>
                </div>
                <div className="sm:text-right">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Contact
                  </h3>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>{COMPANY.email}</p>
                    <p>{COMPANY.phone}</p>
                    <p>{COMPANY.city}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {COMPANY.name} &mdash; {COMPANY.city}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  Document généré par Klara &mdash; Gestion financière intelligente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
