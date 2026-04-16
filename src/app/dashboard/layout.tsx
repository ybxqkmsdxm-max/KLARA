"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  AlertTriangle,
  CircleDollarSign,
  Clock,
  Sparkles,
  Moon,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandPalette, CommandPaletteTrigger } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";

const navItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/dashboard/factures", label: "Factures", icon: FileText, badge: "3" },
  { href: "/dashboard/devis", label: "Devis", icon: ClipboardList },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/depenses", label: "Dépenses", icon: Wallet },
  { href: "/dashboard/rapports", label: "Rapports", icon: BarChart3 },
  { href: "/dashboard/parametres", label: "Paramètres", icon: Settings },
];

const mobileNavItems = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/dashboard/factures", label: "Factures", icon: FileText },
  { href: "/dashboard/devis", label: "Devis", icon: ClipboardList },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/depenses", label: "Dépenses", icon: Wallet },
];

const notifications = [
  {
    id: "1",
    message: "Facture FAC-2024-002 est en retard depuis 7 jours",
    time: "Il y a 2h",
    color: "#FF6B6B",
    icon: AlertTriangle,
  },
  {
    id: "2",
    message: "Nouveau paiement reçu : 2 065 000 FCFA",
    time: "Il y a 5h",
    color: "#00D4AA",
    icon: CircleDollarSign,
  },
  {
    id: "3",
    message: "Rappel : DEV-2024-002 expire dans 3 jours",
    time: "Il y a 1j",
    color: "#FFB347",
    icon: Clock,
  },
  {
    id: "4",
    message: "Bienvenue sur Klara ! Configurez votre entreprise",
    time: "Il y a 3j",
    color: "#3B82F6",
    icon: Sparkles,
  },
];

const unreadCount = notifications.length;

function NotificationItem({ notification }: { notification: typeof notifications[0] }) {
  const Icon = notification.icon;
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors relative"
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
        style={{ backgroundColor: notification.color }}
      />
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${notification.color}15` }}
      >
        <Icon className="h-4 w-4" style={{ color: notification.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
      </div>
    </div>
  );
}

function NotificationBellDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-[#FF6B6B] text-[10px] font-bold text-white border-2 border-background">
            {unreadCount}
          </span>
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <DropdownMenuLabel className="px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]">
            {unreadCount}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-80">
          {notifications.map((n) => (
            <DropdownMenuItem key={n.id} className="p-0 cursor-pointer focus:bg-muted/50">
              <NotificationItem notification={n} />
            </DropdownMenuItem>
          ))}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="p-0">
          <Link href="/dashboard/notifications" className="w-full px-4 py-2.5 text-sm font-medium text-[#00D4AA] hover:text-[#00C19C] text-center transition-colors">
            Voir toutes les notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NotificationBellSheet() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-[#FF6B6B] text-[10px] font-bold text-white border-2 border-background">
            {unreadCount}
          </span>
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[340px] p-0">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-bold bg-[#FF6B6B] text-white hover:bg-[#FF6B6B]">
              {unreadCount}
            </Badge>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="divide-y divide-border">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Tableau de bord";
  if (pathname.startsWith("/dashboard/factures/nouvelle")) return "Nouvelle facture";
  if (pathname.startsWith("/dashboard/factures")) return "Factures";
  if (pathname.startsWith("/dashboard/devis/nouveau")) return "Nouveau devis";
  if (pathname.startsWith("/dashboard/devis")) return "Devis";
  if (pathname.startsWith("/dashboard/clients")) return "Clients";
  if (pathname.startsWith("/dashboard/depenses")) return "Dépenses";
  if (pathname.startsWith("/dashboard/rapports")) return "Rapports";
  if (pathname.startsWith("/dashboard/parametres")) return "Paramètres";
  return "Klara";
}

function NavContent({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        return collapsed ? (
          <TooltipProvider key={item.href} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center justify-center h-10 rounded-lg transition-all relative",
                    isActive
                      ? "bg-[#00D4AA]/10 text-[#00D4AA]"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00D4AA] rounded-r-full transition-all duration-200" />
                  )}
                  <Icon className={cn("h-5 w-5", isActive ? "text-[#00D4AA]" : "text-muted-foreground")} />
                  {item.badge && (
                    <span className={cn("absolute -bottom-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold", isActive ? "bg-[#00D4AA] text-white" : "bg-muted text-muted-foreground")}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
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
              "flex items-center gap-3 h-10 px-3 rounded-lg transition-all relative",
              isActive
                ? "bg-[#00D4AA]/10 text-[#00D4AA]"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {isActive && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#00D4AA] rounded-r-full transition-all duration-200" />
            )}
            <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-[#00D4AA]" : "text-muted-foreground")} />
            <span className="text-sm font-medium truncate">{item.label}</span>
            {item.badge && (
              <Badge
                variant="secondary"
                className={cn("ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold", isActive ? "bg-[#00D4AA] text-white hover:bg-[#00D4AA]" : "bg-muted text-muted-foreground")}
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  const handleMobileNav = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <TooltipProvider>
      <CommandPalette />
      <div className="min-h-screen flex bg-muted/30">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 bg-background border-r border-border transition-all duration-300",
            collapsed ? "w-[72px]" : "w-[260px]"
          )}
        >
          {/* Logo */}
          <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
            {collapsed ? (
              <Link href="/dashboard" className="mx-auto">
                <div className="h-9 w-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
              </Link>
            ) : (
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="text-lg font-bold text-foreground tracking-tight">
                  Klara
                </span>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <NavContent pathname={pathname} collapsed={collapsed} />
          </div>

          {/* Collapse toggle */}
          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "w-full justify-center",
                !collapsed && "justify-start"
              )}
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  collapsed && "rotate-180"
                )}
              />
              {!collapsed && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Réduire
                </span>
              )}
            </Button>
          </div>

          {/* User profile */}
          {!collapsed && (
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#1A1A2E] text-white text-xs font-bold">
                    AM
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Aminata Mensah</p>
                  <Badge
                    variant="secondary"
                    className="mt-0.5 text-[10px] font-bold bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-[#00D4AA]/10"
                  >
                    BUSINESS
                  </Badge>
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="border-t border-border p-3 flex justify-center">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#1A1A2E] text-white text-xs font-bold">
                  AM
                </AvatarFallback>
              </Avatar>
            </div>
          )}
        </aside>

        {/* Mobile sidebar via Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <Link
                href="/dashboard"
                onClick={handleMobileNav}
                className="flex items-center gap-2.5"
              >
                <div className="h-9 w-9 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="text-lg font-bold text-foreground tracking-tight">
                  Klara
                </span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavContent pathname={pathname} collapsed={false} onNavigate={handleMobileNav} />
            <div className="border-t border-border p-4 mt-auto">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#1A1A2E] text-white text-xs font-bold">
                    AM
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Aminata Mensah</p>
                  <Badge
                    variant="secondary"
                    className="mt-0.5 text-[10px] font-bold bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-[#00D4AA]/10"
                  >
                    BUSINESS
                  </Badge>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main
          className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300",
            collapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
          )}
        >
          {/* Sticky header */}
          <header className="h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden h-9 w-9"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              {/* Mobile logo */}
              <Link href="/dashboard" className="lg:hidden">
                <div className="h-8 w-8 rounded-lg bg-[#1A1A2E] flex items-center justify-center">
                  <span className="text-white font-bold text-xs">K</span>
                </div>
              </Link>
              {/* Page title */}
              <h1 className="text-lg font-semibold text-foreground hidden sm:block">
                {pageTitle}
              </h1>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
              {/* Search command palette trigger */}
              <CommandPaletteTrigger className="h-8 w-8 sm:h-9 sm:w-9" />
              {/* Notification bell - mobile (Sheet) */}
              <div className="lg:hidden">
                <NotificationBellSheet />
              </div>
              {/* Notification bell - desktop (Dropdown) */}
              <div className="hidden lg:block">
                <NotificationBellDropdown />
              </div>
              {/* Theme toggle */}
              <ThemeToggle />
              {/* Nova facture button */}
              <Button
                asChild
                size="sm"
                className="bg-[#00D4AA] hover:bg-[#00C19C] text-white text-sm font-medium"
              >
                <Link href="/dashboard/factures/nouvelle">
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Nouvelle facture</span>
                </Link>
              </Button>
              {/* Avatar */}
              <Avatar className="h-8 w-8 sm:hidden">
                <AvatarFallback className="bg-[#1A1A2E] text-white text-[10px] font-bold">
                  AM
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Page content */}
          <div className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6" style={{ paddingBottom: 'max(6rem, calc(5rem + env(safe-area-inset-bottom, 0px)))' }}>
            <PageTransition>{children}</PageTransition>
          </div>

          {/* Mobile bottom navigation */}
          <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16 px-2">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 active:scale-95 relative",
                      isActive ? "text-[#00D4AA]" : "text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 transition-transform duration-200", isActive ? "text-[#00D4AA] scale-110" : "text-muted-foreground")} />
                    <span className={cn("text-[10px] font-medium transition-colors", isActive && "text-[#00D4AA]")}>{item.label}</span>
                    {isActive && (
                      <span className="absolute top-0 w-8 h-0.5 bg-[#00D4AA] rounded-b-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </main>
      </div>
    </TooltipProvider>
  );
}
