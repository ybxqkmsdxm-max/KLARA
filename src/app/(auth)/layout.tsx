import { BarChart3, FileText, Shield, Zap } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A2E] relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#00D4AA]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#00D4AA]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="h-12 w-12 bg-[#00D4AA] rounded-xl flex items-center justify-center">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
              Klara
            </span>
          </div>

          {/* Tagline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
            Gestion financière{' '}
            <span className="text-[#00D4AA]">simple</span>
            <br />
            pour les PME d&apos;Afrique de l&apos;Ouest
          </h1>

          <p className="text-lg text-white/60 mb-12 max-w-md">
            Facturation, paiements Mobile Money et relances automatiques. 
            Tout ce dont votre business a besoin, en un seul endroit.
          </p>

          {/* Feature highlights */}
          <div className="space-y-5">
            {[
              {
                icon: FileText,
                title: 'Facturation pro',
                desc: 'Créez et envoyez des factures en FCFA en quelques clics',
              },
              {
                icon: Zap,
                title: 'Paiements Mobile Money',
                desc: 'Acceptez T-Money, Flooz et virements bancaires',
              },
              {
                icon: Shield,
                title: 'Relances automatiques',
                desc: 'Ne perdez plus jamais un paiement en retard',
              },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4">
                <div className="h-10 w-10 bg-[#00D4AA]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <feature.icon className="h-5 w-5 text-[#00D4AA]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-0.5">{feature.title}</h3>
                  <p className="text-white/50 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Auth forms */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-[#0f0f1a] dark:to-[#1A1A2E]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="h-10 w-10 bg-[#00D4AA] rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-[#1A1A2E] dark:text-white tracking-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
              Klara
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
