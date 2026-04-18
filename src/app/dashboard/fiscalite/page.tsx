"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function FiscalitePage() {
  return (
    <ModuleCrudPage
      title="Fiscalite et Declarations"
      subtitle="Preparation TVA/IS/IRPP/CNSS et suivi des depots."
      endpoint="/api/fiscalite"
      singularLabel="declaration"
      searchPlaceholder="Rechercher une periode (ex: 2026-04)"
      fields={[
        { key: "periodMonth", label: "Periode (YYYY-MM)", type: "text", required: true },
        { key: "taxType", label: "Type", type: "select", required: true, options: [
          { value: "TVA", label: "TVA" },
          { value: "IS", label: "IS" },
          { value: "IRPP", label: "IRPP" },
          { value: "CNSS", label: "CNSS" },
          { value: "AUTRE", label: "Autre" },
        ] },
        { key: "status", label: "Statut", type: "select", required: true, options: [
          { value: "BROUILLON", label: "Brouillon" },
          { value: "PRET", label: "Pret" },
          { value: "VALIDE", label: "Valide" },
          { value: "DEPOT", label: "Depot" },
        ] },
        { key: "taxableAmount", label: "Montant taxable", type: "number", required: true },
        { key: "taxAmount", label: "Montant impot", type: "number", required: true },
        { key: "dueDate", label: "Echeance", type: "date" },
        { key: "filedAt", label: "Date depot", type: "date" },
      ]}
      columns={[
        { key: "periodMonth", label: "Periode" },
        { key: "taxType", label: "Type", type: "badge" },
        { key: "status", label: "Statut", type: "badge" },
        { key: "taxAmount", label: "Taxe", type: "currency" },
        { key: "dueDate", label: "Echeance", type: "date" },
      ]}
      filters={[
        { key: "taxType", label: "Types", options: [
          { value: "TVA", label: "TVA" },
          { value: "IS", label: "IS" },
          { value: "IRPP", label: "IRPP" },
          { value: "CNSS", label: "CNSS" },
          { value: "AUTRE", label: "Autre" },
        ] },
        { key: "status", label: "Statuts", options: [
          { value: "BROUILLON", label: "Brouillon" },
          { value: "PRET", label: "Pret" },
          { value: "VALIDE", label: "Valide" },
          { value: "DEPOT", label: "Depot" },
        ] },
      ]}
      sortOptions={[
        { value: "periodMonth", label: "Periode" },
        { value: "taxAmount", label: "Montant taxe" },
      ]}
      stats={[
        { key: "pending", label: "Declarations en attente", format: "number" },
        { key: "totalTaxAmount", label: "Taxe totale", format: "currency" },
      ]}
      defaultValues={{ taxType: "TVA", status: "BROUILLON", taxableAmount: 0, taxAmount: 0 }}
    />
  );
}
