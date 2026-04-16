import { NextResponse } from "next/server";

const notifications = [
  { id: "n1", type: "invoice_overdue", title: "Facture en retard", message: "FAC-2024-002 de J-P. Agbéko est en retard depuis 7 jours", read: false, createdAt: "2024-03-15T10:30:00Z", metadata: { invoiceId: "inv_002", clientId: "client_003" } },
  { id: "n2", type: "payment_received", title: "Paiement reçu", message: "2 065 000 FCFA de Togo Télécom via Mobile Money", read: false, createdAt: "2024-03-15T08:15:00Z", metadata: { invoiceId: "inv_004", clientId: "client_001" } },
  { id: "n3", type: "quote_expiring", title: "Devis expire bientôt", message: "DEV-2024-002 pour Restaurant Chez Maman expire dans 3 jours", read: false, createdAt: "2024-03-14T14:00:00Z", metadata: { quoteId: "quote_002", clientId: "client_002" } },
  { id: "n4", type: "system", title: "Bienvenue sur Klara !", message: "Configurez votre entreprise pour commencer à utiliser Klara", read: false, createdAt: "2024-03-14T09:00:00Z" },
  { id: "n5", type: "reminder", title: "Relance automatique", message: "Rappel J+15 envoyé à J-P. Agbéko pour FAC-2024-002", read: false, createdAt: "2024-03-13T16:00:00Z", metadata: { invoiceId: "inv_002", clientId: "client_003" } },
  { id: "n6", type: "payment_received", title: "Paiement partiel reçu", message: "150 000 FCFA de Chez Maman sur FAC-2024-003", read: false, createdAt: "2024-03-13T11:30:00Z", metadata: { invoiceId: "inv_003", clientId: "client_002" } },
  { id: "n7", type: "invoice_overdue", title: "Facture en retard", message: "FAC-2024-001 de Cyber Café Digital est en retard depuis 3 jours", read: true, createdAt: "2024-03-12T10:00:00Z", metadata: { invoiceId: "inv_001", clientId: "client_005" } },
  { id: "n8", type: "system", title: "Mise à jour disponible", message: "Klara v2.1 est disponible avec de nouvelles fonctionnalités", read: true, createdAt: "2024-03-11T08:00:00Z" },
  { id: "n9", type: "quote_expiring", title: "Devis expiré", message: "DEV-2024-001 pour Togo Télécom a expiré le 10 mars", read: true, createdAt: "2024-03-10T00:00:00Z", metadata: { quoteId: "quote_001", clientId: "client_001" } },
  { id: "n10", type: "reminder", title: "Relance automatique", message: "Rappel J+7 envoyé à J-P. Agbéko pour FAC-2024-002", read: true, createdAt: "2024-03-09T16:00:00Z", metadata: { invoiceId: "inv_002", clientId: "client_003" } },
  { id: "n11", type: "payment_received", title: "Paiement reçu", message: "250 000 FCFA de Prestataire IT Services", read: true, createdAt: "2024-03-08T14:30:00Z", metadata: { invoiceId: "inv_005", clientId: "client_004" } },
  { id: "n12", type: "system", title: "Rapport hebdomadaire", message: "Votre rapport hebdomadaire est prêt : 3 factures envoyées, 1 450 000 FCFA encaissé", read: true, createdAt: "2024-03-07T07:00:00Z" },
  { id: "n13", type: "invoice_overdue", title: "Facture payée", message: "FAC-2024-004 de Togo Télécom a été payée intégralement", read: true, createdAt: "2024-03-06T09:00:00Z", metadata: { invoiceId: "inv_004", clientId: "client_001" } },
  { id: "n14", type: "reminder", title: "Nouveau client ajouté", message: "Société Togo Télécom a été ajouté à vos contacts", read: true, createdAt: "2024-03-05T11:00:00Z", metadata: { clientId: "client_001" } },
  { id: "n15", type: "system", title: "Configuration terminée", message: "Votre entreprise a été configurée avec succès", read: true, createdAt: "2024-03-04T10:00:00Z" },
];

function getRelativeTime(dateStr: string): string {
  const now = new Date("2024-03-15T12:00:00Z");
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return `Il y a ${Math.floor(diffDays / 7)} sem`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  let filtered = [...notifications];
  if (unreadOnly) {
    filtered = filtered.filter((n) => !n.read);
  }

  const formatted = filtered.map((n) => ({
    ...n,
    relativeTime: getRelativeTime(n.createdAt),
  }));

  return NextResponse.json({
    notifications: formatted,
    total: notifications.length,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}

export async function PATCH(request: Request) {
  const body = await request.json();

  if (body.action === "markAllRead") {
    notifications.forEach((n) => (n.read = true));
    return NextResponse.json({ success: true });
  }

  if (body.notificationId) {
    const notif = notifications.find((n) => n.id === body.notificationId);
    if (notif) {
      notif.read = body.read !== undefined ? body.read : true;
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const idx = notifications.findIndex((n) => n.id === body.notificationId);
  if (idx !== -1) {
    notifications.splice(idx, 1);
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Notification not found" }, { status: 404 });
}
