"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  BarChart3,
  Download,
  TrendingUp,
  CircleDollarSign,
  Percent,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  RefreshCw,
  ArrowDownUp,
} from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  getExpenseCategoryLabel,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface KPIs {
  chiffreAffaires: number;
  montantEncaisse: number;
  tauxRecouvrement: number;
  montantEnRetard: number;
  valeurMoyenneFacture: number;
  delaiMoyenPaiement: number;
  tauxFidelisation: number;
}

interface RevenueMensuelle {
  mois: string;
  factures: number;
  encaissements: number;
}

interface ClientPerformance {
  clientId: string;
  name: string;
  totalFacture: number;
  totalPaye: number;
  impaye: number;
  nbFactures: number;
  tauxRecouvrement: number;
}

interface DepenseCategorie {
  categorie: string;
  montant: number;
  pourcentage: number;
}

interface StatusDistribution {
  status: string;
  label: string;
  count: number;
  montant: number;
}

interface RapportsData {
  kpis: KPIs;
  revenueMensuelle: RevenueMensuelle[];
  clientsPerformance: ClientPerformance[];
  depensesParCategorie: DepenseCategorie[];
  totalDepenses: number;
  statusDistribution: StatusDistribution[];
}

// ── Constants ────────────────────────────────────────────────────────────────

const KLARA_COLORS = {
  primary: "#1A1A2E",
  accent: "#00D4AA",
  warning: "#FFB347",
  danger: "#FF6B6B",
  blue: "#4A90D9",
  purple: "#8B5CF6",
  muted: "#94A3B8",
} as const;

const EXPENSE_COLORS: Record<string, string> = {
  LOYER: "#1A1A2E",
  SALAIRES: "#00D4AA",
  FOURNITURES: "#4A90D9",
  TRANSPORT: "#FFB347",
  COMMUNICATION: "#8B5CF6",
  MARKETING: "#EC4899",
  IMPOTS: "#FF6B6B",
  MAINTENANCE: "#06B6D4",
  AUTRE: "#94A3B8",
};

const STATUS_COLORS: Record<string, string> = {
  BROUILLON: "#94A3B8",
  ENVOYEE: "#4A90D9",
  PAYEE: "#00D4AA",
  EN_RETARD: "#FF6B6B",
  ANNULEE: "#64748B",
};

const STATUS_BG_COLORS: Record<string, string> = {
  BROUILLON: "bg-slate-100 dark:bg-slate-800",
  ENVOYEE: "bg-blue-50 dark:bg-blue-950",
  PAYEE: "bg-emerald-50 dark:bg-emerald-950",
  EN_RETARD: "bg-red-50 dark:bg-red-950",
  ANNULEE: "bg-gray-100 dark:bg-gray-800",
};

// ── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, ease: "easeOut" },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ── Custom Chart Tooltips ───────────────────────────────────────────────────

function BarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name === "factures" ? "Factures" : "Encaissements"}:</span>
          <span className="font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; pourcentage: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold">{data.name}</p>
      <p className="text-muted-foreground">{formatCurrency(data.value)}</p>
      <p className="text-xs text-muted-foreground">{data.pourcentage}%</p>
    </div>
  );
}

// ── Custom Legend for Pie ────────────────────────────────────────────────────

function CustomPieLegend({
  payload,
}: {
  payload?: Array<{ value: string; color: string }>;
}) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function RapportsPage() {
  const [data, setData] = useState<RapportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("tout");

  const fetchData = useCallback(async (range: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/rapports?range=${range}`);
      if (!res.ok) throw new Error("Erreur de chargement des rapports");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Impossible de charger les données financières");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateRange);
  }, [dateRange, fetchData]);

  // ── Expense chart data ──
  const expenseChartData = useMemo(() => {
    if (!data) return [];
    return data.depensesParCategorie.map((d) => ({
      name: getExpenseCategoryLabel(d.categorie),
      value: d.montant,
      pourcentage: d.pourcentage,
      categorie: d.categorie,
    }));
  }, [data]);

  // ── Revenue chart data ──
  const revenueChartData = useMemo(() => {
    if (!data) return [];
    return data.revenueMensuelle;
  }, [data]);

  // ── Top 5 clients ──
  const topClients = useMemo(() => {
    if (!data) return [];
    return data.clientsPerformance.slice(0, 5);
  }, [data]);

  // ── Status distribution data ──
  const statusData = useMemo(() => {
    if (!data) return [];
    return data.statusDistribution;
  }, [data]);

  // ── Max status amount for bar width calculation ──
  const maxStatusMontant = useMemo(() => {
    if (!statusData.length) return 1;
    return Math.max(...statusData.map((s) => s.montant));
  }, [statusData]);

  // ── CSV Export ──
  const handleExportCSV = useCallback(() => {
    if (!data) return;
    try {
      const rows: string[] = [];

      // KPIs section
      rows.push("Rapport financier KLARA");
      rows.push(`Période: ${dateRange === "tout" ? "Tout" : dateRange === "mois" ? "Ce mois" : dateRange === "trimestre" ? "Ce trimestre" : "Cette année"}`);
      rows.push("");
      rows.push("Indicateurs clés");
      rows.push(`Chiffre d'affaires total;${data.kpis.chiffreAffaires}`);
      rows.push(`Montant encaissé;${data.kpis.montantEncaisse}`);
      rows.push(`Taux de recouvrement;${data.kpis.tauxRecouvrement}%`);
      rows.push(`Montant en retard;${data.kpis.montantEnRetard}`);
      rows.push(`Valeur moyenne facture;${data.kpis.valeurMoyenneFacture}`);
      rows.push(`Délai moyen paiement (jours);${data.kpis.delaiMoyenPaiement}`);
      rows.push(`Taux de fidélisation;${data.kpis.tauxFidelisation}%`);
      rows.push("");

      // Revenue mensuelle
      rows.push("Revenu mensuel");
      rows.push("Mois;Factures;Encaissements");
      data.revenueMensuelle.forEach((r) => {
        rows.push(`${r.mois};${r.factures};${r.encaissements}`);
      });
      rows.push("");

      // Clients
      rows.push("Performance clients");
      rows.push("Client;Total facturé;Total payé;Impayé;Nb factures;Taux recouvrement");
      data.clientsPerformance.forEach((c) => {
        rows.push(`${c.name};${c.totalFacture};${c.totalPaye};${c.impaye};${c.nbFactures};${c.tauxRecouvrement}%`);
      });
      rows.push("");

      // Dépenses
      rows.push("Dépenses par catégorie");
      rows.push("Catégorie;Montant;Pourcentage");
      data.depensesParCategorie.forEach((d) => {
        rows.push(`${getExpenseCategoryLabel(d.categorie)};${d.montant};${d.pourcentage}%`);
      });
      rows.push("");

      // Status
      rows.push("Statut des factures");
      rows.push("Statut;Nombre;Montant");
      data.statusDistribution.forEach((s) => {
        rows.push(`${s.label};${s.count};${s.montant}`);
      });

      const csv = rows.join("\n");
      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `klara-rapport-${dateRange}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Rapport exporté en CSV");
    } catch {
      toast.error("Erreur lors de l'export");
    }
  }, [data, dateRange]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#1A1A2E] flex items-center justify-center shrink-0">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Rapports financiers</h2>
            <p className="text-sm text-muted-foreground">
              Analyse de votre activité financière
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">Ce mois</SelectItem>
              <SelectItem value="trimestre">Ce trimestre</SelectItem>
              <SelectItem value="annee">Cette année</SelectItem>
              <SelectItem value="tout">Tout</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={loading || !data}
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>
      </motion.div>

      {/* ── Error state ────────────────────────────────────────────────────── */}
      {error && (
        <motion.div variants={itemVariants} className="text-center py-10">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={() => fetchData(dateRange)}
            className="mt-2 text-sm text-[#00D4AA] hover:text-[#00C19C] font-medium"
          >
            Réessayer
          </button>
        </motion.div>
      )}

      {!error && (
        <>
          {/* ── KPI Cards ────────────────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : data ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#1A1A2E]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <TrendingUp className="h-5 w-5 text-[#1A1A2E]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">
                          Chiffre d&apos;affaires
                        </p>
                        <p className="text-base sm:text-lg font-bold truncate">
                          {formatCurrency(data.kpis.chiffreAffaires)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <CircleDollarSign className="h-5 w-5 text-[#00D4AA]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">
                          Montant encaissé
                        </p>
                        <p className="text-base sm:text-lg font-bold truncate">
                          {formatCurrency(data.kpis.montantEncaisse)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Percent className="h-5 w-5 text-[#00D4AA]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">
                          Taux de recouvrement
                        </p>
                        <p className="text-base sm:text-lg font-bold truncate">
                          {formatPercent(data.kpis.tauxRecouvrement)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <AlertTriangle className="h-5 w-5 text-[#FF6B6B]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">
                          Montant en retard
                        </p>
                        <p className="text-base sm:text-lg font-bold truncate">
                          {formatCurrency(data.kpis.montantEnRetard)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : null}

          {/* ── Charts Section (2 columns) ───────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[380px] w-full rounded-xl" />
              <Skeleton className="h-[380px] w-full rounded-xl" />
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend - BarChart */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#1A1A2E]" />
                      Évolution du chiffre d&apos;affaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={revenueChartData}
                        barGap={4}
                        margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="mois"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          tickFormatter={(v: number) => {
                            if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                            if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                            return String(v);
                          }}
                        />
                        <Tooltip content={<BarTooltip />} />
                        <Bar
                          dataKey="factures"
                          name="factures"
                          fill={KLARA_COLORS.blue}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          dataKey="encaissements"
                          name="encaissements"
                          fill={KLARA_COLORS.accent}
                          radius={[4, 4, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: KLARA_COLORS.blue }}
                        />
                        <span className="text-muted-foreground">Factures</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: KLARA_COLORS.accent }}
                        />
                        <span className="text-muted-foreground">Encaissements</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Expense Breakdown - PieChart */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <ArrowDownUp className="h-4 w-4 text-[#FFB347]" />
                      Répartition des dépenses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expenseChartData.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={expenseChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={3}
                              dataKey="value"
                              nameKey="name"
                            >
                              {expenseChartData.map((entry) => (
                                <Cell
                                  key={entry.categorie}
                                  fill={
                                    EXPENSE_COLORS[entry.categorie] ||
                                    KLARA_COLORS.muted
                                  }
                                  stroke="none"
                                />
                              ))}
                            </Pie>
                            <Tooltip content={<PieTooltip />} />
                            <Legend
                              content={<CustomPieLegend />}
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Total below */}
                        <div className="text-center pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Total des dépenses
                          </p>
                          <p className="text-lg font-bold">
                            {formatCurrency(data.totalDepenses)}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[300px] text-center">
                        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                          <ArrowDownUp className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Aucune dépense enregistrée
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : null}

          {/* ── Bottom Section (2 columns) ───────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-[380px] w-full rounded-xl" />
              <Skeleton className="h-[380px] w-full rounded-xl" />
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Performance Table */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#1A1A2E]" />
                      Performance clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topClients.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs font-semibold">
                                Client
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-right">
                                Facturé
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-right hidden sm:table-cell">
                                Payé
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-center hidden md:table-cell">
                                Fact.
                              </TableHead>
                              <TableHead className="text-xs font-semibold text-right">
                                Taux
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {topClients.map((client, idx) => (
                              <TableRow key={client.clientId}>
                                <TableCell className="py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="h-6 w-6 rounded-full bg-[#1A1A2E] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                                      {client.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right py-2.5 text-sm font-medium">
                                  {formatCurrency(client.totalFacture)}
                                </TableCell>
                                <TableCell className="text-right py-2.5 text-sm text-muted-foreground hidden sm:table-cell">
                                  {formatCurrency(client.totalPaye)}
                                </TableCell>
                                <TableCell className="text-center py-2.5 text-sm text-muted-foreground hidden md:table-cell">
                                  {client.nbFactures}
                                </TableCell>
                                <TableCell className="text-right py-2.5">
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-xs font-semibold",
                                      client.tauxRecouvrement >= 80
                                        ? "bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-[#00D4AA]/10"
                                        : client.tauxRecouvrement >= 50
                                          ? "bg-[#FFB347]/10 text-[#FFB347] hover:bg-[#FFB347]/10"
                                          : "bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/10"
                                    )}
                                  >
                                    {client.tauxRecouvrement}%
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                          <Users className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Aucune donnée client disponible
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Invoice Status Distribution */}
              <motion.div variants={itemVariants}>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#4A90D9]" />
                      Statut des factures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statusData.length > 0 ? (
                      <div className="space-y-4">
                        {statusData.map((item) => {
                          const barWidth =
                            maxStatusMontant > 0
                              ? (item.montant / maxStatusMontant) * 100
                              : 0;
                          const color =
                            STATUS_COLORS[item.status] || KLARA_COLORS.muted;
                          const bgColor =
                            STATUS_BG_COLORS[item.status] || "bg-gray-100";

                          return (
                            <div key={item.status} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-sm shrink-0"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="font-medium">
                                    {item.label}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold"
                                  >
                                    {item.count}
                                  </Badge>
                                </div>
                                <span className="font-semibold text-sm">
                                  {formatCurrency(item.montant)}
                                </span>
                              </div>
                              <div
                                className={cn(
                                  "h-3 rounded-full overflow-hidden",
                                  bgColor
                                )}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-700 ease-out"
                                  style={{
                                    width: `${barWidth}%`,
                                    backgroundColor: color,
                                    minWidth: item.montant > 0 ? "4px" : "0px",
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Summary row */}
                        <div className="pt-3 mt-2 border-t space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Total factures actives
                            </span>
                            <span className="font-semibold">
                              {statusData
                                .filter((s) => s.status !== "ANNULEE")
                                .reduce((s, item) => s + item.count, 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Montant total actif
                            </span>
                            <span className="font-bold">
                              {formatCurrency(
                                statusData
                                  .filter((s) => s.status !== "ANNULEE")
                                  .reduce((s, item) => s + item.montant, 0)
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                          <FileText className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Aucune facture enregistrée
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : null}

          {/* ── Additional KPIs row ──────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#4A90D9]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <FileText className="h-5 w-5 text-[#4A90D9]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Valeur moy. facture
                        </p>
                        <p className="text-base sm:text-lg font-bold">
                          {formatCurrency(data.kpis.valeurMoyenneFacture)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FFB347]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Clock className="h-5 w-5 text-[#FFB347]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Délai moy. paiement
                        </p>
                        <p className="text-base sm:text-lg font-bold">
                          {data.kpis.delaiMoyenPaiement}{" "}
                          <span className="text-sm font-normal text-muted-foreground">
                            jours
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <RefreshCw className="h-5 w-5 text-[#00D4AA]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Fidélisation client
                        </p>
                        <p className="text-base sm:text-lg font-bold">
                          {formatPercent(data.kpis.tauxFidelisation, 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          ) : null}
        </>
      )}
    </motion.div>
  );
}
