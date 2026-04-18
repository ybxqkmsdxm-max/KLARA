import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const expense = await db.expense.findFirst({ where: { id, organizationId } });
    if (!expense) return NextResponse.json({ error: "Dépense non trouvée" }, { status: 404 });

    await db.expense.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Erreur suppression dépense:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
