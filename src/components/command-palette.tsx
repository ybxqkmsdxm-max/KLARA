"use client";

import { type ElementType, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
  Plus,
  UserPlus,
  Search,
  Bell,
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

/* ============================================================
   Data: Navigation pages & Quick actions
   ============================================================ */

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
    keywords: ["accueil", "home", "résumé", "overview", "stats"],
  },
  {
    id: "factures",
    label: "Factures",
    href: "/dashboard/factures",
    icon: FileText,
    keywords: ["invoices", "facturation", "paiement", "facturer"],
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
    keywords: ["quote", "estimation", "proposition", "proposal"],
  },
  {
    id: "depenses",
    label: "Dépenses",
    href: "/dashboard/depenses",
    icon: Wallet,
    keywords: ["expenses", "charges", "coûts", "dépense", "budget"],
  },
  {
    id: "rapports",
    label: "Rapports",
    href: "/dashboard/rapports",
    icon: BarChart3,
    keywords: ["reports", "analytics", "statistiques", "analyses", "graphiques", "chiffres"],
  },
  {
    id: "parametres",
    label: "Paramètres",
    href: "/dashboard/parametres",
    icon: Settings,
    keywords: ["settings", "configuration", "préférences", "profil", "compte"],
  },
  {
    id: "notifications",
    label: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
    keywords: ["alerte", "rappel", "notification", "bell", "inbox", "message"],
  },
];

const actionItems: PaletteItem[] = [
  {
    id: "nouvelle-facture",
    label: "Créer une facture",
    href: "/dashboard/factures/nouvelle",
    icon: Plus,
    keywords: ["nouveau", "ajouter", "créer", "facture", "new", "invoice"],
  },
  {
    id: "nouveau-devis",
    label: "Créer un devis",
    href: "/dashboard/devis/nouveau",
    icon: Plus,
    keywords: ["nouveau", "ajouter", "créer", "devis", "quote", "estimation"],
  },
  {
    id: "ajouter-client",
    label: "Ajouter un client",
    href: "/dashboard/clients",
    icon: UserPlus,
    keywords: ["nouveau", "ajouter", "client", "contact", "customer"],
  },
  {
    id: "nouvelle-depense",
    label: "Enregistrer une dépense",
    href: "/dashboard/depenses",
    icon: Plus,
    keywords: ["nouveau", "ajouter", "dépense", "charge", "expense"],
  },
];

/* ============================================================
   No results component
   ============================================================ */

function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Search className="h-8 w-8 mb-3 opacity-30" />
      <p className="text-sm font-medium">Aucun résultat trouvé</p>
      <p className="text-xs mt-1 opacity-70">
        Essayez un autre terme de recherche
      </p>
    </div>
  );
}

/* ============================================================
   Footer hint
   ============================================================ */

function FooterHint() {
  return (
    <div className="border-t border-border px-4 py-3 flex items-center gap-3">
      <kbd
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md border border-border bg-muted px-1.5 py-0.5",
          "text-[10px] font-medium text-muted-foreground font-mono"
        )}
      >
        <span className="text-xs">↑↓</span>
        <span className="mx-0.5 text-[9px]">•</span>
        <span className="text-xs">↵</span>
      </kbd>
      <span className="text-xs text-muted-foreground">
        pour naviguer
      </span>
      <kbd
        className={cn(
          "inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5 ml-auto",
          "text-[10px] font-medium text-muted-foreground font-mono"
        )}
      >
        esc
      </kbd>
      <span className="text-xs text-muted-foreground">
        fermer
      </span>
    </div>
  );
}

/* ============================================================
   Command Palette — main component
   ============================================================ */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Keyboard shortcut: Cmd+K / Ctrl+K
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

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Recherche rapide"
      description="Rechercher des pages et actions dans Klara"
      className="top-[15%] translate-y-0 sm:max-w-[560px] rounded-xl border border-border/50 shadow-2xl"
      showCloseButton={false}
    >
      {/* Search input */}
      <div className="flex items-center border-b border-border px-4">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <CommandInput
          placeholder="Rechercher des factures, clients, devis..."
          className="border-0 px-3 focus:ring-0 h-12 text-sm placeholder:text-muted-foreground/60"
        />
        {/* Keyboard shortcut badge inside input */}
        <kbd
          className={cn(
            "hidden sm:inline-flex items-center rounded-md border border-border bg-muted px-1.5 py-0.5",
            "text-[10px] font-medium text-muted-foreground font-mono shrink-0"
          )}
        >
          ESC
        </kbd>
      </div>

      {/* Results list */}
      <CommandList className="max-h-[min(380px,50vh)]">
        <CommandEmpty>
          <NoResults />
        </CommandEmpty>

        {/* Navigation group */}
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.keywords.join(" ")}`}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                    "bg-[#00D4AA]/10 text-[#00D4AA]",
                    "dark:bg-[#00D4AA]/15 dark:text-[#00D4AA]",
                    "data-[selected=true]:bg-[#00D4AA]/20 data-[selected=true]:text-[#00D4AA]",
                    "transition-colors"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {item.href}
                  </span>
                </div>
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Actions group */}
        <CommandGroup heading="Actions rapides">
          {actionItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.id}
                value={`${item.label} ${item.keywords.join(" ")}`}
                onSelect={() => runCommand(() => router.push(item.href))}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer"
              >
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
                    "bg-[#1A1A2E]/10 text-[#1A1A2E]",
                    "dark:bg-white/10 dark:text-white",
                    "data-[selected=true]:bg-[#1A1A2E]/20 data-[selected=true]:text-[#1A1A2E]",
                    "dark:data-[selected=true]:bg-white/15 dark:data-[selected=true]:text-white",
                    "transition-colors"
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

      {/* Footer hint */}
      <FooterHint />
    </CommandDialog>
  );
}

/* ============================================================
   Command Palette Trigger Button
   ============================================================ */

interface CommandPaletteTriggerProps {
  onClick?: () => void;
  className?: string;
}

export function CommandPaletteTrigger({
  onClick,
  className,
}: CommandPaletteTriggerProps) {
  // We need to programmatically open the palette via the parent,
  // so the trigger dispatches a keyboard event
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Fallback: dispatch Cmd+K event
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "k",
          metaKey: true,
          bubbles: true,
        })
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-200",
        "text-muted-foreground hover:text-foreground hover:bg-muted",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4AA]/50 focus-visible:ring-offset-2",
        "h-9 w-9",
        className
      )}
      aria-label="Recherche rapide (⌘K)"
    >
      <Search className="h-4 w-4" />
    </button>
  );
}

