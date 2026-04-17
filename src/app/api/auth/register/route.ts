import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  organizationName: z.string().min(2, "Le nom de l'organisation doit contenir au moins 2 caractères"),
  sector: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = registerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: result.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { name, email, password, organizationName, sector } = result.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create organization
    const organization = await db.organization.create({
      data: {
        name: organizationName,
        email,
        sector: sector || null,
        plan: 'STARTER',
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
        country: 'TG',
        city: 'Lomé',
        currency: 'XOF',
      },
    })

    // Create user as OWNER
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'OWNER',
        organizationId: organization.id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: organization.id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
