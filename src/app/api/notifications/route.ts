import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";

type NotificationItem = {
  id: string;
  type: "invoice_overdue" | "payment_received" | "quote_expiring" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, string>;
};

const readStateByOrg = new Map<string, Set<string>>();
const deletedStateByOrg = new Map<string, Set<string>>();

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

function markRead(orgId: string, id: string) {
  const current = readStateByOrg.get(orgId) ?? new Set<string>();
  current.add(id);
  readStateByOrg.set(orgId, current);
}

function isRead(orgId: string, id: string) {
  return (readStateByOrg.get(orgId) ?? new Set<string>()).has(id);
}

function markDeleted(orgId: string, id: string) {
  const current = deletedStateByOrg.get(orgId) ?? new Set<string>();
  current.add(id);
  deletedStateByOrg.set(orgId, current);
}

function isDeleted(orgId: string, id: string) {
  return (deletedStateByOrg.get(orgId) ?? new Set<string>()).has(id);
}

async function buildNotifications(organizationId: string): Promise<NotificationItem[]> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [organization, overdueInvoices, recentPayments, expiringQuotes] = await Promise.all([
    db.organization.findUnique({ where: { id: organizationId } }),
    db.invoice.findMany({
      where: {
        organizationId,
        status: { in: ["ENVOYEE", "EN_RETARD"] },
        dueDate: { lt: now },
      },
      include: { client: true },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    db.payment.findMany({
      where: {
        organizationId,
        status: { in: ["CONFIRME", "CONFIRMED"] },
      },
      include: { invoice: true },
      orderBy: { paidAt: "desc" },
      take: 5,
    }),
    db.quote.findMany({
      where: {
        organizationId,
        status: "ENVOYE",
        expiryDate: { gte: now, lte: in7Days },
      },
      include: { client: true },
      orderBy: { expiryDate: "asc" },
      take: 5,
    }),
  ]);

  const notifications: NotificationItem[] = [];

  const isConfigurationIncomplete = !organization?.address || !organization?.phone || !organization?.taxNumber;
  if (isConfigurationIncomplete) {
    notifications.push({
      id: "system:setup-company",
      type: "system",
      title: "Configuration recommandee",
      message: "Bienvenue sur Klara ! Configurez votre entreprise dans Parametres.",
      read: false,
      createdAt: organization?.createdAt.toISOString() ?? now.toISOString(),
      metadata: { href: "/dashboard/parametres" },
    });
  }

  for (const invoice of overdueInvoices) {
    const daysLate = Math.max(1, Math.floor((now.getTime() - invoice.dueDate.getTime()) / 86400000));
    notifications.push({
      id: `invoice_overdue:${invoice.id}`,
      type: "invoice_overdue",
      title: "Facture en retard",
      message: `${invoice.number} de ${invoice.client.name} est en retard depuis ${daysLate} jour${daysLate > 1 ? "s" : ""}`,
      read: false,
      createdAt: invoice.updatedAt.toISOString(),
      metadata: { invoiceId: invoice.id, clientId: invoice.clientId },
    });
  }

  for (const payment of recentPayments) {
    notifications.push({
      id: `payment_received:${payment.id}`,
      type: "payment_received",
      title: "Paiement recu",
      message: `${payment.amount.toLocaleString("fr-FR")} FCFA recus pour la facture ${payment.invoice.number}`,
      read: false,
      createdAt: payment.paidAt.toISOString(),
      metadata: { invoiceId: payment.invoiceId },
    });
  }

  for (const quote of expiringQuotes) {
    const daysLeft = Math.max(0, Math.ceil((quote.expiryDate.getTime() - now.getTime()) / 86400000));
    notifications.push({
      id: `quote_expiring:${quote.id}`,
      type: "quote_expiring",
      title: "Devis expire bientot",
      message: `${quote.number} pour ${quote.client.name} expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`,
      read: false,
      createdAt: quote.updatedAt.toISOString(),
      metadata: { quoteId: quote.id, clientId: quote.clientId },
    });
  }

  return notifications
    .filter((n) => !isDeleted(organizationId, n.id))
    .map((n) => ({ ...n, read: isRead(organizationId, n.id) }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function GET(request: Request) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Number(searchParams.get("limit") || "0");

  const allNotifications = await buildNotifications(organizationId!);
  let filtered = [...allNotifications];
  if (unreadOnly) filtered = filtered.filter((n) => !n.read);
  if (limit > 0) filtered = filtered.slice(0, limit);

  const formatted = filtered.map((n) => ({ ...n, relativeTime: getRelativeTime(n.createdAt) }));

  return NextResponse.json({
    notifications: formatted,
    total: allNotifications.length,
    unreadCount: allNotifications.filter((n) => !n.read).length,
  });
}

export async function PATCH(request: Request) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const orgId = organizationId!;

  if (body.action === "markAllRead") {
    const all = await buildNotifications(orgId);
    all.forEach((n) => markRead(orgId, n.id));
    return NextResponse.json({ success: true });
  }

  if (body.notificationId) {
    if (body.read === false) {
      const current = readStateByOrg.get(orgId) ?? new Set<string>();
      current.delete(body.notificationId);
      readStateByOrg.set(orgId, current);
    } else {
      markRead(orgId, body.notificationId);
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const { error, organizationId } = await getAuthSession();
  if (error) return error;

  const body = await request.json();
  const orgId = organizationId!;
  const all = await buildNotifications(orgId);
  if (all.some((n) => n.id === body.notificationId)) {
    markDeleted(orgId, body.notificationId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Notification not found" }, { status: 404 });
}
