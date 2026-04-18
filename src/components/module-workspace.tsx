"use client";

import { useMemo, useState, type ComponentType } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Tone = "default" | "success" | "warning";
type UiState = "active" | "empty" | "loading" | "error";

export type WorkspaceKpi = {
  label: string;
  value: string;
  tone?: Tone;
};

export type WorkspaceAction = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  primary?: boolean;
};

type ModuleWorkspaceProps = {
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  phaseLabel: string;
  kpis: WorkspaceKpi[];
  actions: WorkspaceAction[];
  highlights: string[];
};

function toneClass(tone: Tone | undefined) {
  if (tone === "success") return "text-[#00D4AA]";
  if (tone === "warning") return "text-[#FFB347]";
  return "text-foreground";
}

export function ModuleWorkspace({
  title,
  subtitle,
  icon: HeaderIcon,
  phaseLabel,
  kpis,
  actions,
  highlights,
}: ModuleWorkspaceProps) {
  const [uiState, setUiState] = useState<UiState>("active");

  const stateLabel = useMemo(() => {
    if (uiState === "active") return "Actif";
    if (uiState === "empty") return "Vide";
    if (uiState === "loading") return "Chargement";
    return "Erreur";
  }, [uiState]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[#1A1A2E] to-[#1A1A2E]/90 px-6 py-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <HeaderIcon className="h-5 w-5 text-[#00D4AA]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>
            </div>
          </div>
          <Badge className="bg-[#00D4AA]/20 text-[#00D4AA] hover:bg-[#00D4AA]/20">
            {phaseLabel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={`text-2xl font-bold ${toneClass(kpi.tone)}`}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "outline"}
                className={action.primary ? "bg-[#00D4AA] text-white hover:bg-[#00C19C]" : ""}
              >
                <ActionIcon className="mr-2 h-4 w-4" />
                {action.label}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Etat des donn\u00e9es</CardTitle>
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
              <Button size="sm" variant={uiState === "active" ? "default" : "ghost"} onClick={() => setUiState("active")}>
                Actif
              </Button>
              <Button size="sm" variant={uiState === "empty" ? "default" : "ghost"} onClick={() => setUiState("empty")}>
                Vide
              </Button>
              <Button size="sm" variant={uiState === "loading" ? "default" : "ghost"} onClick={() => setUiState("loading")}>
                Chargement
              </Button>
              <Button size="sm" variant={uiState === "error" ? "default" : "ghost"} onClick={() => setUiState("error")}>
                Erreur
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Mode actuel: {stateLabel}</p>
        </CardHeader>
        <CardContent>
          {uiState === "loading" && (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {uiState === "empty" && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Inbox className="h-6 w-6 text-muted-foreground/70" />
              </div>
              <p className="text-sm font-medium">Aucune donn\u00e9e disponible</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Commencez avec une premi\u00e8re action pour alimenter ce module.
              </p>
            </div>
          )}

          {uiState === "error" && (
            <div className="space-y-3 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                <AlertTriangle className="h-6 w-6 text-[#FF6B6B]" />
              </div>
              <p className="text-sm font-medium">Une erreur est survenue</p>
              <p className="text-xs text-muted-foreground">
                Impossible de charger les donn\u00e9es. R\u00e9essayez.
              </p>
              <Button variant="outline" onClick={() => setUiState("loading")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                R\u00e9essayer
              </Button>
            </div>
          )}

          {uiState === "active" && (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <div className="border-b border-border/60 bg-muted/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Points de contr\u00f4le
                </p>
              </div>
              <div className="divide-y divide-border/60">
                {highlights.map((item) => (
                  <div key={item} className="px-4 py-3 text-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
