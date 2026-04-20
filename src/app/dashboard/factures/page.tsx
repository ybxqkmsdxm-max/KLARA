"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  Download,
  Loader2,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDateShort, getInvoiceStatusLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  number: string;
  status: string;
  total: number;
  issueDate: string;
  dueDate: string;
  clientName: string;
  clientEmail: string | null;
  itemsCount: number;
}

const statusTabs = [
  { value: "", label: "Tous" },
  { value: "BROUILLON", label: "Brouillon" },
  { value: "ENVOYEE", label: "Envoyée" },
  { value: "PAYEE", label: "Payée" },
  { value: "EN_RETARD", label: "En retard" },
];

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

export default function FacturesPage() {
  const router = useRouter();
  const [factures, setFactures] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchFactures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeTab) params.set("status", activeTab);
      params.set("page", page.toString());
      params.set("limit", "20");
      const res = await fetch(`/api/factures?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setFactures(data.factures);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError("Impossible de charger les factures");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFactures();
  }, [fetchFactures]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const filteredFactures = search
    ? factures.filter(
        (f) =>
          f.clientName.toLowerCase().includes(search.toLowerCase()) ||
          f.number.toLowerCase().includes(search.toLowerCase())
      )
    : factures;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Page Header — Desktop */}
      <div className="hidden lg:block rounded-xl bg-gradient-to-r from-[#1A1A2E] to-[#1A1A2E]/90 text-white px-6 py-5 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Factures</h2>
            <p className="text-sm text-white/70 mt-0.5">Gérez vos factures et suivez les paiements</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-3xl font-bold tabular-nums">{total}</p>
              <p className="text-xs text-white/60">facture{total > 1 ? "s" : ""} au total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header — Mobile & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Factures</h2>
          <p className="text-sm text-muted-foreground">
            {total} facture{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={exporting || factures.length === 0}
            onClick={async () => {
              setExporting(true);
              try {
                const res = await fetch("/api/export?type=factures&format=csv");
                if (!res.ok) throw new Error();
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "klara-factures.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Export des factures téléchargé");
              } catch {
                toast.error("Erreur lors de l'export");
              } finally {
                setExporting(false);
              }
            }}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Button
            asChild
            className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium"
          >
            <Link href="/dashboard/factures/nouvelle">
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle facture
            </Link>
          </Button>
        </div>
      </div>

      {/* Status tabs with gradient border */}
      <div className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-none rounded-xl bg-muted/50 p-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
              activeTab === tab.value
                ? "bg-[#1A1A2E] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par client ou numéro..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchFactures}
            className="mt-2 text-sm text-[#00D4AA] hover:text-[#00C19C] font-medium"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Mobile: Cards */}
          <div className="block lg:hidden space-y-3">
            {filteredFactures.length > 0 ? (
              filteredFactures.map((facture) => (
                <Link key={facture.id} href={`/dashboard/factures/${facture.id}`}>
                  <Card className="hover:shadow-md active:scale-[0.98] active:border-[#00D4AA]/30 transition-all duration-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold">{facture.clientName}</p>
                          <p className="text-xs text-muted-foreground">{facture.number}</p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] font-medium", getStatusStyle(facture.status))}
                        >
                          {getInvoiceStatusLabel(facture.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-muted-foreground">
                          {formatDateShort(facture.issueDate)}
                        </span>
                        <span className="text-sm font-bold">
                          {formatCurrency(facture.total)}
                        </span>
                      </div>
                      {facture.status === "ENVOYEE" && (
                        <p className="text-[10px] text-[#FFB347] mt-1">
                          Échéance: {formatDateShort(facture.dueDate)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                  {activeTab || search ? (
                    <SearchX className="w-10 h-10 text-muted-foreground/40" />
                  ) : (
                    <svg className="w-10 h-10 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                      <line x1="9" y1="11" x2="13" y2="11" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Aucune facture trouvée
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
                  {activeTab || search
                    ? "Vérifiez vos filtres ou votre recherche."
                    : "Créez votre première facture pour commencer à facturer vos clients."}
                </p>
                {(activeTab || search) ? (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => { setActiveTab(""); setSearch(""); }}
                  >
                    <Filter className="h-4 w-4 mr-1.5" />
                    Réinitialiser les filtres
                  </Button>
                ) : activeTab === "" && search === "" && (
                  <Button
                    asChild
                    className="mt-4 bg-[#00D4AA] hover:bg-[#00C19C] text-white"
                  >
                    <Link href="/dashboard/factures/nouvelle">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Créer votre première facture
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Desktop: Table */}
          <div className="hidden lg:block">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">Facture <ChevronUp className="h-3 w-3 opacity-40" /><ChevronDown className="h-3 w-3 -mt-1 opacity-40" /></span>
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">Client <ChevronUp className="h-3 w-3 opacity-40" /><ChevronDown className="h-3 w-3 -mt-1 opacity-40" /></span>
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">Date <ChevronUp className="h-3 w-3 opacity-40" /><ChevronDown className="h-3 w-3 -mt-1 opacity-40" /></span>
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">Échéance <ChevronUp className="h-3 w-3 opacity-40" /><ChevronDown className="h-3 w-3 -mt-1 opacity-40" /></span>
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">Montant <ChevronUp className="h-3 w-3 opacity-40" /><ChevronDown className="h-3 w-3 -mt-1 opacity-40" /></span>
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">Statut <ChevronUp className="h-3 w-3 opacity-40" /><ChevronDown className="h-3 w-3 -mt-1 opacity-40" /></span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredFactures.length > 0 ? (
                      filteredFactures.map((facture) => (
                        <tr
                          key={facture.id}
                          className="hover:bg-[#00D4AA]/5 transition-colors cursor-pointer border-l-2 border-l-transparent hover:border-l-[#00D4AA]"
                          onClick={() => router.push(`/dashboard/factures/${facture.id}`)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(`/dashboard/factures/${facture.id}`);
                            }
                          }}
                          tabIndex={0}
                          role="link"
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium">{facture.number}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-medium">{facture.clientName}</p>
                              {facture.clientEmail && (
                                <p className="text-xs text-muted-foreground">
                                  {facture.clientEmail}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDateShort(facture.issueDate)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDateShort(facture.dueDate)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold">
                              {formatCurrency(facture.total)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="secondary"
                              className={cn("text-[10px] font-medium", getStatusStyle(facture.status))}
                            >
                              {getInvoiceStatusLabel(facture.status)}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-16 text-center">
                          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
                            {activeTab || search ? (
                              <SearchX className="w-10 h-10 text-muted-foreground/40" />
                            ) : (
                              <svg className="w-10 h-10 text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="9" y1="15" x2="15" y2="15" />
                                <line x1="9" y1="11" x2="13" y2="11" />
                              </svg>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-muted-foreground">
                            Aucune facture trouvée
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {activeTab || search
                              ? "Vérifiez vos filtres ou votre recherche."
                              : "Créez votre première facture pour commencer à facturer vos clients."}
                          </p>
                          {(activeTab || search) ? (
                            <Button
                              variant="outline"
                              className="mt-4"
                              onClick={() => { setActiveTab(""); setSearch(""); }}
                            >
                              <Filter className="h-4 w-4 mr-1.5" />
                              Réinitialiser les filtres
                            </Button>
                          ) : activeTab === "" && search === "" && (
                            <Button
                              asChild
                              className="mt-4 bg-[#00D4AA] hover:bg-[#00C19C] text-white"
                            >
                              <Link href="/dashboard/factures/nouvelle">
                                <Plus className="h-4 w-4 mr-1.5" />
                                Créer votre première facture
                              </Link>
                            </Button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Précédent</span>
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8"
              >
                <span className="hidden sm:inline mr-1">Suivant</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
