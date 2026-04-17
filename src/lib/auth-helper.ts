import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function getAuthSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return { error: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }), session: null, organizationId: null }
  }
  return { error: null, session, organizationId: session.user.organizationId }
}
