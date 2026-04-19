// Utilitaires de formatage KLARA
// Formatage des montants en FCFA, dates en français, etc.

/**
 * Formate un montant en FCFA
 * Ex: 1500000 → "1 500 000 FCFA"
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return "0 FCFA";
  const formatted = Math.abs(amount)
    .toLocaleString("fr-FR")
    .replace(/\s/g, " ");
  return amount < 0 ? `-${formatted} FCFA` : `${formatted} FCFA`;
}

/**
 * Formate un montant court (sans FCFA)
 * Ex: 1500000 → "1 500 000"
 */
export function formatAmountShort(amount: number): string {
  return Math.abs(amount).toLocaleString("fr-FR").replace(/\s/g, " ");
}

/**
 * Formate un pourcentage
 * Ex: 18.5 → "18,5%"
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return value.toFixed(decimals).replace(".", ",") + "%";
}

/**
 * Formate une date en français
 * Ex: "15 janvier 2024"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formate une date courte
 * Ex: "15/01/2024"
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Formate une date relative (il y a...)
 * Ex: "il y a 3 jours", "aujourd'hui"
 */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} ans`;
}

/**
 * Retourne le label d'un statut de facture
 */
export function getInvoiceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYEE: "Envoyée",
    PAYEE: "Payée",
    EN_RETARD: "En retard",
    ANNULEE: "Annulée",
  };
  return labels[status] || status;
}

/**
 * Retourne le label d'un statut de devis
 */
export function getQuoteStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    BROUILLON: "Brouillon",
    ENVOYE: "Envoyé",
    ACCEPTE: "Accepté",
    REFUSE: "Refusé",
    EXPIRE: "Expiré",
  };
  return labels[status] || status;
}

/**
 * Retourne le label d'une catégorie de dépense
 */
export function getExpenseCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    LOYER: "Loyer",
    SALAIRES: "Salaires",
    FOURNITURES: "Fournitures",
    TRANSPORT: "Transport",
    COMMUNICATION: "Communication",
    MARKETING: "Marketing",
    IMPOTS: "Impôts",
    MAINTENANCE: "Maintenance",
    AUTRE: "Autre",
  };
  return labels[category] || category;
}

/**
 * Retourne le label d'une méthode de paiement
 */
export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    ESPECES: "Espèces",
    MOBILE_MONEY: "Mobile Money",
    VIREMENT: "Virement",
    CHEQUE: "Chèque",
    CARTE: "Carte bancaire",
    AUTRE: "Autre",
    MANUEL: "Manuel",
  };
  return labels[method] || method;
}

/**
 * Retourne la variante de couleur pour un badge de statut facture
 */
export function getInvoiceStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" | null {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline" | null> = {
    BROUILLON: "secondary",
    ENVOYEE: "outline",
    PAYEE: "default",
    EN_RETARD: "destructive",
    ANNULEE: "secondary",
  };
  return variants[status] || "secondary";
}

/**
 * Calcule le nombre de jours de retard
 */
export function getDaysOverdue(dueDate: Date | string): number {
  const d = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Génère le prochain numéro de facture
 * Ex: "FAC-2024-001"
 */
export function generateInvoiceNumber(existingCount: number): string {
  const year = new Date().getFullYear();
  const nextNum = (existingCount + 1).toString().padStart(5, "0");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `FAC-${year}-${nextNum}-${suffix}`;
}

/**
 * Génère le prochain numéro de devis
 * Ex: "DEV-2024-001"
 */
export function generateQuoteNumber(existingCount: number): string {
  const year = new Date().getFullYear();
  const nextNum = (existingCount + 1).toString().padStart(5, "0");
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `DEV-${year}-${nextNum}-${suffix}`;
}

/**
 * Formate un numéro de téléphone Togo
 * Ex: "+22890123456" → "+228 90 12 34 56"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("+228") && cleaned.length === 12) {
    return `+228 ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
  }
  return phone;
}
