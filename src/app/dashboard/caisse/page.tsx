"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function CaissePage() {
  return (
    <ModuleCrudPage
      title="Caisse et Encaissements"
      subtitle="Suivi des encaissements/decaissements avec reconciliation en temps reel."
      endpoint="/api/caisse"
      singularLabel="transaction"
      searchPlaceholder="Rechercher une reference ou description"
      fields={[
        { key: "type", label: "Type", type: "select", required: true, options: [
          { value: "ENCAISSEMENT", label: "Encaissement" },
          { value: "DECAISSEMENT", label: "Decaissement" },
          { value: "REMBOURSEMENT", label: "Remboursement" },
          { value: "AJUSTEMENT", label: "Ajustement" },
        ] },
        { key: "amount", label: "Montant (FCFA)", type: "number", required: true },
        { key: "method", label: "Methode", type: "select", required: true, options: [
          { value: "ESPECES", label: "Especes" },
          { value: "MOBILE_MONEY", label: "Mobile Money" },
          { value: "VIREMENT", label: "Virement" },
          { value: "CHEQUE", label: "Cheque" },
          { value: "CARTE", label: "Carte" },
        ] },
        { key: "reference", label: "Reference", type: "text" },
        { key: "happenedAt", label: "Date", type: "date" },
        { key: "description", label: "Description", type: "textarea" },
      ]}
      columns={[
        { key: "happenedAt", label: "Date", type: "date" },
        { key: "type", label: "Type", type: "badge" },
        { key: "amount", label: "Montant", type: "currency" },
        { key: "method", label: "Methode" },
        { key: "reference", label: "Reference" },
      ]}
      filters={[
        { key: "type", label: "Types", options: [
          { value: "ENCAISSEMENT", label: "Encaissement" },
          { value: "DECAISSEMENT", label: "Decaissement" },
          { value: "REMBOURSEMENT", label: "Remboursement" },
          { value: "AJUSTEMENT", label: "Ajustement" },
        ] },
        { key: "method", label: "Methodes", options: [
          { value: "ESPECES", label: "Especes" },
          { value: "MOBILE_MONEY", label: "Mobile Money" },
          { value: "VIREMENT", label: "Virement" },
          { value: "CHEQUE", label: "Cheque" },
          { value: "CARTE", label: "Carte" },
        ] },
      ]}
      sortOptions={[
        { value: "happenedAt", label: "Date" },
        { value: "amount", label: "Montant" },
      ]}
      stats={[
        { key: "totalEncaisse", label: "Total encaisse", format: "currency" },
        { key: "totalDecaisse", label: "Total decaisse", format: "currency" },
        { key: "soldeNet", label: "Solde net", format: "currency" },
      ]}
      defaultValues={{ type: "ENCAISSEMENT", method: "ESPECES" }}
    />
  );
}
