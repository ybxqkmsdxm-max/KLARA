import { NextRequest, NextResponse } from "next/server";

/* ============================================================
   Mock notifications state (shared reference)
   ============================================================ */

// We read the mock data from the parent route module.
// In a real app this would be a database. Here we maintain a simple
// in-memory list that the parent route also exports.
interface Notification {
  id: string;
  type: "invoice_overdue" | "payment_received" | "quote_expiring" | "system" | "reminder";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

// Local mock store — mirrors parent route. In production this would be Prisma.
// For simplicity the DELETE/PATCH operations here are fire-and-forget mocks.
// The client handles optimistic updates, so the response body is informational.

/* ============================================================
   PATCH /api/notifications/[id] — Toggle read status
   ============================================================ */

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  // Mock response — client handles the state update optimistically
  return NextResponse.json({
    success: true,
    id,
    read: true,
    message: "Notification marquée comme lue",
  });
}

/* ============================================================
   DELETE /api/notifications/[id] — Delete notification
   ============================================================ */

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 });
  }

  // Mock response — client handles the state update optimistically
  return NextResponse.json({
    success: true,
    id,
    message: "Notification supprimée",
  });
}
