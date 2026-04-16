"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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
  Search,
  Plus,
  Users,
  Building2,
  Mail,
  Phone,
  MapPin,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  CircleDollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  type: string;
  totalFacture: number;
  totalPaye: number;
  nombreFactures: number;
}

const typeTabs = [
  { value: "", label: "Tous" },
  { value: "PARTICULIER", label: "Particulier" },
  { value: "ENTREPRISE", label: "Entreprise" },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // New client form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newType, setNewType] = useState("PARTICULIER");
  const [newCity, setNewCity] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (activeType) params.set("type", activeType);
      params.set("page", page.toString());
      params.set("limit", "20");
      const res = await fetch(`/api/clients?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setClients(data.clients);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError("Impossible de charger les clients");
    } finally {
      setLoading(false);
    }
  }, [search, activeType, page]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setPage(1);
  };

  const handleCreateClient = async () => {
    if (!newName.trim()) {
      toast.error("Le nom du client est requis");
      return;
    }
    if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Adresse email invalide");
      return;
    }

    try {
      setCreating(true);
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail || undefined,
          phone: newPhone || undefined,
          city: newCity || undefined,
          type: newType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      toast.success("Client créé avec succès !");
      setDialogOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewCity("");
      setNewType("PARTICULIER");
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Revenue Stat Card */}
      {!loading && clients.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-[#1A1A2E] to-[#1A1A2E]/90 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-[#00D4AA]" />
            </div>
            <div>
              <p className="text-xs text-white/60">Chiffre d'affaires total</p>
              <p className="text-xl font-bold tabular-nums">
                {formatCurrency(clients.reduce((sum, c) => sum + c.totalFacture, 0))}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/70">
              {total} client{total > 1 ? "s" : ""}
              {" — "}
              {clients.filter((c) => c.type === "ENTREPRISE").length} Entreprise{clients.filter((c) => c.type === "ENTREPRISE").length > 1 ? "s" : ""}
              {", "}
              {clients.filter((c) => c.type === "PARTICULIER").length} Particulier{clients.filter((c) => c.type === "PARTICULIER").length > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Clients</h2>
          <p className="text-sm text-muted-foreground">
            {total} client{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={loading || clients.length === 0}
            onClick={async () => {
              try {
                const res = await fetch("/api/export?type=clients&format=csv");
                if (!res.ok) throw new Error();
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "klara-clients.csv";
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Export des clients téléchargé");
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
                Nouveau client
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">Nouveau client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom *</Label>
                <Input
                  id="clientName"
                  placeholder="Nom complet ou raison sociale..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="email@exemple.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Téléphone</Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="+228 90 12 34 56"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input
                    placeholder="Lomé"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARTICULIER">Particulier</SelectItem>
                      <SelectItem value="ENTREPRISE">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={creating}
              >
                Annuler
              </Button>
              <Button
                className="bg-[#00D4AA] hover:bg-[#00C19C] text-white"
                onClick={handleCreateClient}
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex gap-1">
        {typeTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTypeChange(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              activeType === tab.value
                ? "bg-[#1A1A2E] text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative focus-within:border-[#00D4AA] rounded-lg border input-wrapper">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un client..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className={cn("pl-9 h-12 pr-9 text-base border-0 focus-visible:ring-0", search && "pr-9")}
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-10">
          <p className="text-sm text-muted-foreground">{error}</p>
          <button
            onClick={fetchClients}
            className="mt-2 text-sm text-[#00D4AA] hover:text-[#00C19C] font-medium"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Client cards */}
      {!loading && !error && (
        <>
          {clients.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                >
                  <Card className={cn(
                    "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full border-l-4 cursor-pointer",
                    client.type === "ENTREPRISE"
                      ? "border-l-blue-500"
                      : "border-l-[#8B5CF6]"
                  )}>
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                            client.type === "ENTREPRISE"
                              ? "bg-[#1A1A2E]"
                              : "bg-[#00D4AA]/10"
                          )}
                        >
                          {client.type === "ENTREPRISE" ? (
                            <Building2
                              className={cn(
                                "h-5 w-5 text-white"
                              )}
                            />
                          ) : (
                            <Users
                              className={cn(
                                "h-5 w-5 text-[#00D4AA]"
                              )}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold truncate">
                            {client.name}
                          </p>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-medium mt-0.5",
                              client.type === "ENTREPRISE"
                                ? "bg-[#1A1A2E]/5 text-[#1A1A2E]"
                                : "bg-[#00D4AA]/10 text-[#00D4AA]"
                            )}
                          >
                            {client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{client.city}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <div>
                          <p className="text-[10px] text-muted-foreground">
                            {client.nombreFactures} facture{client.nombreFactures > 1 ? "s" : ""}
                          </p>
                          <p className="text-sm font-bold mt-0.5">
                            {formatCurrency(client.totalFacture)}
                          </p>
                          <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${client.totalFacture > 0 ? Math.round((client.totalPaye / client.totalFacture) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Payé</p>
                            <p className="text-sm font-medium text-emerald-600 font-mono mt-0.5">
                              {formatCurrency(client.totalPaye)}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs text-[#00D4AA] hover:text-[#00C19C] font-medium transition-colors">
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Voir</span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Aucun client trouvé
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Ajoutez votre premier client pour commencer
              </p>
              <Button
                className="bg-[#00D4AA] hover:bg-[#00C19C] text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nouveau client
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Précédent</span>
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8"
              >
                <span className="hidden sm:inline mr-1">Suivant</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
