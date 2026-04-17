"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CircleDollarSign,
  Clock,
  Sparkles,
  Bell,
  ArrowRight,
  FileText,
  CheckCheck,
  Trash2,
  Inbox,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relativeTime: string;
  metadata?: Record<string, string>;
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  invoice_overdue: { icon: AlertTriangle, color: "#FF6B6B", bgColor: "bg-red-50 dark:bg-red-500/10", label: "Factures" },
  payment_received: { icon: CircleDollarSign, color: "#00D4AA", bgColor: "bg-emerald-50 dark:bg-emerald-500/10", label: "Paiements" },
  quote_expiring: { icon: Clock, color: "#FFB347", bgColor: "bg-amber-50 dark:bg-amber-500/10", label: "Devis" },
  system: { icon: Sparkles, color: "#3B82F6", bgColor: "bg-blue-50 dark:bg-blue-500/10", label: "Système" },
  reminder: { icon: Bell, color: "#8B5CF6", bgColor: "bg-violet-50 dark:bg-violet-500/10", label: "Rappels" },
};

const filterTabs = [
  { value: "", label: "Tous" },
  { value: "non_lues", label: "Non lues" },
  { value: "invoice_overdue", label: "Factures" },
  { value: "payment_received", label: "Paiements" },
  { value: "quote_expiring", label: "Devis" },
  { value: "system", label: "Système" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const params = activeFilter === "non_lues" ? "?unread=true" : "";
      const res = await fetch(`/api/notifications${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      let notifs = data.notifications;
      if (activeFilter && activeFilter !== "non_lues") {
        notifs = notifs.filter((n: Notification) => n.type === activeFilter);
      }
      setNotifications(notifs);
      setUnreadCount(data.unreadCount);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id, read: true }),
    });
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification supprimée");
    await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success("Toutes les notifications marquées comme lues");
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markAllRead" }),
    });
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="rounded-xl bg-gradient-to-r from-[#1A1A2E] to-[#1A1A2E]/90 text-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-[#FFB347]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
              <p className="text-sm text-white/70 mt-0.5">
                Restez informé de votre activité
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Badge className="bg-[#FF6B6B] text-white hover:bg-[#FF6B6B] text-sm px-3 py-1">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-white/80 hover:text-white hover:bg-white/10 gap-1.5"
              >
                <CheckCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Tout marquer comme lu</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-none rounded-xl bg-muted/50 p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200",
              activeFilter === tab.value
                ? "bg-[#1A1A2E] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Notifications List */}
      {!loading && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type] || typeConfig.system;
            const Icon = config.icon;
            return (
              <div
                key={notification.id}
                className={cn(
                  "group relative rounded-xl border transition-all duration-200 hover:shadow-md",
                  notification.read
                    ? "bg-card border-border/50"
                    : "bg-card border-[#00D4AA]/20 shadow-sm"
                )}
              >
                {/* Unread indicator */}
                {!notification.read && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#00D4AA]" />
                )}
                <div className="flex items-start gap-3 p-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      config.bgColor
                    )}
                  >
                    <Icon className="h-5 w-5" style={{ color: config.color }} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={cn("text-sm", notification.read ? "font-medium" : "font-semibold")}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-[#00D4AA] shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1.5">{notification.relativeTime}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => markAsRead(notification.id)}
                        title="Marquer comme lu"
                      >
                        <CheckCheck className="h-4 w-4 text-muted-foreground hover:text-[#00D4AA]" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteNotification(notification.id)}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-[#FF6B6B]" />
                    </Button>
                  </div>
                </div>
                {/* Clickable link area */}
                {!notification.read && notification.metadata?.invoiceId && (
                  <Link
                    href={`/dashboard/factures/${notification.metadata.invoiceId}`}
                    className="absolute inset-0 rounded-xl"
                    onClick={() => markAsRead(notification.id)}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && notifications.length === 0 && (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center">
            <Inbox className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-semibold text-muted-foreground">
            {activeFilter ? "Aucune notification dans cette catégorie" : "Aucune notification"}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
            {activeFilter
              ? "Essayez de changer le filtre pour voir d'autres notifications."
              : "Vous êtes à jour ! Les nouvelles notifications apparaîtront ici."}
          </p>
          {activeFilter && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setActiveFilter("")}
            >
              <Filter className="h-4 w-4 mr-1.5" />
              Voir toutes les notifications
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
