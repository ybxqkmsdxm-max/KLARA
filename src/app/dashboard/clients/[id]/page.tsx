"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Trash2,
  Loader2,
} from "lucide-react";
import {
  formatCurrency,
  formatDateShort,
  getInvoiceStatusLabel,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
      return "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
    case "ENVOYEE":
      return "bg-blue-50 text-blue-600 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400";
    case "PAYEE":
      return "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400";
    case "EN_RETARD":
      return "bg-red-50 text-red-600 hover:bg-red-50 dark:bg-red-950 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "PAYEE":
      return <CheckCircle2 className="h-3 w-3" />;
    case "EN_RETARD":
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return null;
  }
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      toast.success("Client supprimé avec succès");
      router.push("/dashboard/clients");
    } catch {
      toast.error("Impossible de supprimer ce client");
    } finally {
      setDeleting(false);
    }
  };

  // Computed stats
  const facturesEnRetard = client?.factures.filter(
    (f) => f.status === "EN_RETARD"
  ).length ?? 0;

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
        <Skeleton className="h-12 w-full rounded-xl" />
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
                  ? "bg-[#1A1A2E]/5 text-[#1A1A2E] dark:bg-[#1A1A2E]/20 dark:text-white"
                  : "bg-[#00D4AA]/10 text-[#00D4AA]"
              )}
            >
              {client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-1.5 text-sm text-muted-foreground">
            {client.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {client.phone}
              </span>
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

      {/* Contact actions section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            {client.email && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => toast.success("Email envoyé")}
              >
                <Mail className="h-4 w-4" />
                <span>Envoyer un email</span>
              </Button>
            )}
            {client.phone && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => toast.info("Appel en cours...")}
              >
                <Phone className="h-4 w-4" />
                <span>Appeler</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              asChild
            >
              <Link href="/dashboard/factures/nouvelle">
                <FileText className="h-4 w-4" />
                <span>Créer une facture</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="group hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Wallet className="h-5 w-5 text-[#00D4AA]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total facturé</p>
                <p className="text-lg font-bold">{formatCurrency(client.totalFacture)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total payé</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(client.totalPaye)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="group hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200",
                facturesEnRetard > 0
                  ? "bg-[#FF6B6B]/10"
                  : "bg-emerald-50 dark:bg-emerald-950"
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  facturesEnRetard > 0
                    ? "text-[#FF6B6B]"
                    : "text-emerald-600 dark:text-emerald-400"
                )} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Factures en retard</p>
                <p className={cn(
                  "text-lg font-bold",
                  facturesEnRetard > 0 ? "text-[#FF6B6B]" : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {facturesEnRetard}
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
            <div className="divide-y max-h-96 overflow-y-auto">
              {client.factures.map((invoice) => {
                const paymentPercent =
                  invoice.total > 0
                    ? Math.round((invoice.paidAmount / invoice.total) * 100)
                    : 0;
                const isPartial =
                  paymentPercent > 0 && paymentPercent < 100;
                const isPaid = paymentPercent >= 100;

                return (
                  <Link
                    key={invoice.id}
                    href={`/dashboard/factures/${invoice.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {invoice.number}
                          </p>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-medium shrink-0",
                              getStatusStyle(invoice.status)
                            )}
                          >
                            <span className="flex items-center gap-1">
                              {getStatusIcon(invoice.status)}
                              {getInvoiceStatusLabel(invoice.status)}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {formatDateShort(invoice.issueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold font-mono">
                        {formatCurrency(invoice.total)}
                      </p>
                      {(isPartial || isPaid) && (
                        <div className="flex items-center gap-2 justify-end mt-1">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                isPaid
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              )}
                              style={{ width: `${paymentPercent}%` }}
                            />
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-medium",
                              isPaid
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            )}
                          >
                            {paymentPercent}%
                          </span>
                        </div>
                      )}
                      {!isPaid && !isPartial && invoice.montantDu > 0 && (
                        <span className="text-[10px] text-[#FF6B6B] mt-0.5 block">
                          Reste: {formatCurrency(invoice.montantDu)}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
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

      {/* Danger zone */}
      <Card className="border-[#FF6B6B]/30 dark:border-[#FF6B6B]/20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-[#FF6B6B] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Zone de danger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Supprimer ce client</p>
              <p className="text-xs text-muted-foreground">
                Cette action est irréversible. Les factures associées seront conservées.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="shrink-0 flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer le client
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer {client.name} ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Le client sera marqué comme supprimé
                    et n&apos;apparaîtra plus dans la liste. Ses factures existantes seront
                    conservées dans le système.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white focus:ring-[#FF6B6B]/30"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      "Supprimer définitivement"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
