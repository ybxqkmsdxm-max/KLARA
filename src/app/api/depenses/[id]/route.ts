import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * DELETE /api/depenses/[id] - Supprimer une dépense
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const organization = await db.organization.findUnique({
      where: { clerkOrgId: "org_demo_klara" },
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organisation non trouvée" },
        { status: 404 }
      );
    }

    const expense = await db.expense.findFirst({
      where: { id, organizationId: organization.id },
    });

    if (!expense) {
      return NextResponse.json(
        { error: "Dépense non trouvée" },
        { status: 404 }
      );
    }

    await db.expense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Erreur suppression dépense:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
