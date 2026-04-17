"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  FileText,
  Users,
  CreditCard,
  Check,
  Loader2,
  Star,
  Zap,
  Crown,
  Mail,
  Shield,
  UserCheck,
  UserPlus,
  X,
  Copy,
  Hash,
  Coins,
  BarChart3,
  Invoice,
  CircleDollarSign,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const SECTORS = [
  { value: "commerce", label: "Commerce" },
  { value: "services", label: "Services" },
  { value: "restauration", label: "Restauration" },
  { value: "it", label: "IT & Technologie" },
  { value: "construction", label: "Construction" },
  { value: "transport", label: "Transport" },
  { value: "autre", label: "Autre" },
];

const PAYMENT_TERMS = [
  { value: "immediate", label: "À réception" },
  { value: "15", label: "15 jours" },
  { value: "30", label: "30 jours" },
  { value: "45", label: "45 jours" },
  { value: "60", label: "60 jours" },
];

const TAX_RATE_OPTIONS = [
  { value: "0", label: "0 % — Exonéré" },
  { value: "10", label: "10 %" },
  { value: "18", label: "18 % — Taux standard UEMOA" },
];

const TEAM_MEMBERS = [
  {
    id: "1",
    name: "Aminata Mensah",
    email: "aminata@boutique-excellence.tg",
    role: "Owner" as const,
    joinedAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Kofi Agbéko",
    email: "kofi@boutique-excellence.tg",
    role: "Admin" as const,
    joinedAt: "2024-03-20",
  },
  {
    id: "3",
    name: "Ayélé Dossou",
    email: "ayele@boutique-excellence.tg",
    role: "Member" as const,
    joinedAt: "2024-06-10",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "2 900",
    icon: Zap,
    features: [
      "5 clients maximum",
      "20 factures / mois",
      "1 utilisateur",
      "Export PDF basique",
      "Support email",
    ],
    popular: false,
    current: false,
  },
  {
    name: "Business",
    price: "9 900",
    icon: Crown,
    features: [
      "Clients illimités",
      "Factures illimitées",
      "3 utilisateurs",
      "Relances automatiques",
      "Devis & dépenses",
      "Mobile Money intégré",
      "Support prioritaire",
    ],
    popular: true,
    current: true,
  },
  {
    name: "Pro",
    price: "24 900",
    icon: Star,
    features: [
      "Tout dans Business",
      "10 utilisateurs",
      "API & intégrations",
      "Multi-devises",
      "Rapports avancés",
      "Comptabilité intégrée",
      "Account manager dédié",
      "Formation personnalisée",
    ],
    popular: false,
    current: false,
  },
];

const USAGE_STATS = [
  { label: "Factures", current: 5, max: Infinity, icon: FileText },
  { label: "Clients", current: 5, max: Infinity, icon: Users },
  { label: "Utilisateurs", current: 3, max: 3, icon: UserCheck },
  { label: "Espace stockage", current: 12, max: 50, unit: "MB", icon: BarChart3 },
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getRoleBadge(role: "Owner" | "Admin" | "Member") {
  switch (role) {
    case "Owner":
      return { className: "bg-[#1A1A2E] text-white hover:bg-[#1A1A2E]", icon: Shield };
    case "Admin":
      return { className: "bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-[#00D4AA]/10", icon: UserCheck };
    case "Member":
      return { className: "bg-blue-50 text-blue-600 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400", icon: Users };
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "Owner": return "Propriétaire";
    case "Admin": return "Administrateur";
    case "Member": return "Membre";
    default: return role;
  }
}

function formatUsage(current: number, max: number, unit?: string) {
  if (max === Infinity) return `${current} / ∞`;
  return `${current} / ${max} ${unit ?? ""}`;
}

function getUsagePercent(current: number, max: number) {
  if (max === Infinity) return 15;
  return Math.round((current / max) * 100);
}

// ──────────────────────────────────────────────
// Validation helpers
// ──────────────────────────────────────────────

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

interface FieldErrorProps {
  message?: string;
}

function FieldError({ message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p className="text-xs text-[#FF6B6B] flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function ParametresPage() {
  // ── Saving states ──
  const [savingOrg, setSavingOrg] = useState(false);
  const [savedOrg, setSavedOrg] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [savedBilling, setSavedBilling] = useState(false);

  // ── Validation states ──
  const [orgErrors, setOrgErrors] = useState<Record<string, string>>({});
  const [billingErrors, setBillingErrors] = useState<Record<string, string>>({});

  // ── Entreprise form state ──
  const [orgForm, setOrgForm] = useState({
    name: "Boutique Excellence",
    email: "contact@boutique-excellence.tg",
    phone: "+228 90 12 34 56",
    address: "45 Rue du Commerce, Tokoin",
    city: "Lomé",
    sector: "commerce",
    nif: "TG-2024-001234",
  });
  const [orgSnapshot, setOrgSnapshot] = useState({ ...orgForm });

  // ── Facturation form state ──
  const [billingForm, setBillingForm] = useState({
    taxRate: "18",
    paymentTerms: "30",
    defaultNotes:
      "Merci pour votre confiance.\n\nLe paiement est attendu dans les délais convenus.\n\nCordialement,\nL'équipe Boutique Excellence",
    defaultTerms:
      "Paiement à réception de la facture. Tout retard de paiement entraînera des pénalités de retard calculées au taux annuel de 10%.",
  });
  const [billingSnapshot, setBillingSnapshot] = useState({ ...billingForm });

  // ── Équipe state ──
  const [members, setMembers] = useState(TEAM_MEMBERS);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Admin" | "Member">("Member");
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  // ────────────────────────────────────────────
  // Handlers — Entreprise
  // ────────────────────────────────────────────

  const updateOrg = (field: string, value: string) => {
    setOrgForm((prev) => ({ ...prev, [field]: value }));
    setOrgErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateOrg = (): boolean => {
    const errors: Record<string, string> = {};
    if (!orgForm.name.trim()) errors.name = "Le nom de l'entreprise est requis";
    if (!orgForm.email.trim()) errors.email = "L'email est requis";
    else if (!isValidEmail(orgForm.email)) errors.email = "Format d'email invalide";
    if (!orgForm.phone.trim()) errors.phone = "Le téléphone est requis";
    if (!orgForm.city.trim()) errors.city = "La ville est requise";
    if (!orgForm.nif.trim()) errors.nif = "Le numéro NIF est requis";
    setOrgErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOrg = async () => {
    if (!validateOrg()) return;
    setSavingOrg(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSavingOrg(false);
    setSavedOrg(true);
    setOrgSnapshot({ ...orgForm });
    toast.success("Informations de l'entreprise mises à jour avec succès");
    setTimeout(() => setSavedOrg(false), 3000);
  };

  const handleCancelOrg = () => {
    setOrgForm({ ...orgSnapshot });
    setOrgErrors({});
  };

  const hasOrgChanges =
    JSON.stringify(orgForm) !== JSON.stringify(orgSnapshot);

  // ────────────────────────────────────────────
  // Handlers — Facturation
  // ────────────────────────────────────────────

  const updateBilling = (field: string, value: string) => {
    setBillingForm((prev) => ({ ...prev, [field]: value }));
    setBillingErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateBilling = (): boolean => {
    const errors: Record<string, string> = {};
    const tax = parseFloat(billingForm.taxRate);
    if (isNaN(tax) || tax < 0 || tax > 100)
      errors.taxRate = "Le taux de TVA doit être entre 0 et 100";
    setBillingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveBilling = async () => {
    if (!validateBilling()) return;
    setSavingBilling(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSavingBilling(false);
    setSavedBilling(true);
    setBillingSnapshot({ ...billingForm });
    toast.success("Paramètres de facturation mis à jour avec succès");
    setTimeout(() => setSavedBilling(false), 3000);
  };

  const handleCancelBilling = () => {
    setBillingForm({ ...billingSnapshot });
    setBillingErrors({});
  };

  const hasBillingChanges =
    JSON.stringify(billingForm) !== JSON.stringify(billingSnapshot);

  // ────────────────────────────────────────────
  // Handlers — Équipe
  // ────────────────────────────────────────────

  const handleInvite = async () => {
    setInviteError("");
    if (!inviteEmail.trim()) {
      setInviteError("L'adresse email est requise");
      return;
    }
    if (!isValidEmail(inviteEmail)) {
      setInviteError("Format d'email invalide");
      return;
    }
    if (members.some((m) => m.email === inviteEmail)) {
      setInviteError("Ce membre existe déjà dans l'équipe");
      return;
    }
    setInviting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setInviting(false);
    setMembers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        joinedAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setInviteEmail("");
    setInviteRole("Member");
    setInviteDialogOpen(false);
    toast.success(`Invitation envoyée à ${inviteEmail}`);
  };

  const handleRemoveMember = (id: string) => {
    const member = members.find((m) => m.id === id);
    if (member?.role === "Owner") {
      toast.error("Le propriétaire ne peut pas être supprimé");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast.info(`${member?.name ?? "Membre"} a été retiré de l'équipe`);
  };

  // ────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez les paramètres de votre compte et de votre entreprise
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="entreprise">
        <TabsList className="bg-muted w-full sm:w-auto grid grid-cols-4 sm:inline-flex">
          <TabsTrigger value="entreprise" className="gap-1.5 text-xs sm:text-sm transition-colors duration-200">
            <Building2 className="h-3.5 w-3.5 hidden sm:block" />
            Entreprise
          </TabsTrigger>
          <TabsTrigger value="facturation" className="gap-1.5 text-xs sm:text-sm transition-colors duration-200">
            <FileText className="h-3.5 w-3.5 hidden sm:block" />
            Facturation
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-1.5 text-xs sm:text-sm transition-colors duration-200">
            <Users className="h-3.5 w-3.5 hidden sm:block" />
            Équipe
          </TabsTrigger>
          <TabsTrigger value="abonnement" className="gap-1.5 text-xs sm:text-sm transition-colors duration-200">
            <CreditCard className="h-3.5 w-3.5 hidden sm:block" />
            Abonnement
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════ */}
        {/* TAB 1 — ENTREPRISE                     */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="entreprise" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#00D4AA]" />
                Informations de l&apos;entreprise
              </CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur vos factures et devis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informations générales</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="orgName">
                    Nom de l&apos;entreprise <span className="text-[#FF6B6B]">*</span>
                  </Label>
                  <Input
                    id="orgName"
                    placeholder="Nom de votre entreprise"
                    value={orgForm.name}
                    onChange={(e) => updateOrg("name", e.target.value)}
                    className={cn(orgErrors.name && "border-[#FF6B6B] focus-visible:ring-[#FF6B6B]")}
                  />
                  <FieldError message={orgErrors.name} />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="orgEmail">
                    Email <span className="text-[#FF6B6B]">*</span>
                  </Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    placeholder="contact@entreprise.com"
                    value={orgForm.email}
                    onChange={(e) => updateOrg("email", e.target.value)}
                    className={cn(orgErrors.email && "border-[#FF6B6B] focus-visible:ring-[#FF6B6B]")}
                  />
                  <FieldError message={orgErrors.email} />
                </div>

                {/* Téléphone */}
                <div className="space-y-2">
                  <Label htmlFor="orgPhone">
                    Téléphone <span className="text-[#FF6B6B]">*</span>
                  </Label>
                  <Input
                    id="orgPhone"
                    type="tel"
                    placeholder="+228 XX XX XX XX"
                    value={orgForm.phone}
                    onChange={(e) => updateOrg("phone", e.target.value)}
                    className={cn(orgErrors.phone && "border-[#FF6B6B] focus-visible:ring-[#FF6B6B]")}
                  />
                  <FieldError message={orgErrors.phone} />
                </div>

              </div>

              <Separator />

              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Coordonnées</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ville */}
                <div className="space-y-2">
                  <Label htmlFor="orgCity">
                    Ville <span className="text-[#FF6B6B]">*</span>
                  </Label>
                  <Input
                    id="orgCity"
                    placeholder="Lomé"
                    value={orgForm.city}
                    onChange={(e) => updateOrg("city", e.target.value)}
                    className={cn(orgErrors.city && "border-[#FF6B6B] focus-visible:ring-[#FF6B6B]")}
                  />
                  <FieldError message={orgErrors.city} />
                </div>

                {/* Adresse */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="orgAddress">Adresse</Label>
                  <Input
                    id="orgAddress"
                    placeholder="Numéro et rue, quartier"
                    value={orgForm.address}
                    onChange={(e) => updateOrg("address", e.target.value)}
                  />
                </div>

              </div>

              <Separator />

              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documents &amp; Activité</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Secteur */}
                <div className="space-y-2">
                  <Label>Secteur d&apos;activité</Label>
                  <Select
                    value={orgForm.sector}
                    onValueChange={(v) => updateOrg("sector", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* NIF */}
                <div className="space-y-2">
                  <Label htmlFor="orgNif">
                    Numéro NIF <span className="text-[#FF6B6B]">*</span>
                  </Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="orgNif"
                      placeholder="TG-XXXX-XXXXXX"
                      value={orgForm.nif}
                      onChange={(e) => updateOrg("nif", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <FieldError message={orgErrors.nif} />
                </div>
              </div>

              <Separator />

              {/* Save / Cancel */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelOrg}
                  disabled={!hasOrgChanges || savingOrg}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
                <Button
                  className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium gap-1.5"
                  onClick={handleSaveOrg}
                  disabled={!hasOrgChanges || savingOrg}
                >
                  {savingOrg ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedOrg ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                  {savedOrg ? "Enregistré !" : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════ */}
        {/* TAB 2 — FACTURATION                    */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="facturation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00D4AA]" />
                Paramètres de facturation
              </CardTitle>
              <CardDescription>
                Configurez les valeurs par défaut pour vos factures et devis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Paramètres par défaut</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Taux de TVA */}
                <div className="space-y-2">
                  <Label>Taux de TVA par défaut</Label>
                  <Select
                    value={billingForm.taxRate}
                    onValueChange={(v) => updateBilling("taxRate", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_RATE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditions de paiement */}
                <div className="space-y-2">
                  <Label>Conditions de paiement par défaut</Label>
                  <Select
                    value={billingForm.paymentTerms}
                    onValueChange={(v) => updateBilling("paymentTerms", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TERMS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Devise (read-only) */}
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value="XOF — Franc CFA (BCEAO)"
                      disabled
                      className="pl-9 bg-muted cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    La devise est fixée selon votre zone UEMOA.
                  </p>
                </div>
              </div>

              <Separator />

              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documents</p>

              {/* Notes par défaut */}
              <div className="space-y-2">
                <Label htmlFor="defaultNotes">Notes par défaut</Label>
                <Textarea
                  id="defaultNotes"
                  placeholder="Texte ajouté en bas de chaque facture..."
                  value={billingForm.defaultNotes}
                  onChange={(e) => updateBilling("defaultNotes", e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Ces notes apparaîtront sur toutes vos nouvelles factures.
                </p>
              </div>

              {/* Conditions générales */}
              <div className="space-y-2">
                <Label htmlFor="defaultTerms">Conditions générales par défaut</Label>
                <Textarea
                  id="defaultTerms"
                  placeholder="Conditions de paiement et pénalités de retard..."
                  value={billingForm.defaultTerms}
                  onChange={(e) => updateBilling("defaultTerms", e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Separator />

              {/* Save / Cancel */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancelBilling}
                  disabled={!hasBillingChanges || savingBilling}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
                <Button
                  className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium gap-1.5"
                  onClick={handleSaveBilling}
                  disabled={!hasBillingChanges || savingBilling}
                >
                  {savingBilling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : savedBilling ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {savedBilling ? "Enregistré !" : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════ */}
        {/* TAB 3 — ÉQUIPE                         */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="equipe" className="mt-6 space-y-4">
          {/* Members List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#00D4AA]" />
                  Membres de l&apos;équipe
                </CardTitle>
                <CardDescription className="mt-1">
                  {members.length} membre{members.length > 1 ? "s" : ""} au total
                </CardDescription>
              </div>
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium gap-1.5"
                    size="sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Inviter un membre</span>
                    <span className="sm:hidden">Inviter</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Inviter un membre</DialogTitle>
                    <DialogDescription>
                      Envoyez une invitation pour rejoindre votre espace KLARA.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="inviteEmail">
                        Adresse email <span className="text-[#FF6B6B]">*</span>
                      </Label>
                      <Input
                        id="inviteEmail"
                        type="email"
                        placeholder="email@exemple.com"
                        value={inviteEmail}
                        onChange={(e) => {
                          setInviteEmail(e.target.value);
                          setInviteError("");
                        }}
                        className={cn(inviteError && "border-[#FF6B6B] focus-visible:ring-[#FF6B6B]")}
                      />
                      <FieldError message={inviteError} />
                    </div>
                    <div className="space-y-2">
                      <Label>Rôle</Label>
                      <Select
                        value={inviteRole}
                        onValueChange={(v) => setInviteRole(v as "Admin" | "Member")}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Admin">Administrateur</SelectItem>
                          <SelectItem value="Member">Membre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInviteDialogOpen(false);
                        setInviteEmail("");
                        setInviteError("");
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium gap-1.5"
                      onClick={handleInvite}
                      disabled={inviting}
                    >
                      {inviting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Envoyer l&apos;invitation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-2">
              {members.map((member) => {
                const badge = getRoleBadge(member.role);
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        {member.role === "Owner" && (
                          <Badge className="bg-[#1A1A2E] text-white text-[10px] px-1.5 py-0">
                            Vous
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </p>
                    </div>

                    {/* Role Badge */}
                    <Badge
                      variant="secondary"
                      className={cn("text-[10px] font-medium shrink-0 gap-1", badge.className)}
                    >
                      <BadgeIcon className="h-3 w-3" />
                      {getRoleLabel(member.role)}
                    </Badge>

                    {/* Remove button */}
                    {member.role !== "Owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-[#FF6B6B] shrink-0"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════ */}
        {/* TAB 4 — ABONNEMENT                     */}
        {/* ═══════════════════════════════════════ */}
        <TabsContent value="abonnement" className="mt-6 space-y-6">
          {/* Info Banner */}
          <div className="flex items-center gap-3 rounded-lg border border-[#00D4AA]/20 bg-[#00D4AA]/5 px-4 py-3">
            <Info className="h-5 w-5 text-[#00D4AA] shrink-0" />
            <p className="text-sm text-muted-foreground">
              Votre plan se renouvelle automatiquement le 15 mars 2025.
            </p>
          </div>

          {/* Current Plan */}
          <Card className="border-[#00D4AA]/20 bg-gradient-to-br from-[#00D4AA]/5 to-transparent">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Crown className="h-5 w-5 text-[#00D4AA]" />
                    <h3 className="text-lg font-bold">Plan Business</h3>
                    <Badge className="bg-[#00D4AA] text-white text-[10px] font-bold">
                      ACTIF
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    9 900 FCFA / mois &middot; Renouvellement automatique le 15/07/2025
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => toast.info("Gestion de l'abonnement (démo)")}
                >
                  Gérer l&apos;abonnement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#FFB347]" />
                Utilisation
              </CardTitle>
              <CardDescription>
                Suivez la consommation de votre plan Business.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {USAGE_STATS.map((stat) => {
                  const Icon = stat.icon;
                  const pct = getUsagePercent(stat.current, stat.max);
                  const isUnlimited = stat.max === Infinity;
                  const isNearLimit = !isUnlimited && pct >= 80;
                  return (
                    <div key={stat.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", isNearLimit ? "text-[#FF6B6B]" : "text-muted-foreground")} />
                          <span className="text-sm font-medium">{stat.label}</span>
                        </div>
                        <span className={cn("text-xs font-mono", isNearLimit ? "text-[#FF6B6B] font-semibold" : "text-muted-foreground")}>
                          {formatUsage(stat.current, stat.max, stat.unit)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        className={cn("h-2", isNearLimit && "[&>div]:bg-[#FF6B6B]")}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Plan Comparison */}
          <div>
            <h3 className="text-base font-semibold mb-4">Comparer les plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={plan.name}
                    className={cn(
                      "relative transition-shadow hover:shadow-lg",
                      plan.popular && "border-[#00D4AA] bg-gradient-to-br from-[#00D4AA]/[0.03] to-white dark:to-slate-900",
                      plan.current && "ring-2 ring-[#00D4AA]/30",
                      !plan.popular && !plan.current && "bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-900"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-[#00D4AA] text-white text-[10px] font-bold">
                          POPULAIRE
                        </Badge>
                      </div>
                    )}
                    {plan.current && (
                      <div className="absolute -top-3 right-4">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                        >
                          Plan actuel
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-4 pt-6 flex flex-col">
                      <div className="text-center mb-4">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3",
                            plan.popular ? "bg-[#00D4AA]/10" : "bg-muted"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-6 w-6",
                              plan.popular ? "text-[#00D4AA]" : "text-muted-foreground"
                            )}
                          />
                        </div>
                        <h4 className="text-lg font-bold">{plan.name}</h4>
                        <div className="mt-1">
                          <span className="text-2xl font-bold">{plan.price}</span>
                          <span className="text-sm text-muted-foreground"> FCFA/mois</span>
                        </div>
                      </div>
                      <Separator className="mb-4" />
                      <ul className="space-y-2.5 flex-1">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-[#00D4AA] shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={cn(
                          "w-full mt-4 font-medium",
                          plan.current
                            ? "bg-muted text-muted-foreground cursor-default"
                            : plan.popular
                            ? "bg-[#00D4AA] hover:bg-[#00C19C] text-white"
                            : "bg-[#1A1A2E] hover:bg-[#1A1A2E]/90 text-white"
                        )}
                        disabled={plan.current}
                        onClick={() => {
                          if (!plan.current) {
                            toast.info(`Changement vers le plan ${plan.name} (démo)`);
                          }
                        }}
                      >
                        {plan.current ? "Plan actuel" : "Changer de plan"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
