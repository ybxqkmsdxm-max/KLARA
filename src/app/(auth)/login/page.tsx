'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, Loader2, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL || 'aminata@boutique-excellence.tg'
const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'demo1234'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Email ou mot de passe incorrect')
      } else if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="text-center px-0 pt-0">
        {/* Desktop logo */}
        <div className="hidden lg:flex items-center justify-center gap-2.5 mb-6">
          <div className="h-10 w-10 bg-[#00D4AA] rounded-xl flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-[#1A1A2E] dark:text-white tracking-tight" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
            Klara
          </span>
        </div>
        <CardTitle className="text-2xl font-bold text-[#1A1A2E] dark:text-white" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
          Connexion
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Connectez-vous à votre espace Klara
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0"
                tabIndex={-1}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Password reset not implemented yet */}
          <div className="flex justify-end">
            <span className="text-sm text-muted-foreground">
              Réinitialisation du mot de passe bientôt disponible
            </span>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-11 bg-[#1A1A2E] hover:bg-[#1A1A2E]/90 text-white font-medium rounded-xl transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        {/* Register link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="text-[#00D4AA] hover:text-[#00C19C] font-medium transition-colors"
            >
              S&apos;inscrire
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-3 bg-[#00D4AA]/5 border border-[#00D4AA]/10 rounded-xl">
          <p className="text-xs text-muted-foreground text-center">
            <span className="font-medium text-[#1A1A2E] dark:text-white">Démo :</span>{' '}
            {demoEmail} / {demoPassword}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
