"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Wallet,
  Clock,
  ArrowRight,
  Check,
  Star,
  Menu,
  X,
  ChevronDown,
  Zap,
  Shield,
  Users,
  BarChart3,
  Send,
  CreditCard,
  Building2,
  Globe,
  CircleDollarSign,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ============================================================
   SECTION: Navbar sticky
   ============================================================ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/90 backdrop-blur-lg shadow-sm border-b border-slate-100 dark:border-slate-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="#" className="flex items-center gap-1">
            <span className="text-2xl md:text-3xl font-extrabold text-[#1A1A2E] tracking-tight font-[var(--font-plus-jakarta)]">
              K
            </span>
            <span className="text-2xl md:text-3xl font-semibold text-[#00D4AA] tracking-tight font-[var(--font-plus-jakarta)]">
              lara
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#fonctionnalites"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              Fonctionnalités
            </a>
            <a
              href="#tarifs"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              Tarifs
            </a>
            <a
              href="#comment"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
            >
              Comment ça marche
            </a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Se connecter
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-[#00D4AA] hover:bg-[#00B894] text-[#1A1A2E] font-semibold text-sm px-6 rounded-full shadow-lg shadow-[#00D4AA]/20">
                Essai gratuit
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-lg animate-fade-in-up transition-all duration-300 ease-out">
          <div className="px-4 py-6 space-y-2">
            <a href="#fonctionnalites" className="block text-muted-foreground font-medium py-3 px-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              Fonctionnalités
            </a>
            <a href="#tarifs" className="block text-muted-foreground font-medium py-3 px-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              Tarifs
            </a>
            <a href="#comment" className="block text-muted-foreground font-medium py-3 px-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(false)}>
              Comment ça marche
            </a>
            <hr className="border-border" />
            <Button className="w-full bg-[#00D4AA] hover:bg-[#00B894] text-[#1A1A2E] font-semibold rounded-full">
              Essai gratuit
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ============================================================
   SECTION: Hero
   ============================================================ */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Fond décoratif */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00D4AA]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#1A1A2E]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#00D4AA]/5 to-transparent rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Colonne texte */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#00D4AA]/10 border border-[#00D4AA]/20 rounded-full px-3 py-1 sm:px-4 sm:py-1.5 mb-4 sm:mb-6 animate-fade-in-up">
              <span className="text-xs sm:text-sm">🇹🇬</span>
              <span className="text-xs sm:text-sm font-medium text-[#1A1A2E]">
                Fait pour les PME d&apos;Afrique de l&apos;Ouest
              </span>
            </div>

            {/* Titre */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-[#1A1A2E] leading-tight mb-6 sm:mb-8 font-[var(--font-plus-jakarta)] animate-fade-in-up" style={{ animationDelay: "0.1s", textShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              Gérez vos finances,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4AA] to-[#00B894]">
                faites{" "}
                <span
                  className="font-black"
                  style={{
                    background: "linear-gradient(135deg, #00D4AA 0%, #009B7D 40%, #00B894 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  grandir
                </span>{" "}
                votre business.
              </span>
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg md:text-2xl text-muted-foreground/90 mb-8 sm:mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              Klara simplifie la facturation, le suivi des dépenses et les relances clients
              pour les PME sans comptable. Payez et encaissez en Mobile Money.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-[#00D4AA] hover:bg-[#00B894] text-[#1A1A2E] font-bold text-base px-6 py-4 sm:px-8 sm:py-6 rounded-full shadow-xl shadow-[#00D4AA]/25 transition-all hover:shadow-2xl hover:shadow-[#00D4AA]/30 hover:scale-105"
                >
                  Commencer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-border text-foreground font-medium text-base px-6 py-4 sm:px-8 sm:py-6 rounded-full hover:bg-muted transition-all"
                >
                  Voir la démo
                </Button>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-8 sm:mt-10 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {["bg-amber-400", "bg-emerald-400", "bg-sky-400", "bg-violet-400"].map((color, i) => (
                    <div
                      key={i}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ${color} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {["A", "K", "M", "S"][i]}
                    </div>
                  ))}
                </div>
                <div className="text-center sm:text-left">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Rejoignez <strong className="text-foreground">250+ entreprises</strong> qui font confiance à Klara
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne visuelle — Mockup dashboard */}
          <div className="relative animate-fade-in-up mt-12 lg:mt-16" style={{ animationDelay: "0.5s" }}>
            {/* Animated gradient border */}
            <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-br from-[#00D4AA]/30 via-[#00E8BC]/10 to-[#00B894]/30 animate-pulse -z-10" style={{ animationDuration: "4s" }} />
            <div className="relative bg-card rounded-2xl shadow-2xl shadow-black/5 border border-slate-200/60 dark:border-slate-700 p-4 md:p-6 overflow-hidden scale-[0.85] sm:scale-100 origin-top">
              {/* Faux header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-muted rounded-md h-6 mx-4" />
              </div>

              {/* Faux dashboard */}
              <div className="space-y-4">
                {/* StatCards */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Trésorerie", value: "2 850 000", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                    { label: "En attente", value: "495 600", color: "bg-amber-50 text-amber-700 border-amber-100" },
                    { label: "En retard", value: "295 000", color: "bg-red-50 text-red-700 border-red-100" },
                    { label: "Dépenses", value: "1 245 000", color: "bg-slate-50 text-slate-700 border-slate-100" },
                  ].map((stat) => (
                    <div key={stat.label} className={`${stat.color} border rounded-xl p-4`}>
                      <p className="text-xs font-medium opacity-70">{stat.label}</p>
                      <p className="text-lg font-bold mt-0.5">{stat.value} <span className="text-xs font-semibold opacity-70">FCFA</span></p>
                    </div>
                  ))}
                </div>

                {/* Faux graphique */}
                <div className="bg-slate-50 dark:bg-muted rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-end justify-between h-20 gap-1.5">
                    {[40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 65, 95].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm transition-all"
                        style={{
                          height: `${h}%`,
                          background: i >= 6 ? "#00D4AA" : "#CBD5E1",
                          opacity: 0.6 + (h / 200),
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-slate-400">
                    <span>Jan</span>
                    <span>Juin</span>
                    <span>Déc</span>
                  </div>
                </div>

                {/* Faux tableau */}
                <div className="bg-card border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-3 text-xs font-medium text-muted-foreground bg-muted px-3 py-2">
                    <span>Facture</span>
                    <span>Client</span>
                    <span className="text-right">Montant</span>
                  </div>
                  {[
                    { num: "FAC-2024-004", client: "Togo Télécom", amount: "2 065 000", status: "green" },
                    { num: "FAC-2024-003", client: "Chez Maman", amount: "495 600", status: "blue" },
                    { num: "FAC-2024-002", client: "J-P. Agbéko", amount: "295 000", status: "red" },
                  ].map((row) => (
                    <div key={row.num} className="grid grid-cols-3 text-xs px-3 py-2.5 border-t border-border">
                      <span className="font-medium text-slate-700">{row.num}</span>
                      <span className="text-muted-foreground">{row.client}</span>
                      <span className="text-right text-slate-700">{row.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Éléments flottants décoratifs */}
            <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-xl shadow-black/10 border border-slate-100 dark:border-slate-700 p-3 animate-float hidden lg:block">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">Paiement reçu</p>
                  <p className="text-xs text-emerald-600 font-bold">+2 065 000 FCFA</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-xl shadow-black/10 border border-slate-100 dark:border-slate-700 p-3 animate-float hidden lg:block" style={{ animationDelay: "1.5s" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <Send className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-700">Relance envoyée</p>
                  <p className="text-xs text-amber-600 font-bold">J+7 automatique</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: Problème / Empathie
   ============================================================ */
function ProblemSection() {
  const painPoints = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Vos factures traînent dans WhatsApp",
      description:
        "Pas de suivi, pas de professionnel. Difficile de savoir qui vous doit quoi et quand.",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Vous oubliez de relancer vos clients",
      description:
        "Les impayés s'accumulent et votre trésorerie en souffre. Pas le temps de suivre chaque facture.",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Vous ne savez pas combien vous avez gagné",
      description:
        "Revenus et dépenses mélangés. Impossible de prendre de bonnes décisions pour votre business.",
    },
  ];

  return (
    <section className="py-14 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <Badge variant="secondary" className="mb-4 text-sm font-medium px-4 py-1.5">
            Le problème
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4 font-[var(--font-plus-jakarta)]">
            Vous vous reconnaissez ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des milliers de commerçants et prestataires font face aux mêmes défis
            au quotidien en Afrique de l&apos;Ouest.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {painPoints.map((point, i) => (
            <Card
              key={i}
              className="border-slate-200 bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group rounded-2xl"
            >
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {point.icon}
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">
                  {point.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: Solution / Fonctionnalités
   ============================================================ */
function FeaturesSection() {
  const features = [
    {
      icon: <FileText className="w-7 h-7" />,
      title: "Facturation professionnelle en 2 minutes",
      description:
        "Créez des factures pro avec votre logo, envoyez-les par email et suivez les paiements. Numérotation automatique, calcul TVA 18% UEMOA, export PDF.",
      color: "bg-[#00D4AA]/10 text-[#00D4AA]",
    },
    {
      icon: <Wallet className="w-7 h-7" />,
      title: "Paiement Mobile Money intégré",
      description:
        "Vos clients paient directement via Flooz, T-Money, Wave ou MTN MoMo. Vous recevez l'argent et la facture est marquée payée automatiquement.",
      color: "bg-amber-100 text-amber-600",
    },
    {
      icon: <Send className="w-7 h-7" />,
      title: "Relances automatiques pour les impayés",
      description:
        "Klara relance vos clients à J+7, J+15 et J+30 par email. Ton adapté à chaque palier. Plus besoin de perdre du temps à relancer.",
      color: "bg-violet-100 text-violet-600",
    },
    {
      icon: <BarChart3 className="w-7 h-7" />,
      title: "Tableau de bord en temps réel",
      description:
        "Visualisez votre trésorerie, vos encaissements et dépenses. Graphiques clairs pour prendre les bonnes décisions.",
      color: "bg-sky-100 text-sky-600",
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: "Données sécurisées",
      description:
        "Vos données sont protégées et chiffrées. Multi-organisation : chaque PME a ses données isolées.",
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: "Collaboration d'équipe",
      description:
        "Invitez vos collaborateurs avec des rôles (Admin, Membre). Travaillez ensemble sur les factures et devis.",
      color: "bg-rose-100 text-rose-600",
    },
  ];

  return (
    <section id="fonctionnalites" className="py-14 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <Badge className="mb-4 text-sm font-medium px-4 py-1.5 bg-[#00D4AA]/10 text-[#00D4AA] border-[#00D4AA]/20">
            La solution
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4 font-[var(--font-plus-jakarta)]">
            Klara s&apos;occupe de tout
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour gérer vos finances professionnelles,
            au même endroit.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="group relative rounded-2xl">
              <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-br from-[#00D4AA] to-[#00B894] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Card className="relative border-slate-200 dark:border-slate-700 bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden rounded-2xl z-[1]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00D4AA]/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <CardContent className="p-6 md:p-8 relative z-10">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 ${feature.color}`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: Animated Counter Stats
   ============================================================ */
function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return (
    <div ref={ref} className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] tabular-nums">
      {count.toLocaleString("fr-FR")}{suffix}
    </div>
  );
}

function StatsSection() {
  return (
    <section className="py-12 md:py-16 border-y border-border/50 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12">
          <div className="text-center">
            <AnimatedCounter target={2500} suffix="+" />
            <p className="text-sm text-muted-foreground mt-2 font-medium">PME qui nous font confiance</p>
          </div>
          <div className="text-center">
            <AnimatedCounter target={15} suffix="M+" />
            <p className="text-sm text-muted-foreground mt-2 font-medium">FCFA traités chaque mois</p>
          </div>
          <div className="text-center">
            <AnimatedCounter target={98} suffix="%" />
            <p className="text-sm text-muted-foreground mt-2 font-medium">Taux de satisfaction</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: Comment ça marche
   ============================================================ */
function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Créez votre compte",
      description:
        "Inscription gratuite en 2 minutes. Pas besoin de carte bancaire. Configurez votre entreprise en 3 étapes simples.",
      icon: <Users className="w-8 h-8" />,
    },
    {
      num: "02",
      title: "Ajoutez vos clients et facturez",
      description:
        "Créez votre premier client et votre première facture en quelques clics. Envoyez par email avec lien de paiement Mobile Money.",
      icon: <FileText className="w-8 h-8" />,
    },
    {
      num: "03",
      title: "Encaissez et suivez tout",
      description:
        "Recevez vos paiements, suivez votre trésorerie en temps réel. Klara relance automatiquement les impayés.",
      icon: <Zap className="w-8 h-8" />,
    },
  ];

  return (
    <section id="comment" className="py-14 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4 font-[var(--font-plus-jakarta)]">
            3 étapes pour démarrer
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, rapide, efficace. Pas besoin de formation comptable.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center group">
              {/* Numéro */}
              <div className="text-7xl font-black text-[#00D4AA]/10 font-[var(--font-plus-jakarta)] mb-4 group-hover:text-[#00D4AA]/20 transition-colors">
                {step.num}
              </div>

              {/* Icône */}
              <div className="w-16 h-16 bg-card shadow-lg border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#00D4AA] group-hover:scale-110 transition-transform">
                {step.icon}
              </div>

              <h3 className="text-xl font-bold text-[#1A1A2E] mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>

              {/* Flèche (sauf dernier) */}
              {i < 2 && (
                <div className="hidden md:block absolute top-20 -right-6 lg:-right-8">
                  <ArrowRight className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: Tarifs
   ============================================================ */
function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "0",
      period: "Essai gratuit",
      description: "Idéal pour découvrir Klara",
      popular: false,
      features: [
        "Facturation basique",
        "5 clients maximum",
        "10 factures / mois",
        "Export PDF",
        "1 utilisateur",
      ],
      cta: "Commencer gratuitement",
      ctaVariant: "outline" as const,
    },
    {
      name: "Business",
      price: "10 000",
      period: "FCFA / mois",
      description: "Le plus adapté aux PME",
      popular: true,
      features: [
        "Tout Starter inclus",
        "Clients illimités",
        "Factures illimitées",
        "Relances automatiques",
        "Paiement Mobile Money",
        "3 utilisateurs",
        "Support prioritaire",
      ],
      cta: "Passer au Business",
      ctaVariant: "default" as const,
    },
    {
      name: "Pro",
      price: "25 000",
      period: "FCFA / mois",
      description: "Pour les entreprises en croissance",
      popular: false,
      features: [
        "Tout Business inclus",
        "Utilisateurs illimités",
        "Export comptable",
        "Multi-devises",
        "API & intégrations",
        "Support dédié",
      ],
      cta: "Passer au Pro",
      ctaVariant: "outline" as const,
    },
  ];

  return (
    <section id="tarifs" className="py-14 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4 font-[var(--font-plus-jakarta)]">
            Simple et transparent
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pas de frais cachés. Paiement par Mobile Money accepté.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <Card
              key={i}
              className={`relative bg-card transition-all duration-300 rounded-2xl ${
                plan.popular
                  ? "border-[#00D4AA] shadow-2xl shadow-[#00D4AA]/15 md:scale-105 z-10 ring-4 ring-[#00D4AA]/5"
                  : "border-slate-200 hover:shadow-lg hover:-translate-y-1"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#00D4AA] text-[#1A1A2E] font-bold px-4 py-1 shadow-lg shadow-[#00D4AA]/20">
                    Populaire
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-4 pt-8 px-6">
                <h3 className="text-xl font-bold text-[#1A1A2E]">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-[#1A1A2E] font-[var(--font-plus-jakarta)]">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-[#00D4AA] flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="px-6 pb-8">
                <Button
                  variant={plan.ctaVariant}
                  className={`w-full rounded-full font-semibold py-5 ${
                    plan.popular
                      ? "bg-[#00D4AA] hover:bg-[#00B894] text-[#1A1A2E] shadow-lg shadow-[#00D4AA]/20"
                      : "border-slate-200 text-[#1A1A2E]"
                  }`}
                >
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: Trust Bar
   ============================================================ */
function TrustBarSection() {
  const indicators = [
    { icon: <Building2 className="w-5 h-5" />, value: "500+", label: "PME" },
    { icon: <Globe className="w-5 h-5" />, value: "12", label: "pays UEMOA" },
    { icon: <CircleDollarSign className="w-5 h-5" />, value: "5M+", label: "FCFA traités" },
    { icon: <ShieldCheck className="w-5 h-5" />, value: "99.9%", label: "disponibilité" },
  ];

  return (
    <section className="py-10 md:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-muted/40 border border-border/50 rounded-2xl p-6 md:p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            {indicators.map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center gap-2"
              >
                <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#1A1A2E] font-[var(--font-plus-jakarta)]">
                    {item.value}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: Témoignages
   ============================================================ */
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Aminata Mensah",
      business: "Boutique de textile",
      city: "Lomé, Togo",
      text: "Depuis que j'utilise Klara, mes clients me paient beaucoup plus vite. Les relances automatiques ont changé ma vie !",
      avatar: "bg-amber-400",
      initials: "AM",
    },
    {
      name: "Kofi Kodjo",
      business: "Prestataire IT",
      city: "Kara, Togo",
      text: "Avant Klara, je perdais des factures dans mes messages WhatsApp. Maintenant tout est professionnel et organisé.",
      avatar: "bg-emerald-400",
      initials: "KK",
    },
    {
      name: "Adèle Dossou",
      business: "Restauratrice",
      city: "Cotonou, Bénin",
      text: "Le paiement Mobile Money intégré est génial. Mes clients paient directement depuis le lien de la facture.",
      avatar: "bg-violet-400",
      initials: "AD",
    },
  ];

  return (
    <section className="py-14 md:py-28 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1A1A2E] mb-4 font-[var(--font-plus-jakarta)]">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-muted-foreground">
            Des entrepreneurs comme vous, partout en Afrique de l&apos;Ouest.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <Card key={i} className="bg-card border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 rounded-2xl">
              <CardContent className="p-6 md:p-8">
                {/* Étoiles */}
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed mb-6 italic">
                  &ldquo;{t.text}&rdquo;
                </p>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full ${t.avatar} flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1A1A2E]">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.business} — {t.city}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: CTA Final
   ============================================================ */
function FinalCTA() {
  return (
    <section className="py-14 md:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-r from-[#00D4AA] via-[#00E8BC] to-[#00D4AA] rounded-3xl p-8 md:p-16 text-center overflow-hidden animate-gradient-bg shadow-2xl shadow-[#00D4AA]/15">
          {/* Pattern décoratif */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 border border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-60 h-60 border border-white rounded-full translate-x-1/3 translate-y-1/3" />
            <div className="absolute top-1/2 right-1/4 w-32 h-32 border border-white rounded-full" />
          </div>

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A1A2E] mb-6 font-[var(--font-plus-jakarta)]">
              Prêt à voir clair dans vos finances ?
            </h2>
            <p className="text-lg text-[#1A1A2E]/70 mb-10 max-w-xl mx-auto">
              Rejoignez les centaines d&apos;entrepreneurs qui gèrent leur business
              sereinement avec Klara.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-[#1A1A2E] hover:bg-[#0F0F1E] text-white font-bold text-base px-6 py-4 sm:px-8 sm:py-6 rounded-full shadow-xl transition-all hover:scale-105"
              >
                Essai gratuit 14 jours
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#1A1A2E]/30 text-[#1A1A2E] font-medium text-base px-6 py-4 sm:px-8 sm:py-6 rounded-full hover:bg-[#1A1A2E]/10 transition-all hover:scale-105"
              >
                Sans carte bancaire
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION: Footer
   ============================================================ */
function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Logo & tagline */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-1 mb-4">
              <span className="text-2xl font-extrabold text-white">K</span>
              <span className="text-2xl font-semibold text-[#00D4AA]">lara</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              La solution de gestion financière pensée pour les PME d&apos;Afrique de l&apos;Ouest.
            </p>
          </div>

          {/* Liens */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/90">Produit</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Tarifs</a></li>
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Intégrations</a></li>
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Mises à jour</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/90">Ressources</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Centre d&apos;aide</a></li>
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Blog</a></li>
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Contact</a></li>
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white/90">Légal</h4>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Conditions d&apos;utilisation</a></li>
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Confidentialité</a></li>
              <li><a href="#" className="hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30">Mentions légales</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Klara. Fait avec &#10084;&#65039; à Lomé, Togo.
          </p>
          <div className="flex items-center gap-4">
            {/* Réseaux sociaux placeholder */}
            {["LinkedIn", "Facebook", "Twitter"].map((s) => (
              <a
                key={s}
                href="#"
                className="text-xs text-white/40 hover:text-[#00D4AA] transition-colors hover:underline underline-offset-4 decoration-[#00D4AA]/30"
              >
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   PAGE: Landing KLARA
   ============================================================ */
export default function KlaraLandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <StatsSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <TrustBarSection />
      <TestimonialsSection />
      <FinalCTA />
      <Footer />
    </main>
  );
}
