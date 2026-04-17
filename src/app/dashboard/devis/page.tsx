"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  ClipboardList,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  SearchX,
  Filter,
} from "lucide-react";
import { formatCurrency, formatDateShort, getQuoteStatusLabel } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Quote {
  id: string;
  number: string;
  status: string;
  total: number;
  issueDate: string;
  expiryDate: string;
  clientName: string;
  clientEmail: string | null;
  itemsCount: number;
}

const statusTabs = [
  { value: "", label: "Tous" },
  { value: "BROUILLON", label: "Brouillon" },
  { value: "ENVOYE", label: "Envoyé" },
  { value: "ACCEPTE", label: "Accepté" },
  { value: "REFUSE", label: "Refusé" },
  { value: "EXPIRE", label: "Expiré" },
];

function getStatusStyle(status: string) {
  switch (status) {
    case "BROUILLON":
      return "bg-gray-100 text-gray-600 hover:bg-gray-100";
    case "ENVOYE":
      return "bg-blue-50 text-blue-600 hover:bg-blue-50";
    case "ACCEPTE":
      return "bg-emerald-50 text-emerald-600 hover:bg-emerald-50";
    case "REFUSE":
      return "bg-red-50 text-red-600 hover:bg-red-50";
    case "EXPIRE":
      return "bg-orange-50 text-orange-600 hover:bg-orange-50";
    default:
      return "bg-gray-100 text-gray-600 hover:bg-gray-100";
  }
}

export default function DevisPage() {
  const [devis, setDevis] = useState<Quote[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchDevis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (activeTab) params.set("status", activeTab);
      params.set("page", page.toString());
      params.set("limit", "20");
      const res = await fetch(`/api/devis?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setDevis(data.devis);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError("Impossible de charger les devis");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchDevis();
  }, [fetchDevis]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleConvert = async (quoteId: string) => {
    try {
      setConvertingId(quoteId);
      const res = await fetch("/api/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromQuoteId: quoteId }),
      });
      if (!res.ok) throw new Error("Erreur de conversion");
      toast.success("Devis converti en facture avec succès !");
      fetchDevis();
    } catch (err) {
      toast.error("Erreur lors de la conversion en facture");
    } finally {
      setConvertingId(null);
    }
  };

  const filteredDevis = search
    ? devis.filter(
        (d) =>
          d.clientName.toLowerCase().includes(search.toLowerCase()) ||
          d.number.toLowerCase().includes(search.toLowerCase())
      )
    : devis;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Devis</h2>
          <p className="text-sm text-muted-foreground">
            {total} devis au total
          </p>
        </div>
        <Button
          asChild
          className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium"
        >
          <Link href="/dashboard/devis/nouveau">
            <Plus className="h-4 w-4 mr-1.5" />
            Nouveau devis
          </Link>
        </Button>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0",
              activeTab === tab.value
                ? "bg-[#1A1A2E] text-white dark:bg-white dark:text-[#1A1A2E]"
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
            onClick={fetchDevis}
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
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {filteredDevis.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevis.map((devisItem) => (
                <Link key={devisItem.id} href={`/dashboard/devis/${devisItem.id}`}>
                  <Card className="hover:shadow-md hover:border-[#00D4AA]/20 active:scale-[0.98] transition-all duration-200 cursor-pointer h-full">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{devisItem.number}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {devisItem.clientName}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[10px] font-medium shrink-0",
                            getStatusStyle(devisItem.status)
                          )}
                        >
                          {getQuoteStatusLabel(devisItem.status)}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Émis: {formatDateShort(devisItem.issueDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Expire: {formatDateShort(devisItem.expiryDate)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-3.5 w-3.5" />
                          <span>{devisItem.itemsCount} ligne{devisItem.itemsCount > 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-base font-bold">
                          {formatCurrency(devisItem.total)}
                        </span>
                        {devisItem.status === "ACCEPTE" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              handleConvert(devisItem.id);
                            }}
                            disabled={convertingId === devisItem.id}
                          >
                            <ArrowRightLeft className="h-3 w-3 mr-1" />
                            Convertir
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              {(activeTab || search) ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <SearchX className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground mb-1">
                    Aucun devis trouvé
                  </p>
                  <p className="text-xs text-muted-foreground/70 mb-4 max-w-sm mx-auto">
                    Vérifiez vos filtres ou votre recherche.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-0"
                    onClick={() => { setActiveTab(""); setSearch(""); }}
                  >
                    <Filter className="h-4 w-4 mr-1.5" />
                    Réinitialiser les filtres
                  </Button>
                </>
              ) : (
                <>
                  <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Aucun devis trouvé
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1 mb-4">
                    Créez votre premier devis pour commencer
                  </p>
                  <Button
                    asChild
                    className="bg-[#00D4AA] hover:bg-[#00C19C] text-white"
                  >
                    <Link href="/dashboard/devis/nouveau">
                      <Plus className="h-4 w-4 mr-1.5" />
                      Créer votre premier devis
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}

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
