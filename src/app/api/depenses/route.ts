import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthSession } from "@/lib/auth-helper";
import { z } from "zod";

const createExpenseSchema = z.object({
  description: z.string().min(1, "La description est requise"),
  amount: z.number().min(0.01, "Le montant doit être positif"),
  category: z.string().min(1, "La catégorie est requise"),
  date: z.string().min(1, "La date est requise"),
  paymentMethod: z.enum(["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE", "CARTE"]).default("ESPECES"),
});

export async function GET(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = { organizationId };
    if (category && category !== "TOUS") where.category = category;

    const [depenses, total, allExpenses] = await Promise.all([
      db.expense.findMany({ where, orderBy: { date: "desc" }, skip: (page - 1) * limit, take: limit }),
      db.expense.count({ where }),
      db.expense.findMany({ where: { organizationId } }),
    ]);

    const totalParCategorie = allExpenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>);
    const totalGlobal = allExpenses.reduce((s, e) => s + e.amount, 0);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const totalMois = allExpenses.filter((e) => e.date >= firstDayOfMonth && e.date <= lastDayOfMonth).reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({ depenses, total, page, totalPages: Math.ceil(total / limit), stats: { totalMois, totalParCategorie, totalGlobal } });
  } catch (error) {
    console.error("Erreur dépenses:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId } = await getAuthSession();
    if (error) return error;

    const body = await request.json();
    const result = createExpenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Données invalides", details: result.error.flatten().fieldErrors }, { status: 422 });
    }

    const { category, description, amount, date, paymentMethod } = result.data;

    const expense = await db.expense.create({
      data: {
        organizationId, category, description, amount,
        date: date ? new Date(date) : new Date(),
        paymentMethod,
      },
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Erreur création dépense:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
