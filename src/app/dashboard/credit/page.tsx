"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function CreditPage() {
  return (
    <ModuleCrudPage
      title="Credit et Financement"
      subtitle="Suivi des prets, soldes restants et echeances."
      endpoint="/api/credit"
      singularLabel="pret"
      searchPlaceholder="Rechercher un preteur"
      fields={[
        { key: "lenderName", label: "Preteur", type: "text", required: true },
        { key: "principalAmount", label: "Montant principal", type: "number", required: true },
        { key: "ratePercent", label: "Taux (%)", type: "number", required: true },
        { key: "termMonths", label: "Duree (mois)", type: "number", required: true },
        { key: "monthlyPayment", label: "Mensualite", type: "number", required: true },
        { key: "outstandingAmount", label: "Reste a payer", type: "number", required: true },
        { key: "status", label: "Statut", type: "select", required: true, options: [
          { value: "ACTIF", label: "Actif" },
          { value: "SOLDE", label: "Solde" },
          { value: "EN_RETARD", label: "En retard" },
        ] },
        { key: "startDate", label: "Date debut", type: "date" },
        { key: "nextDueDate", label: "Prochaine echeance", type: "date" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "lenderName", label: "Preteur" },
        { key: "status", label: "Statut", type: "badge" },
        { key: "principalAmount", label: "Principal", type: "currency" },
        { key: "outstandingAmount", label: "Reste", type: "currency" },
        { key: "nextDueDate", label: "Prochaine echeance", type: "date" },
      ]}
      filters={[
        { key: "status", label: "Statuts", options: [
          { value: "ACTIF", label: "Actif" },
          { value: "SOLDE", label: "Solde" },
          { value: "EN_RETARD", label: "En retard" },
        ] },
      ]}
      sortOptions={[
        { value: "createdAt", label: "Plus recents" },
        { value: "outstandingAmount", label: "Reste a payer" },
      ]}
      stats={[
        { key: "activeLoans", label: "Prets actifs", format: "number" },
        { key: "outstandingTotal", label: "Encours total", format: "currency" },
        { key: "principalTotal", label: "Principal total", format: "currency" },
      ]}
      defaultValues={{ status: "ACTIF", ratePercent: 0, termMonths: 0, monthlyPayment: 0 }}
    />
  );
}
