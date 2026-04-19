import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type Role = "OWNER" | "ADMIN" | "MEMBER";

export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session?.user?.id) {
    return {
      error: NextResponse.json({ error: "Non autorise" }, { status: 401 }),
      session: null,
      organizationId: null,
    };
  }

  return { error: null, session, organizationId: session.user.organizationId };
}

export async function requireRole(organizationId: string, userId: string, allowedRoles: Role[]) {
  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
    select: { role: true },
  });

  if (!user || !allowedRoles.includes(user.role as Role)) {
    return NextResponse.json({ error: "Acces interdit" }, { status: 403 });
  }

  return null;
}
