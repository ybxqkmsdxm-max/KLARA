import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";

const organizationSchema = z.object({
  name: z.string().trim().min(1, "Le nom de l'entreprise est requis"),
  email: z.string().trim().email("Format d'email invalide"),
  phone: z.string().trim().min(1, "Le téléphone est requis"),
  address: z.string().trim().optional().default(""),
  city: z.string().trim().min(1, "La ville est requise"),
  sector: z.string().trim().optional().default(""),
  nif: z.string().trim().min(1, "Le numéro NIF est requis"),
});

export async function GET() {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const organization = await db.organization.findUnique({
      where: { id: organizationId! },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        sector: true,
        taxNumber: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organisation introuvable" }, { status: 404 });
    }

    return NextResponse.json({
      organization: {
        name: organization.name,
        email: organization.email ?? "",
        phone: organization.phone ?? "",
        address: organization.address ?? "",
        city: organization.city ?? "",
        sector: organization.sector ?? "",
        nif: organization.taxNumber ?? "",
      },
    });
  } catch (error) {
    console.error("Erreur récupération paramètres organisation:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const result = organizationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, email, phone, address, city, sector, nif } = result.data;

    const updated = await db.organization.update({
      where: { id: organizationId! },
      data: {
        name,
        email,
        phone,
        address: address || null,
        city,
        sector: sector || null,
        taxNumber: nif,
      },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        sector: true,
        taxNumber: true,
      },
    });

    return NextResponse.json({
      organization: {
        name: updated.name,
        email: updated.email ?? "",
        phone: updated.phone ?? "",
        address: updated.address ?? "",
        city: updated.city ?? "",
        sector: updated.sector ?? "",
        nif: updated.taxNumber ?? "",
      },
    });
  } catch (error) {
    console.error("Erreur sauvegarde paramètres organisation:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
