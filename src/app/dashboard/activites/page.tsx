"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function ActivitesPage() {
  return (
    <ModuleCrudPage
      title="Multi-activites et Projets"
      subtitle="Pilotage par branche avec budgets et statuts consolides."
      endpoint="/api/activites"
      singularLabel="activite"
      searchPlaceholder="Rechercher une activite"
      fields={[
        { key: "name", label: "Nom activite", type: "text", required: true },
        { key: "type", label: "Type", type: "text" },
        { key: "monthlyBudget", label: "Budget mensuel", type: "number", required: true },
        { key: "status", label: "Statut", type: "select", required: true, options: [
          { value: "ACTIVE", label: "Active" },
          { value: "PAUSED", label: "En pause" },
          { value: "CLOSED", label: "Fermee" },
        ] },
      ]}
      columns={[
        { key: "name", label: "Activite" },
        { key: "type", label: "Type" },
        { key: "status", label: "Statut", type: "badge" },
        { key: "monthlyBudget", label: "Budget", type: "currency" },
        { key: "createdAt", label: "Creation", type: "date" },
      ]}
      filters={[
        { key: "status", label: "Statuts", options: [
          { value: "ACTIVE", label: "Active" },
          { value: "PAUSED", label: "En pause" },
          { value: "CLOSED", label: "Fermee" },
        ] },
      ]}
      sortOptions={[
        { value: "createdAt", label: "Date creation" },
      ]}
      stats={[
        { key: "activeActivities", label: "Activites actives", format: "number" },
        { key: "totalBudget", label: "Budget total", format: "currency" },
        { key: "totalTransfers", label: "Transferts cumules", format: "currency" },
      ]}
      defaultValues={{ status: "ACTIVE", monthlyBudget: 0 }}
    />
  );
}
