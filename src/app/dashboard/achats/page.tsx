"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function AchatsPage() {
  return (
    <ModuleCrudPage
      title="Achats et Fournisseurs"
      subtitle="Commandes fournisseurs, echeances et dettes a payer."
      endpoint="/api/achats"
      singularLabel="commande"
      searchPlaceholder="Rechercher un fournisseur ou numero"
      fields={[
        { key: "supplierName", label: "Fournisseur", type: "text", required: true },
        { key: "status", label: "Statut", type: "select", required: true, options: [
          { value: "BROUILLON", label: "Brouillon" },
          { value: "EN_COURS", label: "En cours" },
          { value: "RECU", label: "Recu" },
          { value: "PAYE", label: "Paye" },
          { value: "ANNULE", label: "Annule" },
        ] },
        { key: "totalAmount", label: "Montant total", type: "number", required: true },
        { key: "paidAmount", label: "Deja paye", type: "number", required: true },
        { key: "dueDate", label: "Echeance", type: "date" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "orderNumber", label: "Numero" },
        { key: "supplierName", label: "Fournisseur" },
        { key: "status", label: "Statut", type: "badge" },
        { key: "totalAmount", label: "Total", type: "currency" },
        { key: "dueAmount", label: "Reste du", type: "currency" },
      ]}
      filters={[
        { key: "status", label: "Statuts", options: [
          { value: "BROUILLON", label: "Brouillon" },
          { value: "EN_COURS", label: "En cours" },
          { value: "RECU", label: "Recu" },
          { value: "PAYE", label: "Paye" },
          { value: "ANNULE", label: "Annule" },
        ] },
      ]}
      sortOptions={[
        { value: "orderedAt", label: "Date" },
        { value: "totalAmount", label: "Montant" },
      ]}
      stats={[
        { key: "totalAchats", label: "Achats cumules", format: "currency" },
        { key: "totalDues", label: "Dettes fournisseurs", format: "currency" },
        { key: "pending", label: "Commandes en cours", format: "number" },
      ]}
      defaultValues={{ status: "BROUILLON", totalAmount: 0, paidAmount: 0 }}
    />
  );
}
