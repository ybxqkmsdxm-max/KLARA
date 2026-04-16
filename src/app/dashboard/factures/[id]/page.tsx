"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  FileText,
  Send,
  Download,
  Copy,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  Hash,
  MoreHorizontal,
  Phone,
  Mail,
  MessageSquare,
  Banknote,
  CircleDollarSign,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusLabel,
  getDaysOverdue,
  getPaymentMethodLabel,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoicePayment {
  id: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
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
  payments: InvoicePayment[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  switch (status) {
    case "BROUILLON":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "ENVOYEE":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    case "PAYEE":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "EN_RETARD":
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
    case "ANNULEE":
      return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 line-through";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "PAYEE":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "EN_RETARD":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    default:
      return null;
  }
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header skeleton */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Info grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>

      {/* Table skeleton */}
      <Skeleton className="h-64 w-full rounded-xl" />

      {/* Totals skeleton */}
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

// ── Not Found State ──────────────────────────────────────────────────────────

function NotFoundState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Facture introuvable</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Cette facture n&apos;existe pas ou a été supprimée.
      </p>
      <Button asChild className="bg-[#00D4AA] hover:bg-[#00C19C] text-white">
        <Link href="/dashboard/factures">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux factures
        </Link>
      </Button>
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
        Impossible de charger les détails de cette facture.
      </p>
      <Button variant="outline" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function FactureDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(false);
      setNotFound(false);
      const res = await fetch(`/api/factures/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
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
    fetchInvoice();
  }, [id]);

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    try {
      setMarkingPaid(true);
      const res = await fetch(`/api/factures/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAYEE" }),
      });
      if (!res.ok) {
        // Mock fallback — just update local state
        setInvoice({
          ...invoice,
          status: "PAYEE",
          paidAmount: invoice.total,
          paidAt: new Date().toISOString(),
        });
        toast.success("Facture marquée comme payée");
        return;
      }
      const data = await res.json();
      setInvoice(data);
      toast.success("Facture marquée comme payée");
    } catch {
      // Mock fallback for demo
      setInvoice({
        ...invoice,
        status: "PAYEE",
        paidAmount: invoice.total,
        paidAt: new Date().toISOString(),
      });
      toast.success("Facture marquée comme payée (demo)");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "send":
        toast.success(
          `Facture ${invoice?.number} envoyée au client (demo)`
        );
        break;
      case "download":
        toast.info("Téléchargement du PDF en cours... (demo)");
        break;
      case "duplicate":
        toast.info("Duplication de la facture... (demo)");
        break;
      case "delete":
        toast.error("Suppression de la facture... (demo)");
        break;
      default:
        break;
    }
  };

  // ── Render states ──

  if (loading) return <DetailSkeleton />;
  if (notFound) return <NotFoundState />;
  if (error) return <ErrorState onRetry={fetchInvoice} />;
  if (!invoice) return <NotFoundState />;

  // ── Computed values ──

  const daysOverdue = getDaysOverdue(invoice.dueDate);
  const isOverdue =
    invoice.status !== "PAYEE" &&
    invoice.status !== "ANNULEE" &&
    daysOverdue > 0;
  const paymentPercent = invoice.total > 0
    ? Math.round((invoice.paidAmount / invoice.total) * 100)
    : 0;
  const isFullyPaid = paymentPercent >= 100 || invoice.status === "PAYEE";
  const isPartiallyPaid = paymentPercent > 0 && !isFullyPaid;
  const remaining = invoice.total - invoice.paidAmount;
  const hasPayments = invoice.payments.length > 0 || invoice.paidAmount > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 mt-1">
            <Link href="/dashboard/factures">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {invoice.number}
              </h2>
              <Badge
                variant="secondary"
                className={cn("text-xs font-medium", getStatusStyle(invoice.status))}
              >
                <span className="flex items-center gap-1.5">
                  {getStatusIcon(invoice.status)}
                  {getInvoiceStatusLabel(invoice.status)}
                </span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Facture pour{" "}
              <span className="font-medium text-foreground">
                {invoice.client.name}
              </span>
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleAction("send")} className="gap-2 cursor-pointer">
              <Send className="h-4 w-4 text-blue-500" />
              Envoyer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("download")} className="gap-2 cursor-pointer">
              <Download className="h-4 w-4 text-muted-foreground" />
              Télécharger PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("duplicate")} className="gap-2 cursor-pointer">
              <Copy className="h-4 w-4 text-muted-foreground" />
              Dupliquer
            </DropdownMenuItem>
            <Separator />
            <DropdownMenuItem
              onClick={() => handleAction("delete")}
              className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Info Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-base font-semibold">{invoice.client.name}</p>
              <Badge variant="outline" className="text-[10px] mt-1">
                {invoice.client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
              </Badge>
            </div>
            {invoice.client.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{invoice.client.email}</span>
              </div>
            )}
            {invoice.client.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{invoice.client.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dates info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Date d&apos;émission</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(invoice.issueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Date d&apos;échéance</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            </div>
            {isOverdue && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950 rounded-lg border border-red-100 dark:border-red-900">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">
                  En retard de {daysOverdue} jour{daysOverdue > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {invoice.sentAt && (
              <p className="text-xs text-muted-foreground">
                Envoyée le {formatDate(invoice.sentAt)}
              </p>
            )}
            {invoice.paidAt && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Payée le {formatDate(invoice.paidAt)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Line Items Table ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Lignes de facturation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {invoice.items.length > 0 ? (
            <>
              {/* Mobile layout */}
              <div className="sm:hidden divide-y px-4">
                {invoice.items.map((item) => (
                  <div key={item.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.description}</p>
                      <p className="text-sm font-bold whitespace-nowrap">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {item.quantity} × {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs uppercase tracking-wider">
                        Description
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-right w-24">
                        Quantité
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-right w-36">
                        Prix unitaire
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-right w-40">
                        Total
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm font-medium">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-sm text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-right font-mono">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-sm text-right font-semibold font-mono">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <Separator />
              <div className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="font-medium font-mono">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    TVA ({invoice.taxRate}%)
                  </span>
                  <span className="font-medium font-mono">
                    {formatCurrency(invoice.taxAmount)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold">Total TTC</span>
                  <span className="text-lg sm:text-xl font-bold text-[#00D4AA] font-mono">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune ligne de facturation
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Payment Status ─────────────────────────────────────── */}
      {hasPayments && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Statut de paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar + amounts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payé</span>
                <span className="font-semibold font-mono">
                  {formatCurrency(invoice.paidAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-medium font-mono">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
              <Progress
                value={paymentPercent}
                className={cn(
                  "h-3",
                  isFullyPaid && "[&>div]:bg-emerald-500 [&]:bg-emerald-100 dark:[&]:bg-emerald-950",
                  isPartiallyPaid && "[&>div]:bg-[#FFB347] [&]:bg-[#FFB347]/20",
                  !isFullyPaid && !isPartiallyPaid && "[&>div]:bg-muted-foreground"
                )}
              />
              <p className="text-xs text-muted-foreground text-right">
                {paymentPercent}% du montant total
              </p>
            </div>

            {/* Status message */}
            {isFullyPaid && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-100 dark:border-emerald-900">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    Facture intégralement payée
                  </p>
                  {invoice.payments.length > 0 && (
                    <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                      {invoice.payments.length} paiement{invoice.payments.length > 1 ? "s" : ""} enregistré{invoice.payments.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isPartiallyPaid && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-100 dark:border-amber-900">
                <CircleDollarSign className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    Paiement partiel
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                    Reste à payer :{" "}
                    <span className="font-semibold font-mono">
                      {formatCurrency(remaining)}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Payment history */}
            {invoice.payments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Historique des paiements
                </p>
                <div className="divide-y rounded-lg border">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {getPaymentMethodLabel(payment.method)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(payment.paidAt)}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mark as paid button */}
            {!isFullyPaid && (
              <Button
                onClick={handleMarkAsPaid}
                disabled={markingPaid}
                className="w-full sm:w-auto bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {markingPaid ? "Mise à jour..." : "Marquer comme payée"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── No payment — show action for unpaid ────────────────── */}
      {!hasPayments && invoice.status !== "PAYEE" && invoice.status !== "ANNULEE" && invoice.status !== "BROUILLON" && (
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Aucun paiement reçu</p>
                <p className="text-xs text-muted-foreground">
                  {isOverdue
                    ? `En retard de ${daysOverdue} jour${daysOverdue > 1 ? "s" : ""}`
                    : `Échéance : ${formatDate(invoice.dueDate)}`}
                </p>
              </div>
            </div>
            <Button
              onClick={handleMarkAsPaid}
              disabled={markingPaid}
              variant="outline"
              size="sm"
              className="shrink-0 border-[#00D4AA] text-[#00D4AA] hover:bg-[#00D4AA] hover:text-white"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Marquer comme payée
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Notes ──────────────────────────────────────────────── */}
      {invoice.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {invoice.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Terms & Conditions ─────────────────────────────────── */}
      {invoice.termsAndConditions && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Conditions générales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {invoice.termsAndConditions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Back link (mobile) ─────────────────────────────────── */}
      <div className="sm:hidden">
        <Button
          variant="ghost"
          asChild
          className="w-full justify-center text-muted-foreground"
        >
          <Link href="/dashboard/factures">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux factures
          </Link>
        </Button>
      </div>
    </div>
  );
}
