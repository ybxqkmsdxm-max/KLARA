"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Users,
  Building2,
  Calendar,
} from "lucide-react";
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getInvoiceStatusLabel,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface ClientInvoice {
  id: string;
  number: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  montantDu: number;
}

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  type: string;
  taxNumber: string | null;
  notes: string | null;
  totalFacture: number;
  totalPaye: number;
  montantDu: number;
  nombreFactures: number;
  factures: ClientInvoice[];
}

function getStatusStyle(status: string) {
  switch (status) {
    case "BROUILLON":
      return "bg-gray-100 text-gray-600 hover:bg-gray-100";
    case "ENVOYEE":
      return "bg-blue-50 text-blue-600 hover:bg-blue-50";
    case "PAYEE":
      return "bg-emerald-50 text-emerald-600 hover:bg-emerald-50";
    case "EN_RETARD":
      return "bg-red-50 text-red-600 hover:bg-red-50";
    default:
      return "bg-gray-100 text-gray-600 hover:bg-gray-100";
  }
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error("Client non trouvé");
      const data = await res.json();
      setClient(data.client);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-[#FFB347] mb-4" />
        <p className="text-lg font-medium mb-2">{error || "Client introuvable"}</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/dashboard/clients">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Retour aux clients
        </Link>
      </Button>

      {/* Client header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center shrink-0",
            client.type === "ENTREPRISE" ? "bg-[#1A1A2E]" : "bg-[#00D4AA]/10"
          )}
        >
          {client.type === "ENTREPRISE" ? (
            <Building2 className="h-8 w-8 text-white" />
          ) : (
            <Users className="h-8 w-8 text-[#00D4AA]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{client.name}</h2>
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px] font-medium",
                client.type === "ENTREPRISE"
                  ? "bg-[#1A1A2E]/5 text-[#1A1A2E]"
                  : "bg-[#00D4AA]/10 text-[#00D4AA]"
              )}
            >
              {client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-muted-foreground">
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                {client.phone}
              </a>
            )}
            {client.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {client.city}
              </span>
            )}
          </div>
          {client.notes && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              &quot;{client.notes}&quot;
            </p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#00D4AA]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CA total</p>
                <p className="text-lg font-bold">{formatCurrency(client.totalFacture)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Montant payé</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(client.totalPaye)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-[#FF6B6B]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Montant dû</p>
                <p className="text-lg font-bold text-[#FF6B6B]">
                  {formatCurrency(client.montantDu)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Factures ({client.nombreFactures})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {client.factures.length > 0 ? (
            <div className="divide-y">
              {client.factures.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{invoice.number}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDateShort(invoice.issueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold">{formatCurrency(invoice.total)}</p>
                    <div className="flex items-center gap-2 justify-end mt-0.5">
                      <Badge
                        variant="secondary"
                        className={cn("text-[10px] font-medium", getStatusStyle(invoice.status))}
                      >
                        {getInvoiceStatusLabel(invoice.status)}
                      </Badge>
                      {invoice.montantDu > 0 && invoice.status !== "PAYEE" && (
                        <span className="text-[10px] text-[#FF6B6B]">
                          Reste: {formatCurrency(invoice.montantDu)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Aucune facture pour ce client
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
