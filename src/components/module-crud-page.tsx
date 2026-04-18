"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDateShort } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

type FieldType = "text" | "number" | "date" | "select" | "textarea";

type Option = {
  value: string;
  label: string;
};

type FieldConfig = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: Option[];
  placeholder?: string;
};

type ColumnConfig = {
  key: string;
  label: string;
  type?: "text" | "currency" | "date" | "badge";
};

type FilterConfig = {
  key: string;
  label: string;
  options: Option[];
};

type StatConfig = {
  label: string;
  key: string;
  format?: "currency" | "number" | "text";
};

type ModuleCrudPageProps = {
  title: string;
  subtitle: string;
  endpoint: string;
  singularLabel: string;
  fields: FieldConfig[];
  columns: ColumnConfig[];
  filters?: FilterConfig[];
  stats?: StatConfig[];
  searchPlaceholder?: string;
  sortOptions?: Option[];
  defaultSortBy?: string;
  defaultSortDir?: "asc" | "desc";
  defaultValues?: Record<string, string | number>;
  listKeyFallback?: string;
  fixedQuery?: Record<string, string>;
  transformSubmit?: (payload: Record<string, unknown>) => Record<string, unknown>;
};

type ApiResponse = {
  items?: Record<string, unknown>[];
  stats?: Record<string, unknown>;
  total?: number;
  page?: number;
  totalPages?: number;
  [key: string]: unknown;
};

function formatValue(value: unknown, type?: ColumnConfig["type"]): string {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "currency") return formatCurrency(Number(value));
  if (type === "date") return formatDateShort(String(value));
  return String(value);
}

function badgeClass(value: string) {
  const danger = ["ANNULEE", "FAILED", "EN_RETARD", "CLOSED", "INACTIF"];
  const success = ["PAYE", "PAYEE", "CONFIRMED", "ACTIVE", "ACTIF", "VALIDE", "DEPOT", "RECU"];
  if (danger.includes(value)) return "bg-red-100 text-red-700";
  if (success.includes(value)) return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
}

function toInputValue(type: FieldType, raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (type === "date") return String(raw).slice(0, 10);
  return String(raw);
}

export function ModuleCrudPage({
  title,
  subtitle,
  endpoint,
  singularLabel,
  fields,
  columns,
  filters = [],
  stats = [],
  searchPlaceholder = "Rechercher...",
  sortOptions = [
    { value: "createdAt", label: "Plus recents" },
    { value: "amount", label: "Montant" },
  ],
  defaultSortBy = "createdAt",
  defaultSortDir = "desc",
  defaultValues = {},
  listKeyFallback,
  fixedQuery,
  transformSubmit,
}: ModuleCrudPageProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statsData, setStatsData] = useState<Record<string, unknown>>({});

  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    Object.fromEntries(filters.map((f) => [f.key, "all"]))
  );

  const initialFormValues = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => {
          if (defaultValues[field.key] !== undefined) {
            return [field.key, String(defaultValues[field.key])];
          }
          if (field.type === "select") return [field.key, field.options?.[0]?.value || ""];
          return [field.key, ""];
        })
      ),
    [fields, defaultValues]
  );

  const [formValues, setFormValues] = useState<Record<string, string>>(initialFormValues);

  const resetForm = useCallback(() => {
    setFormValues(initialFormValues);
    setEditing(null);
  }, [initialFormValues]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortDir,
      });
      if (search.trim()) params.set("q", search.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      for (const [key, value] of Object.entries(filterValues)) {
        if (value && value !== "all") params.set(key, value);
      }
      if (fixedQuery) {
        for (const [key, value] of Object.entries(fixedQuery)) {
          params.set(key, value);
        }
      }

      const res = await fetch(`${endpoint}?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");

      const data = (await res.json()) as ApiResponse;
      const resolvedItems = data.items || (listKeyFallback && Array.isArray(data[listKeyFallback]) ? (data[listKeyFallback] as Record<string, unknown>[]) : []);

      setItems(resolvedItems || []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
      setStatsData((data.stats || {}) as Record<string, unknown>);
    } catch {
      setError("Impossible de charger les donnees.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, limit, sortBy, sortDir, search, dateFrom, dateTo, filterValues, listKeyFallback, fixedQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (item: Record<string, unknown>) => {
    setEditing(item);
    const nextValues = Object.fromEntries(
      fields.map((field) => [field.key, toInputValue(field.type, item[field.key])])
    );
    setFormValues(nextValues);
    setDialogOpen(true);
  };

  const validateForm = () => {
    for (const field of fields) {
      if (field.required && !formValues[field.key]?.trim()) {
        toast.error(`${field.label} est requis`);
        return false;
      }
    }
    return true;
  };

  const buildPayload = (): Record<string, unknown> => {
    const raw: Record<string, unknown> = {};
    for (const field of fields) {
      const value = formValues[field.key];
      if (value === "") continue;
      if (field.type === "number") {
        raw[field.key] = Number(value);
      } else {
        raw[field.key] = value;
      }
    }
    if (fixedQuery) {
      for (const [key, value] of Object.entries(fixedQuery)) raw[key] = value;
    }
    return transformSubmit ? transformSubmit(raw) : raw;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);
      const payload = buildPayload();
      const id = editing?.id ? String(editing.id) : null;

      const query = new URLSearchParams(fixedQuery || {});
      const url = id ? `${endpoint}/${id}${query.toString() ? `?${query.toString()}` : ""}` : endpoint;
      const method = id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Operation impossible");
      }

      toast.success(id ? `${singularLabel} mis a jour` : `${singularLabel} ajoute`);
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      setDeleting(true);
      const query = new URLSearchParams(fixedQuery || {});
      const res = await fetch(`${endpoint}/${String(deleteTarget.id)}${query.toString() ? `?${query.toString()}` : ""}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Suppression impossible");
      }
      toast.success(`${singularLabel} supprime`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#00D4AA] text-white hover:bg-[#00C19C]" onClick={openCreateDialog}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nouveau
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? `Modifier ${singularLabel}` : `Nouveau ${singularLabel}`}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2 md:grid-cols-2">
              {fields.map((field) => (
                <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                  <Label className="mb-1.5 block">{field.label}{field.required ? " *" : ""}</Label>
                  {field.type === "select" ? (
                    <Select value={formValues[field.key] || ""} onValueChange={(value) => setFormValues((prev) => ({ ...prev, [field.key]: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Choisir ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea
                      value={formValues[field.key] || ""}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={formValues[field.key] || ""}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Annuler</Button>
              <Button className="bg-[#00D4AA] text-white hover:bg-[#00C19C]" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? "Mettre a jour" : "Ajouter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {stats.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {stats.map((stat) => {
            const value = statsData[stat.key];
            const content = stat.format === "currency" ? formatCurrency(Number(value || 0)) : String(value ?? "-");
            return (
              <Card key={stat.key}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtres avances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={searchPlaceholder}
                className="pl-9"
              />
            </div>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {filters.map((filter) => (
              <Select
                key={filter.key}
                value={filterValues[filter.key] || "all"}
                onValueChange={(value) => {
                  setFilterValues((prev) => ({ ...prev, [filter.key]: value }));
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous {filter.label.toLowerCase()}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            <Select value={sortBy} onValueChange={(value) => { setSortBy(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Tri" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortDir} onValueChange={(value: "asc" | "desc") => { setSortDir(value); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Ordre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Decroissant</SelectItem>
                <SelectItem value="asc">Croissant</SelectItem>
              </SelectContent>
            </Select>

            <Select value={String(limit)} onValueChange={(value) => { setLimit(Number(value)); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Par page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => loadData()}>Appliquer</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Liste ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{error}</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Aucune donnee disponible.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      {columns.map((column) => (
                        <th key={column.key} className="px-3 py-2 font-medium">{column.label}</th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={String(item.id)} className="border-b last:border-b-0">
                        {columns.map((column) => {
                          const raw = item[column.key];
                          return (
                            <td key={column.key} className="px-3 py-2">
                              {column.type === "badge" ? (
                                <Badge className={badgeClass(String(raw || ""))}>{String(raw || "-")}</Badge>
                              ) : (
                                formatValue(raw, column.type)
                              )}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-red-600" onClick={() => setDeleteTarget(item)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {page} sur {totalPages}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Precedent
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Suivant
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet element ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irreversible et retirera definitivement cet element.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 text-white hover:bg-red-700">
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
