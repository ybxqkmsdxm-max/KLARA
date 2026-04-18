"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function PaiementsPage() {
  return (
    <ModuleCrudPage
      title="Paiements Mobile Money"
      subtitle="Encaissements et decaissements multi-operateurs."
      endpoint="/api/paiements"
      singularLabel="transaction"
      searchPlaceholder="Rechercher telephone, reference ou facture"
      fields={[
        { key: "direction", label: "Direction", type: "select", required: true, options: [
          { value: "IN", label: "Entrant" },
          { value: "OUT", label: "Sortant" },
        ] },
        { key: "operator", label: "Operateur", type: "select", required: true, options: [
          { value: "FLOOZ", label: "Flooz" },
          { value: "TMONEY", label: "T-Money" },
          { value: "WAVE", label: "Wave" },
          { value: "MTN", label: "MTN" },
          { value: "ORANGE", label: "Orange" },
        ] },
        { key: "amount", label: "Montant", type: "number", required: true },
        { key: "fees", label: "Frais", type: "number", required: true },
        { key: "status", label: "Statut", type: "select", required: true, options: [
          { value: "PENDING", label: "En attente" },
          { value: "CONFIRMED", label: "Confirmee" },
          { value: "FAILED", label: "Echouee" },
          { value: "REFUNDED", label: "Remboursee" },
        ] },
        { key: "phoneNumber", label: "Telephone", type: "text" },
        { key: "externalRef", label: "Reference externe", type: "text" },
        { key: "linkedInvoiceId", label: "ID facture liee", type: "text" },
        { key: "happenedAt", label: "Date", type: "date" },
      ]}
      columns={[
        { key: "happenedAt", label: "Date", type: "date" },
        { key: "direction", label: "Direction", type: "badge" },
        { key: "operator", label: "Operateur", type: "badge" },
        { key: "status", label: "Statut", type: "badge" },
        { key: "amount", label: "Montant", type: "currency" },
      ]}
      filters={[
        { key: "direction", label: "Directions", options: [
          { value: "IN", label: "Entrant" },
          { value: "OUT", label: "Sortant" },
        ] },
        { key: "operator", label: "Operateurs", options: [
          { value: "FLOOZ", label: "Flooz" },
          { value: "TMONEY", label: "T-Money" },
          { value: "WAVE", label: "Wave" },
          { value: "MTN", label: "MTN" },
          { value: "ORANGE", label: "Orange" },
        ] },
        { key: "status", label: "Statuts", options: [
          { value: "PENDING", label: "En attente" },
          { value: "CONFIRMED", label: "Confirmee" },
          { value: "FAILED", label: "Echouee" },
          { value: "REFUNDED", label: "Remboursee" },
        ] },
      ]}
      sortOptions={[
        { value: "happenedAt", label: "Date" },
        { value: "amount", label: "Montant" },
      ]}
      stats={[
        { key: "inflow", label: "Flux entrant", format: "currency" },
        { key: "outflow", label: "Flux sortant", format: "currency" },
        { key: "fees", label: "Frais cumules", format: "currency" },
      ]}
      defaultValues={{ direction: "IN", operator: "WAVE", status: "PENDING", fees: 0 }}
    />
  );
}
