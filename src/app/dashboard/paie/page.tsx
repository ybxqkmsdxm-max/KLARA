"use client";

import { ModuleCrudPage } from "@/components/module-crud-page";

export default function PaiePage() {
  return (
    <ModuleCrudPage
      title="Paie et Ressources Humaines"
      subtitle="Gestion des employes actifs et masse salariale mensuelle."
      endpoint="/api/paie"
      singularLabel="employe"
      searchPlaceholder="Rechercher un employe, poste ou telephone"
      fields={[
        { key: "fullName", label: "Nom complet", type: "text", required: true },
        { key: "roleTitle", label: "Poste", type: "text" },
        { key: "phone", label: "Telephone", type: "text" },
        { key: "baseSalary", label: "Salaire de base", type: "number", required: true },
        { key: "status", label: "Statut", type: "select", required: true, options: [
          { value: "ACTIF", label: "Actif" },
          { value: "INACTIF", label: "Inactif" },
        ] },
      ]}
      columns={[
        { key: "fullName", label: "Employe" },
        { key: "roleTitle", label: "Poste" },
        { key: "status", label: "Statut", type: "badge" },
        { key: "baseSalary", label: "Salaire", type: "currency" },
        { key: "phone", label: "Telephone" },
      ]}
      filters={[
        { key: "status", label: "Statuts", options: [
          { value: "ACTIF", label: "Actif" },
          { value: "INACTIF", label: "Inactif" },
        ] },
      ]}
      sortOptions={[
        { value: "createdAt", label: "Plus recents" },
        { value: "baseSalary", label: "Salaire" },
      ]}
      stats={[
        { key: "activeEmployees", label: "Employes actifs", format: "number" },
        { key: "totalBasePayroll", label: "Masse salariale", format: "currency" },
      ]}
      defaultValues={{ status: "ACTIF", baseSalary: 0 }}
    />
  );
}
