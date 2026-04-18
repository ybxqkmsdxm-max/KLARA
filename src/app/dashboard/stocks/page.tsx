"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function StocksPage() {
  return (
    <ModuleCrudPage
      title="Stocks et Inventaire"
      subtitle="Gestion des articles, seuils critiques et valorisation du stock."
      endpoint="/api/stocks"
      singularLabel="article"
      searchPlaceholder="Rechercher un article ou SKU"
      fields={[
        { key: "name", label: "Nom", type: "text", required: true },
        { key: "sku", label: "SKU", type: "text" },
        { key: "unit", label: "Unite", type: "text", required: true },
        { key: "purchasePrice", label: "Prix achat", type: "number", required: true },
        { key: "salePrice", label: "Prix vente", type: "number", required: true },
        { key: "quantity", label: "Quantite", type: "number", required: true },
        { key: "lowStockThreshold", label: "Seuil alerte", type: "number", required: true },
      ]}
      columns={[
        { key: "name", label: "Article" },
        { key: "sku", label: "SKU" },
        { key: "quantity", label: "Quantite" },
        { key: "purchasePrice", label: "Prix achat", type: "currency" },
        { key: "salePrice", label: "Prix vente", type: "currency" },
      ]}
      filters={[
        { key: "lowOnly", label: "Rupture", options: [
          { value: "true", label: "Stock bas uniquement" },
        ] },
      ]}
      sortOptions={[
        { value: "createdAt", label: "Plus recents" },
        { value: "quantity", label: "Quantite" },
      ]}
      stats={[
        { key: "totalItems", label: "Articles actifs", format: "number" },
        { key: "stockValue", label: "Valeur stock", format: "currency" },
        { key: "lowStockItems", label: "Articles en alerte", format: "number" },
      ]}
      defaultValues={{ unit: "u", purchasePrice: 0, salePrice: 0, quantity: 0, lowStockThreshold: 5 }}
    />
  );
}
