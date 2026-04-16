import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/depenses - Liste des dépenses
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    const where: Record<string, unknown> = { organizationId: organization.id };
    if (category && category !== "TOUS") where.category = category;

    const [depenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    // Stats par catégorie pour le graphique
    const allExpenses = await db.expense.findMany({ where: { organizationId: organization.id } });
    const totalParCategorie = allExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalGlobal = allExpenses.reduce((s, e) => s + e.amount, 0);

    // Calcul du total du mois en cours
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const expensesThisMonth = allExpenses.filter(
      (e) => e.date >= firstDayOfMonth && e.date <= lastDayOfMonth
    );
    const totalMois = expensesThisMonth.reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({
      depenses,
      total, page, totalPages: Math.ceil(total / limit),
      stats: { totalMois, totalParCategorie, totalGlobal },
    });
  } catch (error) {
    console.error("Erreur dépenses:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * POST /api/depenses - Créer une dépense
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, description, amount, date, paymentMethod } = body;

    if (!description || !amount) return NextResponse.json({ error: "Description et montant requis" }, { status: 400 });

    const organization = await db.organization.findUnique({ where: { clerkOrgId: "org_demo_klara" } });
    if (!organization) return NextResponse.json({ error: "Organisation non trouvée" }, { status: 404 });

    const expense = await db.expense.create({
      data: {
        organizationId: organization.id,
        category: category || "AUTRE", description, amount,
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || "ESPECES",
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Erreur création dépense:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
