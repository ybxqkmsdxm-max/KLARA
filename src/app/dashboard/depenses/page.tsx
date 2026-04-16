"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import {
  formatCurrency,
  formatDateShort,
  getExpenseCategoryLabel,
  getPaymentMethodLabel,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

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
    } catch (err) {
      setError("Impossible de charger les dépenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepenses();
  }, [fetchDepenses]);

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

  // Chart data
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

  function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number } }> }) {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    const pct = totalAll > 0 ? ((data.payload.value / totalAll) * 100).toFixed(1) : "0";
    return (
      <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
        <p className="font-medium">{data.payload.name}</p>
        <p className="text-muted-foreground">{formatCurrency(data.payload.value)}</p>
        <p className="text-xs text-muted-foreground">{pct}%</p>
      </div>
    );
  }

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
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FF6B6B]/10 flex items-center justify-center">
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
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Transactions</p>
                        <p className="text-lg font-bold">{depenses.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-[#FFB347]/10 flex items-center justify-center">
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

            {/* Expense list */}
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : depenses.length > 0 ? (
              <div className="space-y-2">
                {depenses.map((depense) => {
                  const Icon = categoryIcons[depense.category] || CircleDollarSign;
                  const color = categoryColors[depense.category] || "#94A3B8";
                  return (
                    <Card key={depense.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${color}15` }}
                          >
                            <Icon className="h-5 w-5" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{depense.description}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                              <span>{getExpenseCategoryLabel(depense.category)}</span>
                              <span>•</span>
                              <span>{formatDateShort(depense.date)}</span>
                              <span>•</span>
                              <span>{getPaymentMethodLabel(depense.paymentMethod)}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-[#FF6B6B] shrink-0">
                            -{formatCurrency(depense.amount)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">
                  Aucune dépense enregistrée
                </p>
                <Button
                  className="mt-4 bg-[#00D4AA] hover:bg-[#00C19C] text-white"
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
              <div className="text-center py-16">
                <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-sm font-medium text-muted-foreground">
                  Aucune donnée disponible
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
