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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  FileSpreadsheet,
  Send,
  Download,
  Copy,
  Trash2,
  Calendar,
  User,
  Clock,
  MoreHorizontal,
  Phone,
  Mail,
  MessageSquare,
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  Hash,
  Loader2,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getQuoteStatusLabel,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface QuoteClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
}

interface Quote {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  expiryDate: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes: string | null;
  convertedToInvoiceId: string | null;
  createdAt: string;
  updatedAt: string;
  client: QuoteClient;
  items: QuoteItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusStyle(status: string) {
  switch (status) {
    case "BROUILLON":
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "ENVOYE":
      return "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    case "ACCEPTE":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
    case "REFUSE":
      return "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300";
    case "EXPIRE":
      return "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "ACCEPTE":
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case "REFUSE":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "EXPIRE":
      return <Clock className="h-4 w-4 text-orange-500" />;
    default:
      return null;
  }
}

function getDaysUntilExpiry(expiryDate: string): number {
  const d = new Date(expiryDate);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
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
        <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Devis introuvable</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Ce devis n&apos;existe pas ou a été supprimé.
      </p>
      <Button asChild className="bg-[#00D4AA] hover:bg-[#00C19C] text-white">
        <Link href="/dashboard/devis">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux devis
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
        Impossible de charger les détails de ce devis.
      </p>
      <Button variant="outline" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function DevisDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [converting, setConverting] = useState(false);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      setError(false);
      setNotFound(false);
      const res = await fetch(`/api/devis/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setQuote(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, [id, fetchQuote]);

  const handleConvertToInvoice = async () => {
    if (!quote) return;
    try {
      setConverting(true);
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromQuoteId: quote.id }),
      });
      if (res.ok) {
        toast.success("Devis converti en facture avec succès !");
        setQuote({ ...quote, convertedToInvoiceId: "new-invoice" });
      } else {
        toast.error("Erreur lors de la conversion");
      }
    } catch {
      toast.error("Erreur lors de la conversion");
    } finally {
      setConverting(false);
    }
  };

  const handleAction = (action: string) => {
    switch (action) {
      case "send":
        toast.success(`Devis ${quote?.number} envoyé au client (demo)`);
        break;
      case "download":
        toast.info("Téléchargement du PDF en cours... (demo)");
        break;
      case "duplicate":
        toast.info("Duplication du devis... (demo)");
        break;
      case "delete":
        toast.error("Suppression du devis... (demo)");
        break;
      default:
        break;
    }
  };

  // ── Render states ──

  if (loading) return <DetailSkeleton />;
  if (notFound) return <NotFoundState />;
  if (error) return <ErrorState onRetry={fetchQuote} />;
  if (!quote) return <NotFoundState />;

  // ── Computed values ──

  const daysUntilExpiry = getDaysUntilExpiry(quote.expiryDate);
  const isExpired = quote.status === "EXPIRE" || daysUntilExpiry < 0;
  const isUrgent = !isExpired && !["ACCEPTE", "REFUSE"].includes(quote.status) && daysUntilExpiry <= 7;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 shrink-0 mt-1">
            <Link href="/dashboard/devis">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold truncate">
                {quote.number}
              </h2>
              <Badge
                variant="secondary"
                className={cn("text-xs font-medium", getStatusStyle(quote.status))}
              >
                <span className="flex items-center gap-1.5">
                  {getStatusIcon(quote.status)}
                  {getQuoteStatusLabel(quote.status)}
                </span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Devis pour{" "}
              <span className="font-medium text-foreground">
                {quote.client.name}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Convert to invoice button */}
          {quote.status === "ACCEPTE" && !quote.convertedToInvoiceId && (
            <Button
              onClick={handleConvertToInvoice}
              disabled={converting}
              className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium"
            >
              {converting ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-1.5" />
              )}
              <span className="hidden sm:inline">Convertir en facture</span>
              <span className="sm:hidden">Convertir</span>
            </Button>
          )}

          {quote.convertedToInvoiceId && (
            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950">
              <CheckCircle className="h-3 w-3 mr-1" />
              Converti
            </Badge>
          )}

          {/* Download PDF button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction("download")}
            className="gap-1.5"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleAction("send")} className="gap-2 cursor-pointer">
                <Send className="h-4 w-4 text-blue-500" />
                Envoyer au client
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("download")} className="gap-2 cursor-pointer">
                <Download className="h-4 w-4 text-muted-foreground" />
                Télécharger PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction("duplicate")} className="gap-2 cursor-pointer">
                <Copy className="h-4 w-4 text-muted-foreground" />
                Dupliquer
              </DropdownMenuItem>
              {quote.status === "ACCEPTE" && !quote.convertedToInvoiceId && (
                <DropdownMenuItem
                  onClick={handleConvertToInvoice}
                  disabled={converting}
                  className="gap-2 cursor-pointer text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Convertir en facture
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
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
              <p className="text-base font-semibold">{quote.client.name}</p>
              <Badge variant="outline" className="text-[10px] mt-1">
                {quote.client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
              </Badge>
            </div>
            {quote.client.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{quote.client.email}</span>
              </div>
            )}
            {quote.client.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{quote.client.phone}</span>
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
                  {formatDate(quote.issueDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Date d&apos;expiration</p>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(quote.expiryDate)}
                </p>
              </div>
            </div>
            {isExpired && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-100 dark:border-orange-900">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Ce devis a expiré
                </span>
              </div>
            )}
            {isUrgent && !isExpired && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-100 dark:border-amber-900">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Expire dans {daysUntilExpiry} jour{daysUntilExpiry > 1 ? "s" : ""}
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Créé le {formatDate(quote.createdAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Line Items Table ───────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Lignes du devis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {quote.items.length > 0 ? (
            <>
              {/* Mobile layout */}
              <div className="sm:hidden divide-y px-4">
                {quote.items.map((item) => (
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
                    {quote.items.map((item) => (
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
                    {formatCurrency(quote.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    TVA ({quote.taxRate}%)
                  </span>
                  <span className="font-medium font-mono">
                    {formatCurrency(quote.taxAmount)}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold">Total TTC</span>
                  <span className="text-lg sm:text-xl font-bold text-[#00D4AA] font-mono">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune ligne dans ce devis
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Notes ──────────────────────────────────────────────── */}
      {quote.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {quote.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Summary info cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Statut</p>
            <Badge
              variant="secondary"
              className={cn("text-[10px] font-medium", getStatusStyle(quote.status))}
            >
              {getQuoteStatusLabel(quote.status)}
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Émis le</p>
            <p className="text-sm font-semibold">{formatDateShort(quote.issueDate)}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Expire le</p>
            <p className="text-sm font-semibold">{formatDateShort(quote.expiryDate)}</p>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Articles</p>
            <p className="text-sm font-semibold">{quote.items.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Back link (mobile) ─────────────────────────────────── */}
      <div className="sm:hidden">
        <Button
          variant="ghost"
          asChild
          className="w-full justify-center text-muted-foreground"
        >
          <Link href="/dashboard/devis">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux devis
          </Link>
        </Button>
      </div>
    </div>
  );
}
