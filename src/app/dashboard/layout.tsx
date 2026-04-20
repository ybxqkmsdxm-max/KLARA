"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  Users,
  Wallet,
  BarChart3,
  Settings,
  Menu,
  Plus,
  ChevronLeft,
  X,
  Bell,
  LogOut,
  AlertTriangle,
  CircleDollarSign,
  Clock,
  Sparkles,
  Moon,
  Sun,
  Wrench,
  HandCoins,
  Briefcase,
  Package,
  ShoppingCart,
  Calculator,
  CreditCard,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette, CommandPaletteTrigger } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";
import DashboardAuthGuard from "@/components/dashboard-auth-guard";

/* ============================================================
   NAVIGATION CONFIG
   ============================================================ */
const navSections = [
  {
    title: "Opérations",
    items: [
      { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { href: "/dashboard/caisse", label: "Caisse", icon: HandCoins },
      { href: "/dashboard/paiements", label: "Paiements", icon: CreditCard },
      { href: "/dashboard/ventes", label: "Ventes POS", icon: Briefcase },
      { href: "/dashboard/factures", label: "Factures", icon: FileText, badge: "3" },
      { href: "/dashboard/devis", label: "Devis", icon: ClipboardList },
      { href: "/dashboard/clients", label: "Clients", icon: Users },
      { href: "/dashboard/depenses", label: "Dépenses", icon: Wallet },
    ],
  },
  {
    title: "Gestion",
    items: [
      { href: "/dashboard/stocks", label: "Stocks", icon: Package },
      { href: "/dashboard/achats", label: "Achats", icon: ShoppingCart },
      { href: "/dashboard/paie", label: "Paie RH", icon: Users },
      { href: "/dashboard/fiscalite", label: "Fiscalité", icon: Calculator },
    ],
  },
  {
    title: "Pilotage",
    items: [
      { href: "/dashboard/credit", label: "Crédit", icon: HandCoins },
      { href: "/dashboard/activites", label: "Multi-activités", icon: Wrench },
      { href: "/dashboard/outils", label: "Outils", icon: Wrench },
      { href: "/dashboard/rapports", label: "Rapports", icon: BarChart3 },
      { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
    ],
  },
];

const navItems = navSections.flatMap((section) => section.items);

const mobileNavItems = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/dashboard/caisse", label: "Caisse", icon: HandCoins },
  { href: "/dashboard/ventes", label: "Ventes", icon: Briefcase },
  { href: "/dashboard/factures", label: "Factures", icon: FileText },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
];

const notifications = [
  { id: "1", message: "Facture FAC-2024-002 est en retard depuis 7 jours", time: "Il y a 2h", color: "#F43F5E", icon: AlertTriangle },
  { id: "2", message: "Nouveau paiement reçu : 2 065 000 FCFA", time: "Il y a 5h", color: "#10B981", icon: CircleDollarSign },
  { id: "3", message: "Rappel : DEV-2024-002 expire dans 3 jours", time: "Il y a 1j", color: "#F59E0B", icon: Clock },
  { id: "4", message: "Bienvenue sur Klara ! Configurez votre entreprise", time: "Il y a 3j", color: "#0EA5E9", icon: Sparkles },
];

const unreadCount = notifications.length;

/* ============================================================
   THEME TOGGLE
   ============================================================ */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] rounded-lg transition-all"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

/* ============================================================
   NOTIFICATION COMPONENTS
   ============================================================ */
function NotificationItem({ notification }: { notification: typeof notifications[0] }) {
  const Icon = notification.icon;
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] transition-colors relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full" style={{ backgroundColor: notification.color }} />
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${notification.color}15` }}>
        <Icon className="h-4 w-4" style={{ color: notification.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug text-[#0F172A] dark:text-[#F8FAFC]">{notification.message}</p>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">{notification.time}</p>
      </div>
    </div>
  );
}

function NotificationBellDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] rounded-lg transition-all">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute -top-0.5 -right-0.5 h-4.5 min-w-4.5 px-1 flex items-center justify-center rounded-full bg-[#F43F5E] text-[10px] font-bold text-white border-2 border-white dark:border-[#0F172A]">
            {unreadCount}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl border-[#E2E8F0] dark:border-[#334155] shadow-xl">
        <DropdownMenuLabel className="px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-sm">Notifications</span>
          <Badge className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-[#F43F5E] text-white hover:bg-[#F43F5E] rounded-full">
            {unreadCount}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#E2E8F0] dark:bg-[#334155]" />
        <ScrollArea className="max-h-80">
          {notifications.map((n) => (
            <DropdownMenuItem key={n.id} className="p-0 cursor-pointer focus:bg-[#F8FAFC] dark:focus:bg-[#1E293B]">
              <NotificationItem notification={n} />
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator className="bg-[#E2E8F0] dark:bg-[#334155]" />
        <DropdownMenuItem asChild className="p-0">
          <Link href="/dashboard/notifications" className="w-full px-4 py-2.5 text-sm font-medium text-[#10B981] hover:text-[#059669] text-center transition-colors">
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ============================================================
   PAGE TITLE HELPER
   ============================================================ */
function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Tableau de bord";
  if (pathname.startsWith("/dashboard/caisse")) return "Caisse";
  if (pathname.startsWith("/dashboard/paiements")) return "Paiements Mobile Money";
  if (pathname.startsWith("/dashboard/ventes")) return "Ventes POS";
  if (pathname.startsWith("/dashboard/factures/nouvelle")) return "Nouvelle facture";
  if (pathname.startsWith("/dashboard/factures")) return "Factures";
  if (pathname.startsWith("/dashboard/devis/nouveau")) return "Nouveau devis";
  if (pathname.startsWith("/dashboard/devis")) return "Devis";
  if (pathname.startsWith("/dashboard/clients")) return "Clients";
  if (pathname.startsWith("/dashboard/stocks")) return "Stocks";
  if (pathname.startsWith("/dashboard/achats")) return "Achats";
  if (pathname.startsWith("/dashboard/depenses")) return "Dépenses";
  if (pathname.startsWith("/dashboard/paie")) return "Paie RH";
  if (pathname.startsWith("/dashboard/fiscalite")) return "Fiscalité";
  if (pathname.startsWith("/dashboard/credit")) return "Crédit";
  if (pathname.startsWith("/dashboard/activites")) return "Multi-activités";
  if (pathname.startsWith("/dashboard/outils")) return "Outils";
  if (pathname.startsWith("/dashboard/rapports")) return "Rapports";
  if (pathname.startsWith("/dashboard/notifications")) return "Notifications";
  if (pathname.startsWith("/dashboard/parametres")) return "Paramètres";
  return "Klara";
}

/* ============================================================
   NAV CONTENT
   ============================================================ */
function NavContent({ pathname, collapsed, onNavigate }: { pathname: string; collapsed: boolean; onNavigate?: () => void }) {
  const sections = collapsed ? [{ title: "", items: navItems }] : navSections;

  return (
    <nav className="flex flex-col gap-2 px-3 py-4">
      {sections.map((section) => (
        <div key={section.title || "all"} className="flex flex-col gap-0.5">
          {!collapsed && (
            <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return collapsed ? (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center justify-center h-10 rounded-xl transition-all duration-150 relative",
                        isActive
                          ? "bg-[#ECFDF5] dark:bg-[#10B981]/15 text-[#059669] dark:text-[#34D399]"
                          : "text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]"
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#10B981] rounded-r-full" />
                      )}
                      <Icon className={cn("h-[18px] w-[18px]", isActive ? "text-[#10B981]" : "")} />
                      {item.badge && (
                        <span className={cn("absolute -bottom-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold", isActive ? "bg-[#10B981] text-white" : "bg-[#F1F5F9] text-[#64748B]")}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium text-xs rounded-lg">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "ui-nav-item flex items-center gap-3 h-10 px-3 text-sm font-medium transition-all duration-150 relative",
                  isActive
                    ? "is-active text-[#059669] dark:text-[#34D399] font-semibold"
                    : "text-[#64748B] hover:text-[#0F172A] dark:hover:text-white"
                )}
              >
                <Icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#10B981]" : "")} />
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <Badge className={cn("ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold rounded-full", isActive ? "bg-[#10B981] text-white hover:bg-[#10B981]" : "bg-[#F1F5F9] text-[#64748B]")}>
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/* ============================================================
   MAIN LAYOUT
   ============================================================ */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  const userName = session?.user?.name || session?.user?.email || "Utilisateur";
  const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const userPlan = (session as any)?.user?.plan || "STARTER";

  const handleMobileNav = useCallback(() => setMobileOpen(false), []);

  return (
    <DashboardAuthGuard>
      <TooltipProvider>
        <CommandPalette />
        <div className="ui-shell min-h-screen flex bg-[#F8FAFC] dark:bg-[#020617]">
          {/* Desktop Sidebar */}
          <aside
            className={cn(
              "ui-sidebar hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 bg-[#FAFBFC] dark:bg-[#0D0D14] transition-all duration-300",
              collapsed ? "w-[72px]" : "w-[260px]"
            )}
          >
            {/* Logo */}
            <div className="h-16 flex items-center px-4 border-b border-[#E2E8F0] dark:border-[#334155] shrink-0">
              {collapsed ? (
                <Link href="/dashboard" className="mx-auto">
                  <div className="h-9 w-9 rounded-lg bg-[#0F172A] dark:bg-white flex items-center justify-center">
                    <span className="text-white dark:text-[#0F172A] font-bold text-sm" style={{ fontFamily: "var(--font-plus-jakarta)" }}>K</span>
                  </div>
                </Link>
              ) : (
                <Link href="/dashboard" className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-[#0F172A] dark:bg-white flex items-center justify-center">
                    <span className="text-white dark:text-[#0F172A] font-bold text-sm" style={{ fontFamily: "var(--font-plus-jakarta)" }}>K</span>
                  </div>
                  <span className="text-lg font-bold text-[#0F172A] dark:text-white tracking-tight" style={{ fontFamily: "var(--font-plus-jakarta)" }}>Klara</span>
                </Link>
              )}
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2">
              <NavContent pathname={pathname} collapsed={collapsed} />
            </div>

            {/* Collapse toggle */}
            <div className="border-t border-[#E2E8F0] dark:border-[#334155] p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("w-full justify-center text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B] rounded-lg h-9", !collapsed && "justify-start")}
              >
                <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
                {!collapsed && <span className="ml-2 text-xs text-[#94A3B8]">Réduire</span>}
              </Button>
            </div>

            {/* User profile */}
            {!collapsed && (
              <div className="border-t border-[#E2E8F0] dark:border-[#334155] p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[#0F172A] dark:bg-[#10B981] text-white text-xs font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">{userName}</p>
                    <Badge className="mt-0.5 text-[10px] font-bold bg-[#ECFDF5] dark:bg-[#10B981]/15 text-[#059669] dark:text-[#34D399] hover:bg-[#ECFDF5] rounded-full px-2">
                      {userPlan}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="border-t border-[#E2E8F0] dark:border-[#334155] p-3 flex justify-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#0F172A] dark:bg-[#10B981] text-white text-xs font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}
          </aside>

          {/* Mobile sidebar via Sheet */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[280px] p-0 bg-[#FAFBFC] dark:bg-[#0D0D14] border-r border-[#E2E8F0] dark:border-[#334155]">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu de navigation</SheetTitle>
              </SheetHeader>
              <div className="h-16 flex items-center justify-between px-4 border-b border-[#E2E8F0] dark:border-[#334155]">
                <Link href="/dashboard" onClick={handleMobileNav} className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-lg bg-[#0F172A] dark:bg-white flex items-center justify-center">
                    <span className="text-white dark:text-[#0F172A] font-bold text-sm">K</span>
                  </div>
                  <span className="text-lg font-bold text-[#0F172A] dark:text-white tracking-tight">Klara</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="h-8 w-8 rounded-lg">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="px-2 py-2">
                <NavContent pathname={pathname} collapsed={false} onNavigate={handleMobileNav} />
              </div>
              <div className="border-t border-[#E2E8F0] dark:border-[#334155] p-4 mt-auto">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-[#0F172A] text-white text-xs font-bold">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{userName}</p>
                    <Badge className="mt-0.5 text-[10px] font-bold bg-[#ECFDF5] text-[#059669] hover:bg-[#ECFDF5] rounded-full px-2">{userPlan}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full mt-3 text-[#F43F5E] hover:text-[#BE123C] hover:bg-[#FFF1F2] rounded-lg" onClick={() => signOut({ callbackUrl: "/login" })}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Main content */}
          <main className={cn("flex-1 flex flex-col min-h-screen transition-all duration-300", collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]")}>
            {/* Sticky header */}
            <header className="ui-topbar h-16 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-lg" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5" />
                </Button>
                <Link href="/dashboard" className="lg:hidden">
                  <div className="h-8 w-8 rounded-lg bg-[#0F172A] dark:bg-white flex items-center justify-center">
                    <span className="text-white dark:text-[#0F172A] font-bold text-xs">K</span>
                  </div>
                </Link>
                <h1 className="text-base font-semibold text-[#0F172A] dark:text-white hidden sm:block">{pageTitle}</h1>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CommandPaletteTrigger className="h-9 w-9 rounded-lg" />
                <div className="hidden lg:block">
                  <NotificationBellDropdown />
                </div>
                <ThemeToggle />
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:shadow-glow text-white text-sm font-medium rounded-lg px-4"
                >
                  <Link href="/dashboard/factures/nouvelle">
                    <Plus className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Nouvelle facture</span>
                  </Link>
                </Button>
              </div>
            </header>

            {/* Page content */}
            <div className="ui-content flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
              <PageTransition>{children}</PageTransition>
            </div>

            {/* Mobile bottom navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-lg border-t border-[#E2E8F0] dark:border-[#334155]">
              <div className="flex items-center justify-around h-16 px-2">
                {mobileNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-95 relative rounded-xl mx-1",
                        isActive ? "text-[#10B981] bg-[#ECFDF5]/60 dark:bg-[#10B981]/10" : "text-[#64748B]"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110" : "")} />
                      <span className={cn("text-[10px] font-medium", isActive && "text-[#10B981]")}>{item.label}</span>
                      {isActive && <span className="absolute top-0 w-10 h-0.5 bg-[#10B981] rounded-b-full" />}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </main>
        </div>
      </TooltipProvider>
    </DashboardAuthGuard>
  );
}
