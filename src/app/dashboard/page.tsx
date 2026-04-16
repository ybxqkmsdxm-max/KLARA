"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
    <Card className="group relative overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs lg:text-sm text-muted-foreground font-medium">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-28 mt-2" />
            ) : (
              <>
                <p className="text-xl lg:text-2xl font-bold mt-1 truncate">{value}</p>
                {trend !== undefined && (
                  <div className="flex items-center gap-1 mt-1.5">
                    {trend >= 0 ? (
                      <ChevronUp className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        trend >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {trend >= 0 ? "+" : ""}
                      {trend}% {trendLabel}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
            style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
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
        <span className="text-2xl font-bold" style={{ color }}>
          {value}%
        </span>
        <span className="text-[10px] text-muted-foreground">recouvré</span>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border p-4 text-sm">
      <p className="font-medium mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground capitalize">
            {entry.dataKey === "encaissements" ? "Encaissements" : "Dépenses"}
          </span>
          <span className="font-semibold ml-auto">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

function WelcomeBanner({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  if (!visible) return null;
  return (
    <div
      className="relative overflow-hidden rounded-xl p-5 lg:p-6 text-white ring-1 ring-white/10"
      style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2D2D4F 100%)" }}
    >
      {/* Subtle dot pattern overlay for depth */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
        <div className="absolute top-12 right-12 w-20 h-20 rounded-full border-4 border-white" />
      </div>
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="h-3.5 w-3.5 text-white/80" />
        <span className="sr-only">Fermer</span>
      </button>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold">Bonjour, Aminata</h2>
          <p className="text-sm lg:text-base text-white/70 mt-1">
            Voici un résumé de votre activité
          </p>
        </div>
        <div className="hidden sm:flex items-center justify-center shrink-0">
          <div className="relative">
            <BarChart3 className="h-16 w-16 text-white/20" />
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#00D4AA] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

const quickActions = [
  {
    label: "Nouvelle facture",
    description: "Créer et envoyer",
    href: "/dashboard/factures/nouvelle",
    icon: FileText,
  },
  {
    label: "Nouveau devis",
    description: "Générer un devis",
    href: "/dashboard/devis/nouveau",
    icon: FileSpreadsheet,
  },
  {
    label: "Ajouter client",
    description: "Ajouter un contact",
    href: "/dashboard/clients",
    icon: UserPlus,
  },
  {
    label: "Nouvelle dépense",
    description: "Enregistrer une dépense",
    href: "/dashboard/depenses",
    icon: Receipt,
  },
];

// Données mock pour la timeline
const activities = [
  { id: 1, type: "payment", message: "Paiement reçu de Togo Télécom", detail: "+2 065 000 FCFA via Mobile Money", time: "Il y a 2h", color: "#00D4AA" },
  { id: 2, type: "invoice", message: "Facture FAC-2024-003 envoyée", detail: "Restaurant Chez Maman — 495 600 FCFA", time: "Il y a 5h", color: "#3B82F6" },
  { id: 3, type: "reminder", message: "Relance automatique envoyée", detail: "J-P. Agbéko — FAC-2024-002 (J+7)", time: "Hier", color: "#FFB347" },
  { id: 4, type: "client", message: "Nouveau client ajouté", detail: "Société Togo Télécom — Entreprise", time: "Il y a 3j", color: "#8B5CF6" },
  { id: 5, type: "expense", message: "Dépense enregistrée", detail: "Fournitures — 1 200 000 FCFA", time: "Il y a 3j", color: "#FF6B6B" },
];

function QuickActionsRow() {
  return (
    <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 snap-x snap-mandatory scrollbar-none">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className="flex-shrink-0 w-40 lg:w-auto snap-start"
          >
            <Card className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-border/50 hover:border-border h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-600 transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("klara-welcome-dismissed");
    if (!dismissed) {
      setShowWelcome(true);
    }
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    sessionStorage.setItem("klara-welcome-dismissed", "true");
  }, []);

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
    fetchStats();
  }, [fetchStats]);

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <WelcomeBanner visible={showWelcome} onDismiss={dismissWelcome} />

      {/* Quick actions */}
      <QuickActionsRow />

      {/* Alert factures en retard */}
      {!loading && stats && stats.factures.enRetard > 0 && (
        <Alert className="border-[#FF6B6B]/20 bg-[#FF6B6B]/5">
          <AlertTriangle className="h-4 w-4 text-[#FF6B6B]" />
          <AlertDescription className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>
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
              className="text-[#FF6B6B] hover:underline font-medium ml-auto"
            >
              Voir les factures →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Stat cards */}
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

      {/* Chart + Taux recouvrement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Flux trésorerie chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Flux de trésorerie</CardTitle>
          </CardHeader>
          <CardContent>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis
                    tick={{ fontSize: 11 }}
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
                  <Area
                    type="monotone"
                    dataKey="encaissements"
                    stroke="#00D4AA"
                    fill="url(#gradientEncaissements)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="depenses"
                    stroke="#FFB347"
                    fill="url(#gradientDepenses)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Taux recouvrement */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Taux de recouvrement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {loading ? (
              <Skeleton className="h-[120px] w-[120px] rounded-full" />
            ) : (
              <>
                <CircularProgress value={stats!.factures.tauxRecouvrement} />
                <div className="mt-6 space-y-3 w-full">
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
            <CardTitle className="text-base font-semibold">Factures récentes</CardTitle>
            <Link
              href="/dashboard/factures"
              className="text-xs text-[#00D4AA] hover:text-[#00C19C] font-medium flex items-center gap-1"
            >
              Voir tout <ArrowRight className="h-3 w-3" />
            </Link>
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
            <CardTitle className="text-base font-semibold">Top clients</CardTitle>
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

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Activité récente</CardTitle>
          <Link
            href="/dashboard/factures"
            className="text-xs text-[#00D4AA] hover:text-[#00C19C] font-medium flex items-center gap-1"
          >
            Voir tout <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {activities.map((activity, idx) => {
              const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
                payment: { icon: ArrowDownLeft, color: activity.color },
                invoice: { icon: FileText, color: activity.color },
                reminder: { icon: Bell, color: activity.color },
                client: { icon: UserPlus, color: activity.color },
                expense: { icon: TrendingDown, color: activity.color },
              };
              const { icon: ActIcon, color: actColor } = iconMap[activity.type];
              const isLast = idx === activities.length - 1;
              return (
                <div key={activity.id} className="relative flex gap-4">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${actColor}15` }}
                    >
                      <ActIcon className="h-4 w-4" style={{ color: actColor }} />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-5"}`}>
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{activity.detail}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
