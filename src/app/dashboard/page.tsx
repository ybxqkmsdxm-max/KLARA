"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Wallet, Clock, AlertTriangle, TrendingDown, TrendingUp, ArrowRight,
  ChevronUp, ChevronDown, Bell, Users, FileText, X, Plus,
  FileSpreadsheet, UserPlus, Receipt, BarChart3, Download,
  ArrowUpRight, ArrowDownRight, ArrowDownLeft, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { formatCurrency, getInvoiceStatusLabel, getInvoiceStatusVariant } from "@/lib/formatters";

/* ============================================================
   TYPES
   ============================================================ */
interface DashboardStats {
  tresorerie: { soldeEstime: number; encaissementsMois: number; depensesMois: number; variation: number };
  factures: { total: number; enAttente: number; enRetard: number; montantEnRetard: number; montantEnAttente: number; tauxRecouvrement: number };
  topClients: Array<{ clientId: string; name: string; totalFacture: number; totalPaye: number; nombreFactures: number }>;
  fluxMensuels: Array<{ mois: string; encaissements: number; depenses: number }>;
  recentInvoices: Array<{ id: string; number: string; status: string; total: number; issueDate: string; dueDate: string; clientName: string }>;
}

/* ============================================================
   ANIMATION VARIANTS
   ============================================================ */
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ============================================================
   STAT CARD
   ============================================================ */
function StatCard({ title, value, icon: Icon, trend, trendLabel, color, loading }: {
  title: string; value: string; icon: React.ElementType; trend?: number; trendLabel?: string; color: string; loading?: boolean;
}) {
  return (
    <motion.div variants={fadeUp}>
      <Card className="ui-kpi-card group cursor-default" style={{ borderTop: `3px solid ${color}` }}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B] dark:text-[#94A3B8] mb-2">{title}</p>
              {loading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <p className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-white break-words tabular-nums leading-snug" style={{ fontFamily: "var(--font-plus-jakarta)" }}>
                    {value}
                  </p>
                  {trend !== undefined && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        trend >= 0 ? "bg-[#ECFDF5] text-[#047857] dark:bg-[#10B981]/10 dark:text-[#34D399]" : "bg-[#FFF1F2] text-[#BE123C] dark:bg-[#F43F5E]/10 dark:text-[#F43F5E]"
                      }`}>
                        {trend >= 0 ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {trend >= 0 ? "+" : ""}{trend}% {trendLabel}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${color}18, ${color}08)` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ============================================================
   CIRCULAR PROGRESS
   ============================================================ */
function CircularProgress({ value, size = 140, strokeWidth = 9 }: { value: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 70 ? "#10B981" : value >= 40 ? "#F59E0B" : "#F43F5E";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={circumference} strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold" style={{ color, fontFamily: "var(--font-plus-jakarta)" }}>{value}%</span>
        <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">recouvré</span>
      </div>
    </div>
  );
}

/* ============================================================
   CUSTOM TOOLTIP
   ============================================================ */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-xl shadow-xl border border-[#E2E8F0] dark:border-[#334155] p-4 text-[13px]">
      <p className="font-semibold text-sm mb-2 text-[#0F172A] dark:text-white">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#64748B] dark:text-[#94A3B8] capitalize">{entry.dataKey === "encaissements" ? "Encaissements" : "Dépenses"}</span>
          <span className="font-bold ml-auto text-sm text-[#0F172A] dark:text-white">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   WELCOME BANNER
   ============================================================ */
function WelcomeBanner({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="relative overflow-hidden rounded-2xl p-5 lg:p-6 text-white"
      style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" }}
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
      <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.08] pointer-events-none">
        <div className="absolute top-4 right-4 w-32 h-32 rounded-full border-4 border-white" />
      </div>
      <button onClick={onDismiss} className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
        <X className="h-3.5 w-3.5 text-white/80" />
      </button>
      <div className="relative flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl lg:text-2xl font-bold text-white" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Bonjour, Aminata</h2>
          <p className="text-sm lg:text-base text-white/80 mt-1">Voici un résumé de votre activité</p>
        </div>
        <div className="hidden sm:flex items-center justify-center shrink-0">
          <div className="relative">
            <BarChart3 className="h-14 w-14 text-white/15" />
            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#10B981] animate-pulse" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   QUICK ACTIONS
   ============================================================ */
const quickActions = [
  { label: "Nouvelle facture", description: "Créer et envoyer", href: "/dashboard/factures/nouvelle", icon: FileText, color: "bg-[#ECFDF5] text-[#10B981]", borderColor: "border-l-[#10B981]" },
  { label: "Nouveau devis", description: "Générer un devis", href: "/dashboard/devis/nouveau", icon: FileSpreadsheet, color: "bg-[#F0F9FF] text-[#0EA5E9]", borderColor: "border-l-[#0EA5E9]" },
  { label: "Ajouter client", description: "Ajouter un contact", href: "/dashboard/clients", icon: UserPlus, color: "bg-[#F5F3FF] text-[#8B5CF6]", borderColor: "border-l-[#8B5CF6]" },
  { label: "Nouvelle dépense", description: "Enregistrer une dépense", href: "/dashboard/depenses", icon: Receipt, color: "bg-[#FFFBEB] text-[#F59E0B]", borderColor: "border-l-[#F59E0B]" },
];

function QuickActionsRow() {
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <motion.div key={action.label} variants={fadeUp}>
            <Link href={action.href} className="block">
              <Card className="group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-[#E2E8F0] dark:border-[#334155] h-full border-l-[3px] hover:border-l-[4px]" style={{ borderLeftColor: action.borderColor.replace("border-l-", "").replace("[", "").replace("]", "") }}>
                <CardContent className="p-4 flex items-center gap-3 min-h-[68px]">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${action.color} transition-transform duration-200 group-hover:scale-110`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white leading-tight">{action.label}</p>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-tight">{action.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#CBD5E1] group-hover:text-[#64748B] transition-colors shrink-0" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ============================================================
   ACTIVITY DATA
   ============================================================ */
const activities = [
  { id: 1, type: "payment", message: "Paiement reçu de Togo Télécom", detail: "+2 065 000 FCFA via Mobile Money", time: "Il y a 2h", color: "#10B981", icon: ArrowDownLeft },
  { id: 2, type: "invoice", message: "Facture FAC-2024-003 envoyée", detail: "Restaurant Chez Maman — 495 600 FCFA", time: "Il y a 5h", color: "#0EA5E9", icon: FileText },
  { id: 3, type: "reminder", message: "Relance automatique envoyée", detail: "J-P. Agbéko — FAC-2024-002 (J+7)", time: "Hier", color: "#F59E0B", icon: Bell },
  { id: 4, type: "client", message: "Nouveau client ajouté", detail: "Société Togo Télécom — Entreprise", time: "Il y a 3j", color: "#8B5CF6", icon: UserPlus },
  { id: 5, type: "expense", message: "Dépense enregistrée", detail: "Fournitures — 1 200 000 FCFA", time: "Il y a 3j", color: "#F43F5E", icon: TrendingDown },
];

/* ============================================================
   MAIN DASHBOARD PAGE
   ============================================================ */
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInView = useInView(chartRef, { once: true, margin: "-50px" });

  useEffect(() => {
    const dismissed = sessionStorage.getItem("klara-welcome-dismissed");
    if (!dismissed) setShowWelcome(true);
  }, []);

  const dismissWelcome = useCallback(() => {
    setShowWelcome(false);
    sessionStorage.setItem("klara-welcome-dismissed", "true");
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!stats?.recentInvoices) return;
    const headers = ["Numéro", "Client", "Montant (FCFA)", "Statut", "Date d'émission", "Date d'échéance"];
    const rows = stats.recentInvoices.map((inv) => [inv.number, inv.clientName, inv.total.toString(), getInvoiceStatusLabel(inv.status), inv.issueDate, inv.dueDate]);
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
    fetchStats();
  }, [fetchStats]);

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-12 w-12 text-[#F59E0B] mb-4" />
        <p className="text-lg font-medium mb-2 text-[#0F172A] dark:text-white">Erreur de chargement</p>
        <p className="text-sm text-[#64748B] mb-4">{error}</p>
        <button onClick={fetchStats} className="px-4 py-2 bg-gradient-to-r from-[#10B981] to-[#059669] text-white rounded-xl text-sm font-semibold hover:shadow-glow transition-all">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <WelcomeBanner visible={showWelcome} onDismiss={dismissWelcome} />

      {/* Quick actions */}
      <QuickActionsRow />

      {/* Alert */}
      {!loading && stats && stats.factures.enRetard > 0 && (
        <Alert className="rounded-xl border-[#FECDD3] bg-[#FFF1F2]/50 dark:bg-[#F43F5E]/5 border-l-4 border-l-[#F43F5E] px-4">
          <AlertTriangle className="h-4 w-4 text-[#F43F5E] self-center shrink-0" />
          <AlertDescription className="text-sm flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-x-2">
            <span className="break-words">
              <span className="font-semibold text-[#BE123C]">{stats.factures.enRetard} facture{stats.factures.enRetard > 1 ? "s" : ""} en retard</span>
              {" — "}
              <span className="text-[#64748B]">{formatCurrency(stats.factures.montantEnRetard)} à recouvrer</span>
            </span>
            <Link href="/dashboard/factures" className="text-[#F43F5E] hover:text-[#BE123C] hover:underline font-medium sm:ml-auto shrink-0 text-sm">
              Voir les factures →
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Stat cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <StatCard title="Trésorerie estimée" value={loading ? "" : formatCurrency(stats!.tresorerie.soldeEstime)} icon={Wallet} trend={loading ? undefined : stats!.tresorerie.variation} trendLabel="vs mois dernier" color="#10B981" loading={loading} />
        <StatCard title="Factures en attente" value={loading ? "" : `${stats!.factures.enAttente}`} icon={Clock} color="#0EA5E9" loading={loading} />
        <StatCard title="Factures en retard" value={loading ? "" : `${stats!.factures.enRetard}`} icon={AlertTriangle} color="#F43F5E" loading={loading} />
        <StatCard title="Dépenses du mois" value={loading ? "" : formatCurrency(stats!.tresorerie.depensesMois)} icon={TrendingDown} color="#F59E0B" loading={loading} />
      </motion.div>

      {/* Chart + Taux recouvrement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6" ref={chartRef}>
        {/* Flux trésorerie chart */}
        <Card className="lg:col-span-2 rounded-2xl border-[#E2E8F0] dark:border-[#334155] shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#0F172A] dark:text-white">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />Flux de trésorerie
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] rounded-full">Mois en cours</Badge>
          </CardHeader>
          <CardContent className="relative p-4 sm:p-6">
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats!.fluxMensuels}>
                  <defs>
                    <linearGradient id="gradientEncaissements" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradientDepenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.5} />
                  <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "#94A3B8" }} stroke="#E2E8F0" />
                  <YAxis tick={{ fontSize: 12, fill: "#94A3B8" }} stroke="#E2E8F0" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v.toString()} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend formatter={(value) => value === "encaissements" ? "Encaissements" : "Dépenses"} wrapperStyle={{ fontSize: 12, color: "#64748B" }} />
                  <ReferenceLine y={0} stroke="#E2E8F0" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="encaissements" stroke="#10B981" fill="url(#gradientEncaissements)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="depenses" stroke="#F43F5E" fill="url(#gradientDepenses)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Taux recouvrement */}
        <Card className="rounded-2xl border-[#E2E8F0] dark:border-[#334155] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#0F172A] dark:text-white">
              <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />Taux de recouvrement
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-6">
            {loading ? (
              <Skeleton className="h-[140px] w-[140px] rounded-full" />
            ) : (
              <>
                <CircularProgress value={stats!.factures.tauxRecouvrement} size={140} strokeWidth={9} />
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-3 text-center">Objectif : 80%</p>
                <div className="mt-5 space-y-3 w-full">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">Encaissements</span>
                    <div className="flex items-center gap-1.5 text-[#047857] dark:text-[#34D399] font-medium">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {formatCurrency(stats!.tresorerie.encaissementsMois)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">En retard</span>
                    <div className="flex items-center gap-1.5 text-[#BE123C] dark:text-[#F43F5E] font-medium">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {formatCurrency(stats!.factures.montantEnRetard)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">En attente</span>
                    <span className="font-medium text-[#0F172A] dark:text-white">{formatCurrency(stats!.factures.montantEnAttente)}</span>
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
        <Card className="rounded-2xl border-[#E2E8F0] dark:border-[#334155] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#0F172A] dark:text-white">
              <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />Factures récentes
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleExportCSV} className="h-8 text-xs text-[#64748B] hover:text-[#0F172A] dark:hover:text-white gap-1.5">
                <Download className="h-3.5 w-3.5" />Exporter
              </Button>
              <Link href="/dashboard/factures" className="text-xs text-[#10B981] hover:text-[#059669] font-medium flex items-center gap-1">
                Voir tout <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {loading ? (
              <div className="px-6 space-y-4 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : stats && stats.recentInvoices.length > 0 ? (
              <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
                {stats.recentInvoices.map((inv) => (
                  <Link key={inv.id} href={`/dashboard/factures/${inv.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-[#94A3B8]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{inv.clientName}</p>
                        <p className="text-xs text-[#94A3B8]">{inv.number}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{formatCurrency(inv.total)}</p>
                      <Badge className={`text-[10px] rounded-md ${
                        inv.status === "EN_RETARD" ? "bg-[#FFF1F2] text-[#BE123C] hover:bg-[#FFF1F2]" :
                        inv.status === "PAYEE" ? "bg-[#ECFDF5] text-[#047857] hover:bg-[#ECFDF5]" :
                        inv.status === "ENVOYEE" ? "bg-[#F0F9FF] text-[#0369A1] hover:bg-[#F0F9FF]" :
                        "bg-[#F1F5F9] text-[#475569] hover:bg-[#F1F5F9]"
                      }`}>
                        {getInvoiceStatusLabel(inv.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <FileText className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
                <p className="text-sm text-[#94A3B8]">Aucune facture pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top clients */}
        <Card className="rounded-2xl border-[#E2E8F0] dark:border-[#334155] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#0F172A] dark:text-white">
              <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />Top clients
            </CardTitle>
            <Link href="/dashboard/clients" className="text-xs text-[#10B981] hover:text-[#059669] font-medium flex items-center gap-1">
              Tous <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {loading ? (
              <div className="px-6 space-y-4 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : stats && stats.topClients.length > 0 ? (
              <div className="divide-y divide-[#F1F5F9] dark:divide-[#334155]">
                {stats.topClients.map((client, idx) => (
                  <Link key={client.clientId} href={`/dashboard/clients/${client.clientId}`} className="flex items-center gap-3 px-6 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors">
                    <div className="h-8 w-8 rounded-full bg-[#0F172A] dark:bg-[#10B981] flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-white">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] dark:text-white truncate">{client.name}</p>
                      <p className="text-xs text-[#94A3B8]">{client.nombreFactures} facture{client.nombreFactures > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{formatCurrency(client.totalFacture)}</p>
                      <p className="text-xs text-[#10B981]">{formatCurrency(client.totalPaye)} payé</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <Users className="h-10 w-10 text-[#CBD5E1] mx-auto mb-3" />
                <p className="text-sm text-[#94A3B8]">Aucun client pour le moment</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Prévisions de trésorerie */}
      <Card className="rounded-2xl border-[#E2E8F0] dark:border-[#334155] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#0F172A] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#0F172A] dark:bg-white" />Prévisions de trésorerie
          </CardTitle>
          <span className="text-xs text-[#94A3B8]">Mois en cours</span>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Entrées prévues", value: "3 500 000 FCFA", percent: 78, icon: ArrowUpRight, color: "emerald", border: "border-[#A7F3D0]", bg: "bg-[#ECFDF5] dark:bg-[#10B981]/5", iconBg: "bg-[#D1FAE5] dark:bg-[#10B981]/15", text: "text-[#047857] dark:text-[#34D399]", bar: "bg-[#10B981]" },
              { label: "Sorties prévues", value: "1 800 000 FCFA", percent: 85, icon: ArrowDownRight, color: "amber", border: "border-[#FDE68A]", bg: "bg-[#FFFBEB] dark:bg-[#F59E0B]/5", iconBg: "bg-[#FEF3C7] dark:bg-[#F59E0B]/15", text: "text-[#B45309] dark:text-[#FBBF24]", bar: "bg-[#F59E0B]" },
              { label: "Solde projeté", value: "1 700 000 FCFA", percent: 60, icon: TrendingUp, color: "sky", border: "border-[#BAE6FD]", bg: "bg-[#F0F9FF] dark:bg-[#0EA5E9]/5", iconBg: "bg-[#E0F2FE] dark:bg-[#0EA5E9]/15", text: "text-[#0369A1] dark:text-[#38BDF8]", bar: "bg-[#0EA5E9]" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border ${item.border} ${item.bg} p-4 hover:shadow-sm transition-shadow`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-lg ${item.iconBg} flex items-center justify-center`}>
                    <item.icon className={`h-4 w-4 ${item.text}`} />
                  </div>
                  <span className={`text-xs font-semibold ${item.text}`}>{item.label}</span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold tabular-nums text-[#0F172A] dark:text-white`} style={{ fontFamily: "var(--font-plus-jakarta)" }}>{item.value}</p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[10px] text-[#94A3B8] mb-1">
                    <span>Projeté</span><span>{item.percent}% atteint</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#E2E8F0] dark:bg-[#334155] overflow-hidden">
                    <motion.div className={`h-full rounded-full ${item.bar}`} initial={{ width: 0 }} animate={{ width: `${item.percent}%` }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="rounded-2xl border-[#E2E8F0] dark:border-[#334155] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-[#0F172A] dark:text-white">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />Activité récente
          </CardTitle>
          <Link href="/dashboard/factures" className="text-xs text-[#10B981] hover:text-[#059669] font-medium flex items-center gap-1">
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
                <div key={activity.id} className="relative flex gap-4 group/timeline">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${actColor}12` }}>
                      <ActIcon className="h-4 w-4" style={{ color: actColor }} />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-[#E2E8F0] dark:bg-[#334155]" />}
                  </div>
                  <div className={`flex-1 min-w-0 ${isLast ? "pb-0" : "pb-5"} hover:bg-[#F8FAFC]/50 dark:hover:bg-[#1E293B]/30 -mx-2 px-2 rounded-lg transition-colors cursor-pointer`}>
                    <p className="text-sm font-medium text-[#0F172A] dark:text-white">{activity.message}</p>
                    <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-0.5">{activity.detail}</p>
                    <p className="text-xs text-[#94A3B8] mt-1">{activity.time}</p>
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
