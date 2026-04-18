"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentType } from "react";
import {
  ArrowRight,
  Briefcase,
  Calculator,
  CreditCard,
  HandCoins,
  Package,
  Receipt,
  Search,
  ShoppingCart,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ToolStatus = "disponible" | "optimiser" | "nouveau";

type ToolItem = {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  phase: 1 | 2 | 3 | 4;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

const STATUS_LABELS: Record<ToolStatus, string> = {
  disponible: "Deja disponible",
  optimiser: "A optimiser",
  nouveau: "Nouveau produit",
};

const PHASE_LABELS: Record<ToolItem["phase"], string> = {
  1: "Phase 1 (MVP)",
  2: "Phase 2 (Croissance)",
  3: "Phase 3 (Completude)",
  4: "Phase 4 (Differenciation)",
};

const TOOL_CATALOG: ToolItem[] = [
  {
    id: "facturation-suivi-client",
    name: "Facturation et Suivi client",
    description: "Factures, relances et suivi des impayes.",
    status: "disponible",
    phase: 1,
    href: "/dashboard/factures",
    icon: Receipt,
  },
  {
    id: "rapports-dashboard",
    name: "Rapports et Tableau de bord",
    description: "Pilotage du CA, depenses, tresorerie et performance.",
    status: "optimiser",
    phase: 1,
    href: "/dashboard/rapports",
    icon: Wallet,
  },
  {
    id: "paiements-mobile-money",
    name: "Paiements Mobile Money",
    description: "Encaissements et paiements via Flooz, T-Money, Wave, MTN, Orange.",
    status: "optimiser",
    phase: 1,
    href: "/dashboard/paiements",
    icon: CreditCard,
  },
  {
    id: "caisse-encaissements",
    name: "Caisse et Encaissements",
    description: "Caisse mobile, recu client et reconciliation de journee.",
    status: "nouveau",
    phase: 1,
    href: "/dashboard/caisse",
    icon: HandCoins,
  },
  {
    id: "stocks-inventaire",
    name: "Stocks et Inventaire",
    description: "Suivi stock, inventaire, alertes rupture et valorisation.",
    status: "nouveau",
    phase: 2,
    href: "/dashboard/stocks",
    icon: Package,
  },
  {
    id: "achats-fournisseurs",
    name: "Achats et Fournisseurs",
    description: "Bons de commande, receptions et dettes fournisseurs.",
    status: "nouveau",
    phase: 2,
    href: "/dashboard/achats",
    icon: ShoppingCart,
  },
  {
    id: "ventes-pos",
    name: "Ventes et POS",
    description: "Vente rapide, retours, remises et cycle de vente complet.",
    status: "nouveau",
    phase: 2,
    href: "/dashboard/ventes",
    icon: Briefcase,
  },
  {
    id: "paie-rh",
    name: "Paie et RH",
    description: "Employes, paie mensuelle, CNSS, IRPP et avances.",
    status: "nouveau",
    phase: 3,
    href: "/dashboard/paie",
    icon: Users,
  },
  {
    id: "fiscalite-declarations",
    name: "Fiscalite et Declarations",
    description: "TVA, echeances fiscales et exports DGI.",
    status: "nouveau",
    phase: 3,
    href: "/dashboard/fiscalite",
    icon: Calculator,
  },
  {
    id: "credit-financement",
    name: "Credit et Financement",
    description: "Dossier de financement, suivi des prets et score interne.",
    status: "nouveau",
    phase: 4,
    href: "/dashboard/credit",
    icon: HandCoins,
  },
  {
    id: "multi-activites-projets",
    name: "Multi-activites et Projets",
    description: "Suivi par activite, budget et rentabilite consolidee.",
    status: "nouveau",
    phase: 4,
    href: "/dashboard/activites",
    icon: Wrench,
  },
];

export default function OutilsPage() {
  const [query, setQuery] = useState("");

  const filteredTools = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOL_CATALOG;
    return TOOL_CATALOG.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        STATUS_LABELS[tool.status].toLowerCase().includes(q) ||
        PHASE_LABELS[tool.phase].toLowerCase().includes(q)
    );
  }, [query]);

  const statusCount = useMemo(
    () => ({
      disponible: TOOL_CATALOG.filter((t) => t.status === "disponible").length,
      optimiser: TOOL_CATALOG.filter((t) => t.status === "optimiser").length,
      nouveau: TOOL_CATALOG.filter((t) => t.status === "nouveau").length,
    }),
    []
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#1A1A2E] to-[#1A1A2E]/90 px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Wrench className="h-5 w-5 text-[#00D4AA]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Outils Klara</h2>
              <p className="mt-0.5 text-sm text-white/70">
                Cliquez sur un outil pour ouvrir sa page de travail.
              </p>
            </div>
          </div>
          <Badge className="bg-[#00D4AA]/20 text-[#00D4AA] hover:bg-[#00D4AA]/20">
            {TOOL_CATALOG.length} outils
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Deja disponible</p>
            <p className="text-2xl font-bold text-[#00D4AA]">{statusCount.disponible}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">A optimiser</p>
            <p className="text-2xl font-bold text-[#FFB347]">{statusCount.optimiser}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Nouveaux produits</p>
            <p className="text-2xl font-bold text-[#4A90D9]">{statusCount.nouveau}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Catalogue des outils</CardTitle>
          <CardDescription>
            Chaque carte ouvre directement le module correspondant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un outil..."
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              const statusColor =
                tool.status === "disponible"
                  ? "bg-[#00D4AA]/10 text-[#00D4AA]"
                  : tool.status === "optimiser"
                    ? "bg-[#FFB347]/10 text-[#FFB347]"
                    : "bg-[#4A90D9]/10 text-[#4A90D9]";

              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className="group block rounded-xl border border-border p-4 transition-all hover:border-[#00D4AA]/40 hover:bg-[#00D4AA]/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5 text-[#1A1A2E]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{tool.name}</p>
                        <Badge variant="secondary" className={statusColor}>
                          {STATUS_LABELS[tool.status]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {PHASE_LABELS[tool.phase]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{tool.description}</p>
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="pointer-events-none border-[#00D4AA]/30 text-[#00D4AA] group-hover:bg-[#00D4AA]/10"
                        >
                          Acceder a l'outil
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {filteredTools.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun outil trouve pour cette recherche.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
