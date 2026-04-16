"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Demo team members
const teamMembers = [
  { name: "Aminata Mensah", email: "aminata@boutique-excellence.tg", role: "Propriétaire", color: "#1A1A2E" },
  { name: "Kofi Agbéko", email: "kofi@boutique-excellence.tg", role: "Administrateur", color: "#00D4AA" },
  { name: "Ayélé Dossou", email: "ayele@boutique-excellence.tg", role: "Membre", color: "#3B82F6" },
];

const plans = [
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

function getRoleBadgeStyle(role: string) {
  switch (role) {
    case "Propriétaire":
      return "bg-[#1A1A2E] text-white";
    case "Administrateur":
      return "bg-[#00D4AA]/10 text-[#00D4AA]";
    case "Membre":
      return "bg-blue-50 text-blue-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function ParametresPage() {
  const [savingOrg, setSavingOrg] = useState(false);
  const [savedOrg, setSavedOrg] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [savedBilling, setSavedBilling] = useState(false);

  // Org form
  const [orgName, setOrgName] = useState("Boutique Excellence");
  const [orgEmail, setOrgEmail] = useState("contact@boutique-excellence.tg");
  const [orgPhone, setOrgPhone] = useState("+228 90 12 34 56");
  const [orgCity, setOrgCity] = useState("Lomé");
  const [orgAddress, setOrgAddress] = useState("45 Rue du Commerce, Tokoin");
  const [orgSector, setOrgSector] = useState("Commerce de détail");

  // Billing form
  const [defaultTaxRate, setDefaultTaxRate] = useState("18");
  const [defaultTerms, setDefaultTerms] = useState(
    "Paiement à réception de la facture. Tout retard de paiement entraînera des pénalités de retard calculées au taux annuel de 10%."
  );
  const [autoReminder, setAutoReminder] = useState(true);
  const [reminderDelay, setReminderDelay] = useState("7");

  const handleSaveOrg = async () => {
    setSavingOrg(true);
    setSavedOrg(false);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1200));
    setSavingOrg(false);
    setSavedOrg(true);
    toast.success("Informations de l'entreprise mises à jour");
    setTimeout(() => setSavedOrg(false), 3000);
  };

  const handleSaveBilling = async () => {
    setSavingBilling(true);
    setSavedBilling(false);
    await new Promise((r) => setTimeout(r, 1000));
    setSavingBilling(false);
    setSavedBilling(true);
    toast.success("Paramètres de facturation mis à jour");
    setTimeout(() => setSavedBilling(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold">Paramètres</h2>
        <p className="text-sm text-muted-foreground">
          Gérez les paramètres de votre compte
        </p>
      </div>

      <Tabs defaultValue="entreprise">
        <TabsList className="bg-muted w-full sm:w-auto">
          <TabsTrigger value="entreprise">Entreprise</TabsTrigger>
          <TabsTrigger value="facturation">Facturation</TabsTrigger>
          <TabsTrigger value="equipe">Équipe</TabsTrigger>
          <TabsTrigger value="abonnement">Abonnement</TabsTrigger>
        </TabsList>

        {/* Entreprise tab */}
        <TabsContent value="entreprise" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Informations de l&apos;entreprise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Nom de l&apos;entreprise</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgEmail">Email</Label>
                  <Input
                    id="orgEmail"
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgPhone">Téléphone</Label>
                  <Input
                    id="orgPhone"
                    type="tel"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgCity">Ville</Label>
                  <Input
                    id="orgCity"
                    value={orgCity}
                    onChange={(e) => setOrgCity(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="orgAddress">Adresse</Label>
                  <Input
                    id="orgAddress"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secteur d&apos;activité</Label>
                  <Input
                    value={orgSector}
                    onChange={(e) => setOrgSector(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium"
                  onClick={handleSaveOrg}
                  disabled={savingOrg}
                >
                  {savingOrg ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : savedOrg ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : null}
                  {savedOrg ? "Enregistré !" : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Facturation tab */}
        <TabsContent value="facturation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Paramètres de facturation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Taux de TVA par défaut</Label>
                <Select value={defaultTaxRate} onValueChange={setDefaultTaxRate}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% — Exonéré</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="18">18% — Taux standard UEMOA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultTerms">Conditions générales par défaut</Label>
                <Textarea
                  id="defaultTerms"
                  value={defaultTerms}
                  onChange={(e) => setDefaultTerms(e.target.value)}
                  rows={4}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Relance automatique</p>
                    <p className="text-xs text-muted-foreground">
                      Envoyer des relances pour les factures en retard
                    </p>
                  </div>
                  <Switch checked={autoReminder} onCheckedChange={setAutoReminder} />
                </div>
                {autoReminder && (
                  <div className="space-y-2">
                    <Label>Délai avant relance</Label>
                    <Select value={reminderDelay} onValueChange={setReminderDelay}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 jours après échéance</SelectItem>
                        <SelectItem value="7">7 jours après échéance</SelectItem>
                        <SelectItem value="14">14 jours après échéance</SelectItem>
                        <SelectItem value="30">30 jours après échéance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  className="bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium"
                  onClick={handleSaveBilling}
                  disabled={savingBilling}
                >
                  {savingBilling ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : savedBilling ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : null}
                  {savedBilling ? "Enregistré !" : "Enregistrer"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Équipe tab */}
        <TabsContent value="equipe" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Membres de l&apos;équipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {teamMembers.map((member, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] font-medium shrink-0",
                      getRoleBadgeStyle(member.role)
                    )}
                  >
                    {member.role === "Propriétaire" && (
                      <Shield className="h-3 w-3 mr-1" />
                    )}
                    {member.role === "Administrateur" && (
                      <UserCheck className="h-3 w-3 mr-1" />
                    )}
                    {member.role}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Inviter un membre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => toast.info("L'invitation a été envoyée (démo)")}
                >
                  <Mail className="h-4 w-4 mr-1.5" />
                  Inviter
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Les membres invités recevront un email pour rejoindre votre espace.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abonnement tab */}
        <TabsContent value="abonnement" className="mt-4 space-y-6">
          {/* Current plan */}
          <Card className="border-[#00D4AA]/20 bg-[#00D4AA]/5">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-5 w-5 text-[#00D4AA]" />
                    <h3 className="text-lg font-bold">Plan Business</h3>
                    <Badge className="bg-[#00D4AA] text-white text-[10px] font-bold">
                      ACTIF
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    9 900 FCFA / mois • Renouvellement automatique
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Gérer l&apos;abonnement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plan comparison */}
          <div>
            <h3 className="text-base font-semibold mb-4">Comparer les plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card
                    key={plan.name}
                    className={cn(
                      "relative",
                      plan.popular && "border-[#00D4AA] shadow-lg",
                      plan.current && "ring-2 ring-[#00D4AA]/30"
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
                        <Badge variant="secondary" className="text-[10px] font-bold bg-emerald-50 text-emerald-600">
                          Plan actuel
                        </Badge>
                      </div>
                    )}
                    <CardContent className="p-4 pt-6">
                      <div className="text-center mb-4">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-3",
                            plan.popular
                              ? "bg-[#00D4AA]/10"
                              : "bg-muted"
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
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
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
                            toast.info(
                              "Changement de plan (démo)"
                            );
                          }
                        }}
                      >
                        {plan.current ? "Plan actuel" : "Choisir ce plan"}
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
