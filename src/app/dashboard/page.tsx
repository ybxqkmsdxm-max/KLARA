"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Clock,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  ArrowDownLeft,
  Bell,
  Users,
  FileText,
  X,
  Plus,
  FileSpreadsheet,
  UserPlus,
  Receipt,
  BarChart3,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { formatCurrency, getInvoiceStatusLabel, getInvoiceStatusVariant } from "@/lib/formatters";

interface DashboardStats {
  tresorerie: {
    soldeEstime: number;
    encaissementsMois: number;
    depensesMois: number;
    variation: number;
  };
  factures: {
    total: number;
    enAttente: number;
    enRetard: number;
    montantEnRetard: number;
    montantEnAttente: number;
    tauxRecouvrement: number;
  };
  topClients: Array<{
    clientId: string;
    name: string;
    totalFacture: number;
    totalPaye: number;
    nombreFactures: number;
  }>;
  fluxMensuels: Array<{
    mois: string;
    encaissements: number;
    depenses: number;
  }>;
  recentInvoices: Array<{
    id: string;
    number: string;
    status: string;
    total: number;
    issueDate: string;
    dueDate: string;
    clientName: string;
  }>;
}

interface TourStep {
  selector: string;
  title: string;
  description: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color,
  loading,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  trend?: number;
  trendLabel?: string;
  color: string;
  loading?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 rounded-2xl border-0 bg-linear-to-br from-background to-muted/20"
      style={{ borderLeft: '4px solid ' + color }}
    >
      {/* Enhanced decorative gradient blob */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 pointer-events-none blur-3xl group-hover:opacity-30 transition-opacity"
        style={{ background: `radial-gradient(circle, ${color}30, transparent 70%)` }}
      />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wide">{title}</p>
            {loading ? (
              <Skeleton className="h-9 w-32 mt-3" />
            ) : (
              <>
                <p className="text-2xl lg:text-3xl font-bold mt-2 break-words font-mono tabular-nums leading-tight text-black dark:text-white">{value}</p>
                {trend !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mt-3"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full shadow-sm ${
                        trend >= 0
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {trend >= 0 ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      {trend >= 0 ? "+" : ""}
                      {trend}% {trendLabel}
                    </span>
                  </motion.div>
                )}
              </>
            )}
          </div>
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:shadow-lg transition-shadow"
            style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)` }}
          >
            <Icon className="h-6 w-6" style={{ color }} />
          </motion.div>
        </div>
      </CardContent>
    </motion.div>
  );
}

function CircularProgress({ value, size = 120, strokeWidth = 8 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? "#00D4AA" : value >= 40 ? "#FFB347" : "#FF6B6B";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={size >= 140 ? "text-3xl" : "text-2xl"} style={{ color }}>
          {value}%
        </span>
        <span className="text-[10px] text-muted-foreground mt-0.5">recouvré</span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-border/60 p-4 text-[13px]">
      <p className="font-semibold text-sm mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">
            {entry.dataKey === "encaissements" ? "Encaissements" : "Dépenses"}
          </span>
          <span className="font-bold ml-auto text-sm">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function WelcomeBanner({
  visible,
  onDismiss,
  displayName,
}: {
  visible: boolean;
  onDismiss: () => void;
  displayName: string;
}) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-white ring-1 ring-white/10 shadow-2xl"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      <div className="absolute top-0 right-0 w-72 h-72 opacity-20 pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-6 right-6 w-40 h-40 rounded-full border-2 border-white/30"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-12 right-12 w-24 h-24 rounded-full border-2 border-white/40"
        />
      </div>
      <button
        type="button"
        aria-label="Fermer la banniere de bienvenue"
        onClick={onDismiss}
        className="absolute top-2 right-2 sm:top-3 sm:right-3 z-30 h-12 w-12 sm:h-11 sm:w-11 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-95 ring-1 ring-white/30 transition-all hover:scale-105 touch-manipulation"
      >
        <X className="h-5 w-5 text-white/90" />
        <span className="sr-only">Fermer</span>
      </button>
      <div className="relative flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">Bonjour, {displayName}</h2>
          <p className="text-base lg:text-lg text-white/90">
            Voici un résumé de votre activité ce mois-ci
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center shrink-0">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <BarChart3 className="h-20 w-20 text-white/20" />
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#00D4AA] animate-pulse shadow-lg" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

const quickActions = [
  {
    label: "Nouvelle facture",
    description: "Créer et envoyer",
    href: "/dashboard/factures/nouvelle",
    icon: FileText,
    color: "border-l-[#00D4AA]",
  },
  {
    label: "Nouveau devis",
    description: "Générer un devis",
    href: "/dashboard/devis/nouveau",
    icon: FileSpreadsheet,
    color: "border-l-[#3B82F6]",
  },
  {
    label: "Ajouter client",
    description: "Ajouter un contact",
    href: "/dashboard/clients",
    icon: UserPlus,
    color: "border-l-[#8B5CF6]",
  },
  {
    label: "Nouvelle dépense",
    description: "Enregistrer une dépense",
    href: "/dashboard/depenses",
    icon: Receipt,
    color: "border-l-[#FFB347]",
  },
];

type TimelineActivity = {
  id: string;
  type: "invoice";
  message: string;
  detail: string;
  time: string;
  color: string;
};

function formatRelativeFromIso(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `Il y a ${Math.max(1, diffMins)} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return `Il y a ${Math.floor(diffDays / 7)} sem`;
}

function QuickActionsRow() {
  return (
    <div className="flex gap-4 lg:gap-6 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 snap-x snap-mandatory scrollbar-none">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Link href={action.href} className="block">
              <Card className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-0 bg-linear-to-br from-background to-muted/10 hover:from-background hover:to-muted/20 h-full border-l-4 rounded-2xl ${action.color}`}>
                <CardContent className="p-5 flex items-center gap-4 min-h-[76px]">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-600 dark:text-slate-400 shadow-sm group-hover:shadow-md transition-all"
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold leading-tight">{action.label}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-tight">{action.description}</p>
                  </div>
                  <motion.div
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
                  </motion.div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCards, setShowCards] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("klara-show-cards") === "true";
  });
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("klara-welcome-dismissed");
  });
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourTargetRect, setTourTargetRect] = useState<DOMRect | null>(null);

  const tourSteps = useMemo<TourStep[]>(
    () => [
      {
        selector: '[data-tour="notif-bell"]',
        title: "Notifications",
        description: "Retrouvez ici vos alertes importantes et mises à jour récentes.",
      },
      {
        selector: '[data-tour="new-invoice-btn"]',
        title: "Créer vite une facture",
        description: "Ce bouton vous permet de démarrer une nouvelle facture immédiatement.",
      },
      {
        selector: '[data-tour="activity-section"]',
        title: "Activité récente",
        description: "Cette zone affiche les événements réels de votre compte. Si rien n'apparaît, c'est normal sur un nouveau compte.",
      },
    ],
    []
  );

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    sessionStorage.setItem("klara-welcome-dismissed", "true");
  }, []);

  const toggleCards = useCallback(() => {
    setShowCards((prev) => {
      const next = !prev;
      sessionStorage.setItem("klara-show-cards", String(next));
      return next;
    });
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!stats?.recentInvoices) return;
    const headers = ["Numéro", "Client", "Montant (FCFA)", "Statut", "Date d'émission", "Date d'échéance"];
    const rows = stats.recentInvoices.map((inv) => [
      inv.number,
      inv.clientName,
      inv.total.toString(),
      getInvoiceStatusLabel(inv.status),
      inv.issueDate,
      inv.dueDate,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factures_klara_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError("Impossible de charger les statistiques");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const key = `klara-tour-overlay:${session.user.id}:dashboard:v1`;
    if (localStorage.getItem(key) !== "done") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTourOpen(true);
      setTourStepIndex(0);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!tourOpen) return;

    const refreshRect = () => {
      const step = tourSteps[tourStepIndex];
      if (!step) return;
      const targets = Array.from(document.querySelectorAll(step.selector)) as HTMLElement[];
      const visibleTarget = targets.find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }) ?? null;
      setTourTargetRect(visibleTarget ? visibleTarget.getBoundingClientRect() : null);
    };

    refreshRect();
    window.addEventListener("resize", refreshRect);
    window.addEventListener("scroll", refreshRect, true);
    return () => {
      window.removeEventListener("resize", refreshRect);
      window.removeEventListener("scroll", refreshRect, true);
    };
  }, [tourOpen, tourStepIndex, tourSteps]);

  const displayName =
    session?.user?.name ||
    (session?.user as { organizationName?: string } | undefined)?.organizationName ||
    "Utilisateur";

  const recentActivities = useMemo<TimelineActivity[]>(() => {
    if (!stats?.recentInvoices?.length) return [];
    return stats.recentInvoices.slice(0, 5).map((inv) => ({
      id: `invoice-${inv.id}`,
      type: "invoice",
      message: `Facture ${inv.number} créée`,
      detail: `${inv.clientName} — ${formatCurrency(inv.total)}`,
      time: formatRelativeFromIso(inv.issueDate),
      color: "#3B82F6",
    }));
  }, [stats]);

  const closeTour = () => {
    if (session?.user?.id) {
      localStorage.setItem(`klara-tour-overlay:${session.user.id}:dashboard:v1`, "done");
    }
    setTourOpen(false);
  };

  const goNextTourStep = useCallback(() => {
    if (tourStepIndex >= tourSteps.length - 1) {
      closeTour();
      return;
    }
    setTourStepIndex((prev) => prev + 1);
  }, [closeTour, tourStepIndex, tourSteps.length]);

  const currentTourStep = tourSteps[tourStepIndex] ?? null;
  const tourTooltipStyle = useMemo(() => {
    if (!tourTargetRect || typeof window === "undefined") {
      return { top: 120, left: 16 };
    }
    const panelWidth = 320;
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let left = Math.max(margin, Math.min(tourTargetRect.left, viewportWidth - panelWidth - margin));
    let top = tourTargetRect.bottom + 12;
    if (top + 220 > viewportHeight) {
      top = Math.max(margin, tourTargetRect.top - 220);
    }
    return { top, left };
  }, [tourTargetRect]);

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-[#FFB347] mb-4" />
        <p className="text-lg font-medium mb-2">Erreur de chargement</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00C19C] transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <WelcomeBanner visible={showWelcome} onDismiss={dismissWelcome} displayName={displayName} />

      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" size="sm" onClick={toggleCards} className="rounded-full">
          {showCards ? "Masquer les cartes rapides" : "Afficher les cartes rapides"}
        </Button>
      </div>

      {showCards && (
        <>
          {/* Quick actions */}
          <QuickActionsRow />
        </>
      )}

      {/* Alert factures en retard */}
      {!loading && stats && stats.factures.enRetard > 0 && (
        <Alert className="rounded-xl border-[#FF6B6B]/20 bg-[#FF6B6B]/5 border-l-4 border-l-[#FFB347] px-4">
          <AlertTriangle className="h-4 w-4 text-[#FF6B6B] self-center shrink-0" />
          <AlertDescription className="text-sm flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-2">
            <span className="break-words">
              <span className="font-semibold text-[#FF6B6B]">
                {stats.factures.enRetard} facture{stats.factures.enRetard > 1 ? "s" : ""} en retard
              </span>
              {" — "}
              <span className="text-muted-foreground">
                {formatCurrency(stats.factures.montantEnRetard)} à recouvrer
              </span>
            </span>
            <Link
              href="/dashboard/factures"
              className="text-[#FF6B6B] hover:underline font-medium sm:ml-auto shrink-0"
            >
              Voir les factures →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {showCards && (
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <StatCard
            title="Trésorerie estimée"
            value={loading ? "" : formatCurrency(stats!.tresorerie.soldeEstime)}
            icon={Wallet}
            trend={loading ? undefined : stats!.tresorerie.variation}
            trendLabel="vs mois dernier"
            color="#00D4AA"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <StatCard
            title="Factures en attente"
            value={loading ? "" : `${stats!.factures.enAttente}`}
            icon={Clock}
            color="#3B82F6"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <StatCard
            title="Factures en retard"
            value={loading ? "" : `${stats!.factures.enRetard}`}
            icon={AlertTriangle}
            color="#FF6B6B"
            loading={loading}
          />
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <StatCard
            title="Dépenses du mois"
            value={loading ? "" : formatCurrency(stats!.tresorerie.depensesMois)}
            icon={TrendingDown}
            color="#FFB347"
            loading={loading}
          />
        </motion.div>
      </motion.div>
      )}

      {/* Chart + Taux recouvrement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Flux trésorerie chart */}
        <Card className="lg:col-span-2 rounded-xl border border-border/50 relative overflow-hidden shadow-[inset_0_-30px_40px_-15px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_-30px_40px_-15px_rgba(0,0,0,0.2)]" style={{ background: 'linear-gradient(180deg, rgba(26,26,46,0.03) 0%, transparent 40%)' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#00D4AA]" />Flux de trésorerie</CardTitle>
          </CardHeader>
          <CardContent className="relative p-4 sm:p-6">
            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-t from-card to-transparent pointer-events-none z-10 rounded-b-lg" />
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats!.fluxMensuels}>
                  <defs>
                    <linearGradient id="gradientEncaissements" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientDepenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB347" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#FFB347" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#94A3B8"
                    tickFormatter={(v) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : v.toString()
                    }
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) =>
                      value === "encaissements" ? "Encaissements" : "Dépenses"
                    }
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <ReferenceLine y={0} stroke="#94A3B8" strokeDasharray="3 3" />
                  <Area
                    type="natural"
                    dataKey="encaissements"
                    stroke="#00D4AA"
                    fill="url(#gradientEncaissements)"
                    strokeWidth={2.5}
                  />
                  <Area
                    type="natural"
                    dataKey="depenses"
                    stroke="#FFB347"
                    fill="url(#gradientDepenses)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Taux recouvrement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" />Taux de recouvrement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {loading ? (
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
            ) : (
              <>
                <CircularProgress value={stats!.factures.tauxRecouvrement} size={140} strokeWidth={9} />
                <p className="text-xs text-muted-foreground mt-2 text-center">Objectif : 80%</p>
                <div className="mt-4 space-y-3 w-full">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Encaissements</span>
                    <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {formatCurrency(stats!.tresorerie.encaissementsMois)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">En retard</span>
                    <div className="flex items-center gap-1.5 text-[#FF6B6B] font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {formatCurrency(stats!.factures.montantEnRetard)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">En attente</span>
                    <span className="font-medium">
                      {formatCurrency(stats!.factures.montantEnAttente)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent invoices + Top clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Factures récentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#FFB347]" />Factures récentes</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportCSV}
                className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Exporter
              </Button>
              <Link
                href="/dashboard/factures"
                className="text-xs text-[#00D4AA] hover:text-[#00C19C] font-medium flex items-center gap-1"
              >
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {loading ? (
              <div className="px-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : stats && stats.recentInvoices.length > 0 ? (
              <div className="divide-y">
                {stats.recentInvoices.map((inv) => (
                  <Link
                    key={inv.id}
                    href={`/dashboard/factures/${inv.id}`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{inv.clientName}</p>
                        <p className="text-xs text-muted-foreground">{inv.number}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold">{formatCurrency(inv.total)}</p>
                      <Badge
                        variant={getInvoiceStatusVariant(inv.status) || "secondary"}
                        className={`text-[10px] ${
                          inv.status === "EN_RETARD"
                            ? "bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/10"
                            : inv.status === "PAYEE"
                            ? "bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-[#00D4AA]/10"
                            : inv.status === "ENVOYEE"
                            ? "bg-blue-50 text-blue-600 hover:bg-blue-50"
                            : ""
                        }`}
                      >
                        {getInvoiceStatusLabel(inv.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucune facture pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />Top clients</CardTitle>
            <Link
              href="/dashboard/clients"
              className="text-xs text-[#00D4AA] hover:text-[#00C19C] font-medium flex items-center gap-1"
            >
              Tous <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {loading ? (
              <div className="px-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : stats && stats.topClients.length > 0 ? (
              <div className="divide-y">
                {stats.topClients.map((client, idx) => (
                  <Link
                    key={client.clientId}
                    href={`/dashboard/clients/${client.clientId}`}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#1A1A2E] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {client.nombreFactures} facture{client.nombreFactures > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold">{formatCurrency(client.totalFacture)}</p>
                      <p className="text-xs text-emerald-600">
                        {formatCurrency(client.totalPaye)} payé
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aucun client pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prévisions de trésorerie */}
      <Card className="relative overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#1A1A2E]" />Prévisions de trésorerie</CardTitle>
          <span className="text-xs text-muted-foreground">Mois en cours</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Entrées prévues */}
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5 p-4 hover:shadow-sm transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Entrées prévues</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-black dark:text-white">3 500 000 FCFA</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Projeté</span>
                  <span>78% atteint</span>
                </div>
                <div className="h-2 rounded-full bg-emerald-200 dark:bg-emerald-500/20 overflow-hidden">
                  <div className="h-full w-[78%] rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-700 ease-out" />
                </div>
              </div>
            </div>
            {/* Sorties prévues */}
            <div className="rounded-xl border border-orange-200/60 bg-orange-50/50 dark:border-orange-500/20 dark:bg-orange-500/5 p-4 hover:shadow-sm transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-500/15 flex items-center justify-center">
                  <ArrowDownRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Sorties prévues</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-black dark:text-white">1 800 000 FCFA</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Projeté</span>
                  <span>85% atteint</span>
                </div>
                <div className="h-2 rounded-full bg-orange-200 dark:bg-orange-500/20 overflow-hidden">
                  <div className="h-full w-[85%] rounded-full bg-orange-500 dark:bg-orange-400 transition-all duration-700 ease-out" />
                </div>
              </div>
            </div>
            {/* Solde projeté */}
            <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5 p-4 hover:shadow-sm transition-shadow duration-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Solde projeté</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-black dark:text-white">1 700 000 FCFA</p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Actual vs Projeté</span>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">+48%</span>
                </div>
                <div className="h-2 rounded-full bg-blue-200 dark:bg-blue-500/20 overflow-hidden">
                  <div className="h-full w-[60%] rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-700 ease-out" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card data-tour="activity-section">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#00D4AA]" />Activité récente</CardTitle>
          <Link
            href="/dashboard/factures"
            className="text-xs text-[#00D4AA] hover:text-[#00C19C] font-medium flex items-center gap-1"
          >
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground text-center">
              Aucune activité récente pour le moment.
            </div>
          ) : (
            <div className="space-y-0">
              {recentActivities.map((activity, idx) => {
                const isLast = idx === recentActivities.length - 1;
                return (
                  <div key={activity.id} className="relative flex gap-4 group/timeline">
                    <div className="flex flex-col items-center">
                      <div
                        className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${activity.color}15` }}
                      >
                        <FileText className="h-4 w-4" style={{ color: activity.color }} />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-border mx-auto" />}
                    </div>
                    <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-5"} hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors`}>
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{activity.detail}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {tourOpen && currentTourStep && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/45" />
          {tourTargetRect && (
            <div
              className="absolute rounded-xl border-2 border-[#00D4AA] pointer-events-none"
              style={{
                top: tourTargetRect.top - 6,
                left: tourTargetRect.left - 6,
                width: tourTargetRect.width + 12,
                height: tourTargetRect.height + 12,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
              }}
            />
          )}
          <div
            className="absolute w-[320px] rounded-xl border bg-background p-4 shadow-2xl"
            style={tourTooltipStyle}
          >
            <p className="text-sm font-semibold">{currentTourStep.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{currentTourStep.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Etape {tourStepIndex + 1}/{tourSteps.length}
              </span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={closeTour}>
                  Ignorer
                </Button>
                <Button type="button" size="sm" onClick={goNextTourStep}>
                  {tourStepIndex === tourSteps.length - 1 ? "Terminer" : "Suivant"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

