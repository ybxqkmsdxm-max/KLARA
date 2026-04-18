"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Send,
  Save,
  ClipboardList,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function NouveauDevisPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState("");
  const [taxRate, setTaxRate] = useState("18");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
  ]);

  const selectedClient = clients.find((c) => c.id === clientId);

  // Fetch clients
  useEffect(() => {
    async function fetchClients() {
      try {
        const res = await fetch("/api/clients?limit=100");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClients();
  }, []);

  // Calculations
  const subtotal = items.reduce(
    (s, item) => s + item.quantity * item.unitPrice,
    0
  );
  const taxAmount = Math.round(subtotal * (parseInt(taxRate) || 0) / 100);
  const total = subtotal + taxAmount;

  // Line item handlers
  const addItem = () => {
    setItems([
      ...items,
      { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (
    id: string,
    field: keyof LineItem,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSubmit = async (sendImmediately: boolean) => {
    // Validation
    if (!clientId) {
      toast.error("Veuillez sélectionner un client");
      return;
    }
    if (!issueDate) {
      toast.error("Veuillez indiquer la date d'émission");
      return;
    }
    if (!expiryDate) {
      toast.error("Veuillez indiquer la date d'expiration");
      return;
    }
    const validItems = items.filter((i) => i.description.trim() !== "");
    if (validItems.length === 0) {
      toast.error("Ajoutez au moins une ligne de devis");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          issueDate,
          expiryDate,
          items: validItems.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          taxRate: parseInt(taxRate),
          notes: notes || undefined,
          status: sendImmediately ? "ENVOYE" : "BROUILLON",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la création");
      }

      toast.success(
        sendImmediately
          ? "Devis créé et envoyé avec succès !"
          : "Devis enregistré en brouillon"
      );
      router.push("/dashboard/devis");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
          <Link href="/dashboard/devis">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold">Nouveau devis</h2>
          <p className="text-sm text-muted-foreground">
            Créez un devis pour votre client
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingClients ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {client.type === "ENTREPRISE" ? "entreprise" : "particulier"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedClient && (
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{selectedClient.name}</p>
                    {selectedClient.email && (
                      <p className="text-muted-foreground">{selectedClient.email}</p>
                    )}
                    {selectedClient.phone && (
                      <p className="text-muted-foreground">{selectedClient.phone}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Dates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate" className="text-sm font-medium">
                    Date d&apos;émission
                  </Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate" className="text-sm font-medium">
                    Date d&apos;expiration
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => {
                    const d = new Date(issueDate);
                    d.setDate(d.getDate() + 30);
                    setExpiryDate(d.toISOString().split("T")[0]);
                  }}
                >
                  Expiration 30 jours
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">
                Lignes du devis
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Header - desktop */}
              <div className="hidden sm:grid sm:grid-cols-12 gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-2 border-b">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantité</div>
                <div className="col-span-2">Prix unitaire</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>

              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                  <div className="sm:col-span-5">
                    <Label className="sm:hidden text-xs text-muted-foreground mb-1 block">
                      Description
                    </Label>
                    <Input
                      placeholder="Description..."
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="sm:hidden text-xs text-muted-foreground mb-1 block">
                      Quantité
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="h-10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="sm:hidden text-xs text-muted-foreground mb-1 block">
                      Prix unitaire (FCFA)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.unitPrice || ""}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "unitPrice",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="h-10"
                      placeholder="0"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center justify-end h-10">
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length <= 1}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Conditions particulières
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Conditions, remarques, délais de livraison..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar recap */}
        <div className="space-y-4">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Récapitulatif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Client */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Client</p>
                <p className="text-sm font-medium">
                  {selectedClient?.name || "Non sélectionné"}
                </p>
              </div>

              {/* TVA select */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Taux de TVA</Label>
                <Select value={taxRate} onValueChange={setTaxRate}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% — Exonéré</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="18">18% — Taux standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total HT</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    TVA ({taxRate}%)
                  </span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold border-t pt-3">
                  <span>Total TTC</span>
                  <span className="text-[#00D4AA]">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium"
                  onClick={() => handleSubmit(true)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Envoyer le devis
                </Button>
                <Button
                  variant="outline"
                  className="w-full font-medium"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer le devis
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
