"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Plus,
  Wallet,
  Receipt,
  TrendingDown,
  Loader2,
  Home,
  Users,
  Package,
  Truck,
  Phone,
  Megaphone,
  Landmark,
  Wrench,
  CircleDollarSign,
  Search,
  Trash2,
  Filter,
  SearchX,
  Download,
} from "lucide-react";
import {
  formatCurrency,
  formatDateShort,
  getExpenseCategoryLabel,
  getPaymentMethodLabel,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
}

interface ExpenseStats {
  totalMois: number;
  totalGlobal: number;
  totalParCategorie: Record<string, number>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const categoryIcons: Record<string, React.ElementType> = {
  LOYER: Home,
  SALAIRES: Users,
  FOURNITURES: Package,
  TRANSPORT: Truck,
  COMMUNICATION: Phone,
  MARKETING: Megaphone,
  IMPOTS: Landmark,
  MAINTENANCE: Wrench,
  AUTRE: CircleDollarSign,
};

const categoryColors: Record<string, string> = {
  LOYER: "#1A1A2E",
  SALAIRES: "#00D4AA",
  FOURNITURES: "#3B82F6",
  TRANSPORT: "#FFB347",
  COMMUNICATION: "#8B5CF6",
  MARKETING: "#EC4899",
  IMPOTS: "#FF6B6B",
  MAINTENANCE: "#06B6D4",
  AUTRE: "#94A3B8",
};

const categories = [
  "LOYER",
  "SALAIRES",
  "FOURNITURES",
  "TRANSPORT",
  "COMMUNICATION",
  "MARKETING",
  "IMPOTS",
  "MAINTENANCE",
  "AUTRE",
];

const paymentMethods = ["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE"];

const filterChips = [
  { value: "", label: "Tous" },
  { value: "LOYER", label: "Loyer" },
  { value: "SALAIRES", label: "Salaires" },
  { value: "FOURNITURES", label: "Fournitures" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "MARKETING", label: "Marketing" },
  { value: "IMPOTS", label: "Impôts" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "AUTRE", label: "Autre" },
];

// ── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }> }) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const totalAll = 0;
  const pct = totalAll > 0 ? ((data.payload.value / totalAll) * 100).toFixed(1) : "0";
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border p-3 text-sm">
      <p className="font-medium">{data.payload.name}</p>
      <p className="text-muted-foreground">{formatCurrency(data.payload.value)}</p>
      <p className="text-xs text-muted-foreground">{pct}%</p>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [activeChip, setActiveChip] = useState("");

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  // New expense form
  const [newCategory, setNewCategory] = useState("AUTRE");
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newPaymentMethod, setNewPaymentMethod] = useState("ESPECES");

  const fetchDepenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/depenses");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setDepenses(data.depenses);
      setStats(data.stats);
    } catch {
      setError("Impossible de charger les dépenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepenses();
  }, [fetchDepenses]);

  // ── Filtered expenses ──

  const filteredDepenses = useMemo(() => {
    let result = depenses;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.description.toLowerCase().includes(q) ||
          getExpenseCategoryLabel(d.category).toLowerCase().includes(q)
      );
    }

    if (activeChip) {
      result = result.filter((d) => d.category === activeChip);
    }

    if (categoryFilter) {
      result = result.filter((d) => d.category === categoryFilter);
    }

    if (paymentMethodFilter) {
      result = result.filter((d) => d.paymentMethod === paymentMethodFilter);
    }

    return result;
  }, [depenses, search, activeChip, categoryFilter, paymentMethodFilter]);

  // ── Create expense ──

  const handleCreate = async () => {
    if (!newDescription.trim()) {
      toast.error("La description est requise");
      return;
    }
    if (!newAmount || parseFloat(newAmount) <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/depenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: newCategory,
          description: newDescription.trim(),
          amount: Math.round(parseFloat(newAmount)),
          date: newDate,
          paymentMethod: newPaymentMethod,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      toast.success("Dépense ajoutée avec succès !");
      setDialogOpen(false);
      setNewDescription("");
      setNewAmount("");
      setNewDate(new Date().toISOString().split("T")[0]);
      setNewCategory("AUTRE");
      setNewPaymentMethod("ESPECES");
      fetchDepenses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  // ── Delete expense ──

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/depenses/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }
      toast.success("Dépense supprimée avec succès");
      setDeleteTarget(null);
      fetchDepenses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // ── Sync chip with dropdown ──

  const handleCategoryFilterChange = (value: string) => {
    setCategoryFilter(value);
    setActiveChip(value);
  };

  const handleChipClick = (value: string) => {
    setActiveChip(value);
    setCategoryFilter(value);
  };

  // ── Chart data ──

  const chartData = stats
    ? Object.entries(stats.totalParCategorie)
        .filter(([, amount]) => amount > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount]) => ({
          name: getExpenseCategoryLabel(category),
          value: amount,
          category,
        }))
    : [];

  const totalAll = stats ? chartData.reduce((s, d) => s + d.value, 0) : 0;

  const hasActiveFilters = search.trim() || activeChip || categoryFilter || paymentMethodFilter;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Dépenses</h2>
          <p className="text-sm text-muted-foreground">
            Suivez et gérez vos dépenses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={loading || depenses.length === 0}
            onClick={async () => {
              try {
                const res = await fetch("/api/export?type=depenses&format=csv");
                if (!res.ok) throw new Error();
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "klara-depenses.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Export des dépenses téléchargé");
              } catch {
                toast.error("Erreur lors de l'export");
              }
            }}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium">
                <Plus className="h-4 w-4 mr-1.5" />
                Nouvelle dépense
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Nouvelle dépense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getExpenseCategoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  placeholder="Ex: Achat fournitures bureau..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Montant (FCFA) *</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mode de paiement</Label>
                <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {getPaymentMethodLabel(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
                Annuler
              </Button>
              <Button
                className="bg-[#00D4AA] hover:bg-[#00C19C] text-white"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchDepenses}
            className="mt-2 text-sm text-[#00D4AA] hover:text-[#00C19C] font-medium"
          >
            Réessayer
          </button>
        </div>
      )}

      {!error && (
        <Tabs defaultValue="liste">
          <TabsList className="bg-muted">
            <TabsTrigger value="liste">Liste</TabsTrigger>
            <TabsTrigger value="categorie">Par catégorie</TabsTrigger>
          </TabsList>

          <TabsContent value="liste" className="space-y-4 mt-4">
            {/* Summary cards */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <TrendingDown className="h-5 w-5 text-[#FF6B6B]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total du mois</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(stats?.totalMois || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                        <p className="text-lg font-bold">{depenses.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FFB347]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <Wallet className="h-5 w-5 text-[#FFB347]" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total global</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(stats?.totalGlobal || 0)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Search & Filter Bar */}
            {!loading && depenses.length > 0 && (
              <Card className="border-dashed">
                <CardContent className="p-4 space-y-4">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par description..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>

                  {/* Filter dropdowns */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">
                        <Filter className="h-3 w-3 inline mr-1" />
                        Catégorie
                      </Label>
                      <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Toutes">Toutes les catégories</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {getExpenseCategoryLabel(cat)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">
                        <Filter className="h-3 w-3 inline mr-1" />
                        Mode de paiement
                      </Label>
                      <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Tous les modes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tous">Tous les modes</SelectItem>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method} value={method}>
                              {getPaymentMethodLabel(method)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {hasActiveFilters && (
                      <div className="flex items-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setSearch("");
                            setCategoryFilter("");
                            setPaymentMethodFilter("");
                            setActiveChip("");
                          }}
                        >
                          Effacer
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Category filter chips */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {filterChips.map((chip) => (
                      <button
                        key={chip.value}
                        onClick={() => handleChipClick(chip.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                          activeChip === chip.value
                            ? "bg-[#1A1A2E] text-white dark:bg-white dark:text-[#1A1A2E]"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expense list */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredDepenses.length > 0 ? (
              <div className="space-y-2">
                {filteredDepenses.map((depense) => {
                  const Icon = categoryIcons[depense.category] || CircleDollarSign;
                  const color = categoryColors[depense.category] || "#94A3B8";
                  return (
                    <Card key={depense.id} className="hover:shadow-sm transition-shadow group">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          {/* Category icon */}
                          <div
                            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${color}15` }}
                          >
                            <Icon className="h-5 w-5" style={{ color }} />
                          </div>

                          {/* Description & metadata */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{depense.description}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                              <span>{getExpenseCategoryLabel(depense.category)}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="hidden sm:inline">{formatDateShort(depense.date)}</span>
                              <span>•</span>
                              <span>{getPaymentMethodLabel(depense.paymentMethod)}</span>
                            </div>
                            {/* Mobile date */}
                            <p className="sm:hidden text-xs text-muted-foreground mt-0.5">
                              {formatDateShort(depense.date)}
                            </p>
                          </div>

                          {/* Amount & delete */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-[#FF6B6B]">
                              -{formatCurrency(depense.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 opacity-0 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              onClick={() => setDeleteTarget(depense)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : hasActiveFilters ? (
              /* Empty state for filtered results */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <SearchX className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-base font-semibold mb-1">Aucune dépense trouvée</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Aucune dépense ne correspond à vos critères de recherche. Essayez de modifier vos filtres.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setCategoryFilter("");
                    setPaymentMethodFilter("");
                    setActiveChip("");
                  }}
                >
                  <Filter className="h-4 w-4 mr-1.5" />
                  Réinitialiser les filtres
                </Button>
              </div>
            ) : (
              /* Empty state for no expenses */
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-base font-semibold mb-1">Aucune dépense enregistrée</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Commencez par enregistrer votre première dépense
                </p>
                <Button
                  className="bg-[#00D4AA] hover:bg-[#00C19C] text-white"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Ajouter une dépense
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categorie" className="space-y-4 mt-4">
            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[320px] w-full rounded-xl" />
                <Skeleton className="h-[320px] w-full rounded-xl" />
              </div>
            ) : chartData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Répartition par catégorie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry) => (
                            <Cell
                              key={entry.category}
                              fill={categoryColors[entry.category] || "#94A3B8"}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {chartData.map((entry) => (
                        <div key={entry.category} className="flex items-center gap-1.5 text-xs">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                categoryColors[entry.category] || "#94A3B8",
                            }}
                          />
                          <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Progress bars */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold">
                      Détail par catégorie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {chartData.map((entry) => {
                      const pct =
                        totalAll > 0
                          ? (entry.value / totalAll) * 100
                          : 0;
                      return (
                        <div key={entry.category} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded"
                                style={{
                                  backgroundColor:
                                    categoryColors[entry.category] || "#94A3B8",
                                }}
                              />
                              <span className="font-medium">{entry.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold">
                                {formatCurrency(entry.value)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-2">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                backgroundColor:
                                  categoryColors[entry.category] || "#94A3B8",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="text-base font-semibold mb-1">Aucune donnée disponible</h3>
                <p className="text-sm text-muted-foreground">
                  Ajoutez des dépenses pour voir la répartition par catégorie
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La dépense{" "}
              <span className="font-semibold text-foreground">
                &quot;{deleteTarget?.description}&quot;
              </span>{" "}
              d&apos;un montant de{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget ? formatCurrency(deleteTarget.amount) : ""}
              </span>{" "}
              sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
