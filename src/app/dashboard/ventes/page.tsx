"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function VentesPage() {
  return (
    <ModuleCrudPage
      title="Ventes et Point de Vente"
      subtitle="Tickets POS, encaissements et suivi des annulations/remboursements."
      endpoint="/api/ventes"
      singularLabel="vente"
      searchPlaceholder="Rechercher client ou numero de vente"
      fields={[
        { key: "clientName", label: "Client", type: "text" },
        { key: "status", label: "Statut", type: "select", required: true, options: [
          { value: "BROUILLON", label: "Brouillon" },
          { value: "CONFIRMEE", label: "Confirmee" },
          { value: "ANNULEE", label: "Annulee" },
          { value: "REMBOURSEE", label: "Remboursee" },
        ] },
        { key: "paymentMethod", label: "Paiement", type: "select", required: true, options: [
          { value: "ESPECES", label: "Especes" },
          { value: "MOBILE_MONEY", label: "Mobile Money" },
          { value: "VIREMENT", label: "Virement" },
          { value: "CARTE", label: "Carte" },
          { value: "CREDIT", label: "Credit" },
        ] },
        { key: "subtotalAmount", label: "Sous-total", type: "number", required: true },
        { key: "discountAmount", label: "Remise", type: "number", required: true },
        { key: "paidAmount", label: "Montant paye", type: "number" },
        { key: "soldAt", label: "Date vente", type: "date" },
        { key: "notes", label: "Notes", type: "textarea" },
      ]}
      columns={[
        { key: "saleNumber", label: "Numero" },
        { key: "clientName", label: "Client" },
        { key: "status", label: "Statut", type: "badge" },
        { key: "totalAmount", label: "Total", type: "currency" },
        { key: "paidAmount", label: "Encaisse", type: "currency" },
      ]}
      filters={[
        { key: "status", label: "Statuts", options: [
          { value: "BROUILLON", label: "Brouillon" },
          { value: "CONFIRMEE", label: "Confirmee" },
          { value: "ANNULEE", label: "Annulee" },
          { value: "REMBOURSEE", label: "Remboursee" },
        ] },
        { key: "paymentMethod", label: "Paiements", options: [
          { value: "ESPECES", label: "Especes" },
          { value: "MOBILE_MONEY", label: "Mobile Money" },
          { value: "VIREMENT", label: "Virement" },
          { value: "CARTE", label: "Carte" },
          { value: "CREDIT", label: "Credit" },
        ] },
      ]}
      sortOptions={[
        { value: "soldAt", label: "Date" },
        { value: "totalAmount", label: "Montant" },
      ]}
      stats={[
        { key: "totalVentes", label: "Ventes cumulees", format: "currency" },
        { key: "totalEncaisse", label: "Total encaisse", format: "currency" },
        { key: "cancelled", label: "Ventes annulees", format: "number" },
      ]}
      defaultValues={{ status: "CONFIRMEE", paymentMethod: "ESPECES", discountAmount: 0 }}
    />
  );
}
