import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[AUTH] Login failed: missing_credentials')
          return null
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
            include: { organization: true },
          })

          if (!user) {
            console.warn('[AUTH] Login failed: invalid_credentials')
            return null
          }

          if (!user.password) {
            console.warn('[AUTH] Login failed: invalid_credentials')
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            console.warn('[AUTH] Login failed: invalid_credentials')
            return null
          }

          console.info('[AUTH] Login success')
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization.name,
          }
        } catch (error) {
          console.error('[AUTH] Error during authorize:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.name = user.name as string
        token.id = user.id as string
        token.role = (user.role as string) || "MEMBER"
        token.organizationId = user.organizationId as string
        token.organizationName = (user.organizationName as string) || ""
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = (token.name as string) || session.user.name
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organizationName = token.organizationName as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
