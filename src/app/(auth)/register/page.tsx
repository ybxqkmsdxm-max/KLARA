'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, Loader2, User, Building2, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const sectors = [
  { value: 'Commerce', label: 'Commerce' },
  { value: 'Services', label: 'Services' },
  { value: 'Restauration', label: 'Restauration' },
  { value: 'IT', label: 'IT / Technologie' },
  { value: 'Construction', label: 'Construction' },
  { value: 'Transport', label: 'Transport' },
  { value: 'Autre', label: 'Autre' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    sector: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!form.name || form.name.length < 2) newErrors.name = 'Le nom doit contenir au moins 2 caractères'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Adresse email invalide'
    if (!form.password || form.password.length < 8) newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères'
    if (!form.organizationName || form.organizationName.length < 2) newErrors.organizationName = "Le nom de l'organisation est requis"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error) {
          toast.error(data.error)
        }
        if (data.details) {
          setErrors(data.details)
        }
        return
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      if (result?.ok) {
        toast.success('Compte créé avec succès !')
        router.push('/dashboard')
        router.refresh()
      } else {
        toast.success('Compte créé ! Connectez-vous.')
        router.push('/login')
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
        <CardTitle className="text-2xl font-bold text-[#1A1A2E] dark:text-white" style={{ fontFamily: 'var(--font-plus-jakarta)' }}>
          Créer un compte
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Commencez à gérer vos finances en quelques minutes
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nom complet
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Aminata Mensah"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`pl-10 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 ${errors.name ? 'border-red-400 dark:border-red-400' : ''}`}
                disabled={isLoading}
                autoComplete="name"
              />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="reg-email" className="text-sm font-medium">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-email"
                type="email"
                placeholder="vous@exemple.com"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`pl-10 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 ${errors.email ? 'border-red-400 dark:border-red-400' : ''}`}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="reg-password" className="text-sm font-medium">
              Mot de passe
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Au moins 8 caractères"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={`pl-10 pr-10 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 ${errors.password ? 'border-red-400 dark:border-red-400' : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {/* Organization name */}
          <div className="space-y-2">
            <Label htmlFor="org-name" className="text-sm font-medium">
              Nom de l&apos;organisation
            </Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="org-name"
                type="text"
                placeholder="Ma Boutique"
                value={form.organizationName}
                onChange={(e) => handleChange('organizationName', e.target.value)}
                className={`pl-10 h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 ${errors.organizationName ? 'border-red-400 dark:border-red-400' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.organizationName && <p className="text-xs text-red-500 mt-1">{errors.organizationName}</p>}
          </div>

          {/* Sector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Secteur d&apos;activité
            </Label>
            <Select value={form.sector} onValueChange={(v) => handleChange('sector', v)}>
              <SelectTrigger className="h-11 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10">
                <SelectValue placeholder="Sélectionnez votre secteur" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-11 bg-[#00D4AA] hover:bg-[#00C19C] text-white font-medium rounded-xl transition-colors mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création du compte...
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link
              href="/login"
              className="text-[#00D4AA] hover:text-[#00C19C] font-medium transition-colors"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
