import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";

const notifications = [
  { id: "n1", type: "invoice_overdue", title: "Facture en retard", message: "FAC-2024-002 de J-P. Agbeko est en retard depuis 7 jours", read: false, createdAt: "2024-03-15T10:30:00Z", metadata: { invoiceId: "inv_002", clientId: "client_003" } },
  { id: "n2", type: "payment_received", title: "Paiement recu", message: "2 065 000 FCFA de Togo Telecom via Mobile Money", read: false, createdAt: "2024-03-15T08:15:00Z", metadata: { invoiceId: "inv_004", clientId: "client_001" } },
  { id: "n3", type: "quote_expiring", title: "Devis expire bientot", message: "DEV-2024-002 pour Restaurant Chez Maman expire dans 3 jours", read: false, createdAt: "2024-03-14T14:00:00Z", metadata: { quoteId: "quote_002", clientId: "client_002" } },
];

function getRelativeTime(dateStr: string): string {
  const now = new Date();
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
  const { error } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";

  let filtered = [...notifications];
  if (unreadOnly) filtered = filtered.filter((n) => !n.read);

  const formatted = filtered.map((n) => ({ ...n, relativeTime: getRelativeTime(n.createdAt) }));

  return NextResponse.json({
    notifications: formatted,
    total: notifications.length,
    unreadCount: notifications.filter((n) => !n.read).length,
  });
}

export async function PATCH(request: Request) {
  const { error } = await getAuthSession();
  if (error) return error;

  const body = await request.json();

  if (body.action === "markAllRead") {
    notifications.forEach((n) => (n.read = true));
    return NextResponse.json({ success: true });
  }

  if (body.notificationId) {
    const notif = notifications.find((n) => n.id === body.notificationId);
    if (notif) notif.read = body.read !== undefined ? body.read : true;
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const { error } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const idx = notifications.findIndex((n) => n.id === body.notificationId);
  if (idx !== -1) {
    notifications.splice(idx, 1);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Notification not found" }, { status: 404 });
}
