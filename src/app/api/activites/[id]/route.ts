import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const updateActivitySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().nullable().optional(),
  monthlyBudget: z.number().int().min(0).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CLOSED"]).optional(),
});

const updateTransferSchema = z.object({
  mode: z.literal("TRANSFER").optional(),
  fromActivityName: z.string().min(1).optional(),
  toActivityName: z.string().min(1).optional(),
  amount: z.number().int().positive().optional(),
  note: z.string().nullable().optional(),
  transferredAt: z.string().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "TRANSFER" ? "TRANSFER" : "ACTIVITY";

    const body = await request.json();

    if (mode === "TRANSFER") {
      const existingTransfer = await db.activityTransfer.findFirst({ where: { id, organizationId } });
      if (!existingTransfer) return NextResponse.json({ error: "Transfert non trouve" }, { status: 404 });

      const parsed = updateTransferSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
          { status: 422 }
        );
      }

      const data = parsed.data;
      const item = await db.activityTransfer.update({
        where: { id },
        data: {
          ...(data.fromActivityName ? { fromActivityName: data.fromActivityName } : {}),
          ...(data.toActivityName ? { toActivityName: data.toActivityName } : {}),
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.note !== undefined ? { note: data.note } : {}),
          ...(data.transferredAt ? { transferredAt: new Date(data.transferredAt) } : {}),
        },
      });

      return NextResponse.json({ item });
    }

    const existingActivity = await db.activity.findFirst({ where: { id, organizationId } });
    if (!existingActivity) return NextResponse.json({ error: "Activite non trouvee" }, { status: 404 });

    const parsed = updateActivitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.activity.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.monthlyBudget !== undefined ? { monthlyBudget: data.monthlyBudget } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/activites/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "TRANSFER" ? "TRANSFER" : "ACTIVITY";

    if (mode === "TRANSFER") {
      const existingTransfer = await db.activityTransfer.findFirst({ where: { id, organizationId } });
      if (!existingTransfer) return NextResponse.json({ error: "Transfert non trouve" }, { status: 404 });
      await db.activityTransfer.delete({ where: { id } });
      return NextResponse.json({ success: true, id });
    }

    const existingActivity = await db.activity.findFirst({ where: { id, organizationId } });
    if (!existingActivity) return NextResponse.json({ error: "Activite non trouvee" }, { status: 404 });
    await db.activity.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/activites/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
