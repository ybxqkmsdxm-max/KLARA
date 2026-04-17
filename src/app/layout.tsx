import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

// Polices KLARA
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

// Police mono — Geist Mono via Google Fonts
import { Geist_Mono } from "next/font/google";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Klara — Gestion financière pour PME d'Afrique de l'Ouest",
  description:
    "Klara simplifie la facturation, le suivi des dépenses et les relances clients pour les PME et micro-entreprises sans comptable. Payez et encaissez en Mobile Money.",
  keywords: [
    "Klara",
    "facturation",
    "PME",
    "Afrique",
    "UEMOA",
    "Mobile Money",
    "FCFA",
    "Togo",
    "comptabilité",
  ],
  authors: [{ name: "Klara Team" }],
  icons: { icon: "/klara-logo.svg" },
  openGraph: {
    title: "Klara — Gérez vos finances, faites grandir votre business",
    description:
      "Facturation pro, paiements Mobile Money et relances automatiques pour les PME d'Afrique de l'Ouest.",
    siteName: "Klara",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${dmSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
