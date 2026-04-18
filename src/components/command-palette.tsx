"use client";

import { type ElementType, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  Calculator,
  ClipboardList,
  CreditCard,
  FileText,
  HandCoins,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingCart,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface PaletteItem {
  id: string;
  label: string;
  href: string;
  icon: ElementType;
  keywords: string[];
}

const navigationItems: PaletteItem[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["accueil", "home", "resume", "overview", "stats"],
  },
  {
    id: "caisse",
    label: "Caisse",
    href: "/dashboard/caisse",
    icon: HandCoins,
    keywords: ["encaissement", "caisse", "transaction", "especes", "mobile money"],
  },
  {
    id: "paiements",
    label: "Paiements Mobile Money",
    href: "/dashboard/paiements",
    icon: CreditCard,
    keywords: ["paiement", "mobile money", "flooz", "t-money", "wave", "orange", "mtn"],
  },
  {
    id: "ventes",
    label: "Ventes POS",
    href: "/dashboard/ventes",
    icon: Briefcase,
    keywords: ["vente", "pos", "ticket", "encaisser", "retour"],
  },
  {
    id: "factures",
    label: "Factures",
    href: "/dashboard/factures",
    icon: FileText,
    keywords: ["invoice", "facturation", "paiement", "facturer", "recu"],
  },
  {
    id: "clients",
    label: "Clients",
    href: "/dashboard/clients",
    icon: Users,
    keywords: ["contacts", "customer", "entreprise", "particulier"],
  },
  {
    id: "devis",
    label: "Devis",
    href: "/dashboard/devis",
    icon: ClipboardList,
    keywords: ["quote", "estimation", "proposition"],
  },
  {
    id: "depenses",
    label: "D\u00e9penses",
    href: "/dashboard/depenses",
    icon: Wallet,
    keywords: ["expense", "charge", "cout", "budget"],
  },
  {
    id: "stocks",
    label: "Stocks",
    href: "/dashboard/stocks",
    icon: Package,
    keywords: ["stock", "inventaire", "rupture", "article", "produit"],
  },
  {
    id: "achats",
    label: "Achats",
    href: "/dashboard/achats",
    icon: ShoppingCart,
    keywords: ["fournisseur", "commande", "achat", "livraison", "dette"],
  },
  {
    id: "paie",
    label: "Paie RH",
    href: "/dashboard/paie",
    icon: Users,
    keywords: ["salaire", "paie", "rh", "employe", "cnss"],
  },
  {
    id: "fiscalite",
    label: "Fiscalit\u00e9",
    href: "/dashboard/fiscalite",
    icon: Calculator,
    keywords: ["tva", "is", "fiscal", "declaration", "dgi"],
  },
  {
    id: "credit",
    label: "Cr\u00e9dit",
    href: "/dashboard/credit",
    icon: HandCoins,
    keywords: ["pret", "credit", "financement", "echeance"],
  },
  {
    id: "activites",
    label: "Multi-activit\u00e9s",
    href: "/dashboard/activites",
    icon: Wrench,
    keywords: ["projet", "activite", "branche", "consolide"],
  },
  {
    id: "outils",
    label: "Outils",
    href: "/dashboard/outils",
    icon: Wrench,
    keywords: ["roadmap", "module", "outil", "selection"],
  },
  {
    id: "rapports",
    label: "Rapports",
    href: "/dashboard/rapports",
    icon: BarChart3,
    keywords: ["report", "analytics", "statistiques", "analyse", "graphiques"],
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    keywords: ["alerte", "rappel", "notification", "inbox", "message"],
  },
  {
    id: "parametres",
    label: "Param\u00e8tres",
    href: "/dashboard/parametres",
    icon: Settings,
    keywords: ["settings", "configuration", "preferences", "profil", "compte"],
  },
];

const actionItems: PaletteItem[] = [
  {
    id: "nouvelle-facture",
    label: "Cr\u00e9er une facture",
    href: "/dashboard/factures/nouvelle",
    icon: Plus,
    keywords: ["nouveau", "ajouter", "creer", "facture", "invoice"],
  },
  {
    id: "nouveau-devis",
    label: "Cr\u00e9er un devis",
    href: "/dashboard/devis/nouveau",
    icon: Plus,
    keywords: ["nouveau", "ajouter", "creer", "devis", "quote"],
  },
  {
    id: "ajouter-client",
    label: "Ajouter un client",
    href: "/dashboard/clients",
    icon: UserPlus,
    keywords: ["nouveau", "ajouter", "client", "contact"],
  },
  {
    id: "nouvelle-depense",
    label: "Enregistrer une d\u00e9pense",
    href: "/dashboard/depenses",
    icon: Plus,
    keywords: ["nouveau", "ajouter", "depense", "charge", "expense"],
  },
];

function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Search className="mb-3 h-8 w-8 opacity-30" />
      <p className="text-sm font-medium">Aucun r\u00e9sultat trouv\u00e9</p>
      <p className="mt-1 text-xs opacity-70">Essayez un autre terme de recherche</p>
    </div>
  );
}

function FooterHint() {
  return (
    <div className="flex items-center gap-3 border-t border-border px-4 py-3">
      <kbd
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5",
          "font-mono text-[10px] font-medium text-muted-foreground"
        )}
      >
        <span className="text-xs">Up/Down</span>
        <span className="mx-0.5 text-[9px]">|</span>
        <span className="text-xs">Enter</span>
      </kbd>
      <span className="text-xs text-muted-foreground">pour naviguer</span>
      <kbd
        className={cn(
          "ml-auto inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5",
          "font-mono text-[10px] font-medium text-muted-foreground"
        )}
      >
        Esc
      </kbd>
      <span className="text-xs text-muted-foreground">fermer</span>
    </div>
  );
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Recherche rapide"
      description="Rechercher des pages et des actions dans Klara"
      className="top-[15%] translate-y-0 rounded-xl border border-border/50 shadow-2xl sm:max-w-[560px]"
      showCloseButton={false}
    >
      <div className="flex items-center border-b border-border px-4">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <CommandInput
          placeholder="Rechercher factures, clients, caisse..."
          className="h-12 border-0 px-3 text-sm placeholder:text-muted-foreground/60 focus:ring-0"
        />
        <kbd
          className={cn(
            "hidden shrink-0 items-center rounded-md border border-border bg-muted px-1.5 py-0.5 sm:inline-flex",
            "font-mono text-[10px] font-medium text-muted-foreground"
          )}
        >
          ESC
        </kbd>
      </div>

      <CommandList className="max-h-[min(380px,50vh)]">
        <CommandEmpty>
          <NoResults />
        </CommandEmpty>

        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.keywords.join(" ")}`}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="cursor-pointer items-center gap-3 px-4 py-2.5"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    "bg-[#00D4AA]/10 text-[#00D4AA]",
                    "transition-colors data-[selected=true]:bg-[#00D4AA]/20 data-[selected=true]:text-[#00D4AA]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{item.href}</span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions rapides">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.keywords.join(" ")}`}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="cursor-pointer items-center gap-3 px-4 py-2.5"
              >
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    "bg-[#1A1A2E]/10 text-[#1A1A2E]",
                    "dark:bg-white/10 dark:text-white",
                    "transition-colors data-[selected=true]:bg-[#1A1A2E]/20 data-[selected=true]:text-[#1A1A2E]",
                    "dark:data-[selected=true]:bg-white/15 dark:data-[selected=true]:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>

      <FooterHint />
    </CommandDialog>
  );
}

interface CommandPaletteTriggerProps {
  onClick?: () => void;
  className?: string;
}

export function CommandPaletteTrigger({ onClick, className }: CommandPaletteTriggerProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    document.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      })
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all duration-200",
        "hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/50 focus-visible:ring-offset-2",
        className
      )}
      aria-label="Recherche rapide (Cmd+K)"
    >
      <Search className="h-4 w-4" />
    </button>
  );
}
