import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

function safeParseTools(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const row = await db.organizationToolSelection.findUnique({
      where: { organizationId },
      select: { selectedTools: true, updatedAt: true },
    });

    return NextResponse.json({
      selectedTools: safeParseTools(row?.selectedTools),
      updatedAt: row?.updatedAt ?? null,
    });
  } catch (err) {
    console.error("GET /api/outils/selection error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const selectedToolsRaw = body?.selectedTools;
    if (!Array.isArray(selectedToolsRaw) || selectedToolsRaw.some((v) => typeof v !== "string")) {
      return NextResponse.json({ error: "selectedTools invalide" }, { status: 400 });
    }

    const selectedTools = selectedToolsRaw as string[];

    const saved = await db.organizationToolSelection.upsert({
      where: { organizationId },
      create: {
        organizationId,
        selectedTools: JSON.stringify(selectedTools),
      },
      update: {
        selectedTools: JSON.stringify(selectedTools),
      },
      select: { selectedTools: true, updatedAt: true },
    });

    return NextResponse.json({
      selectedTools: safeParseTools(saved.selectedTools),
      updatedAt: saved.updatedAt,
    });
  } catch (err) {
    console.error("PUT /api/outils/selection error:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
