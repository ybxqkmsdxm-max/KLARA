import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helper";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  return NextResponse.json({
    success: true,
    id,
    read: true,
    message: "Notification marquee comme lue",
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await getAuthSession();
  if (error) return error;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  return NextResponse.json({
    success: true,
    id,
    message: "Notification supprimee",
  });
}
