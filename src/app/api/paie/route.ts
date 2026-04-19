import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession, requireRole } from "@/lib/auth-helper";

const createEmployeeSchema = z.object({
  fullName: z.string().min(2, "Le nom est requis"),
  roleTitle: z.string().optional(),
  phone: z.string().optional(),
  baseSalary: z.number().int().min(0).default(0),
  status: z.enum(["ACTIF", "INACTIF"]).default("ACTIF"),
});

const createPayrollRunSchema = z.object({
  mode: z.literal("PAYROLL_RUN"),
  periodMonth: z.string().min(7, "Periode invalide (YYYY-MM)"),
  status: z.enum(["BROUILLON", "CALCULE", "VALIDE", "PAYE"]).default("BROUILLON"),
  grossAmount: z.number().int().min(0).default(0),
  netAmount: z.number().int().min(0).default(0),
  employeeCount: z.number().int().min(0).default(0),
  processedAt: z.string().optional(),
});

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  try {
    const { error, organizationId, session } = await getAuthSession();
    if (error) return error;
    const roleError = await requireRole(organizationId, session.user.id, ["OWNER", "ADMIN"]);
    if (roleError) return roleError;

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "PAYROLL_RUN" ? "PAYROLL_RUN" : "EMPLOYEE";
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const requestedLimit = Math.max(1, Number(searchParams.get("limit") || String(DEFAULT_LIMIT)));
    const limit = Math.min(MAX_LIMIT, requestedLimit);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status")?.trim();
    const sortBy = mode === "PAYROLL_RUN"
      ? (searchParams.get("sortBy") === "netAmount" ? "netAmount" : "createdAt")
      : (searchParams.get("sortBy") === "baseSalary" ? "baseSalary" : "createdAt");
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

    if (mode === "PAYROLL_RUN") {
      const where: Record<string, unknown> = { organizationId };
      if (status) where.status = status;
      if (q) where.periodMonth = { contains: q };

      const [items, total] = await Promise.all([
        db.payrollRun.findMany({
          where,
          orderBy: { [sortBy]: sortDir },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.payrollRun.count({ where }),
      ]);

      const allRuns = await db.payrollRun.findMany({ where: { organizationId } });
      const stats = {
        runsCount: allRuns.length,
        grossTotal: allRuns.reduce((sum, r) => sum + r.grossAmount, 0),
        netTotal: allRuns.reduce((sum, r) => sum + r.netAmount, 0),
      };

      return NextResponse.json({
        items,
        payrollRuns: items,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        stats,
      });
    }

    const where: Record<string, unknown> = { organizationId };
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { fullName: { contains: q } },
        { roleTitle: { contains: q } },
        { phone: { contains: q } },
      ];
    }

    const [items, total, allEmployees, latestRun] = await Promise.all([
      db.employee.findMany({
        where,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.employee.count({ where }),
      db.employee.findMany({ where: { organizationId } }),
      db.payrollRun.findFirst({ where: { organizationId }, orderBy: { createdAt: "desc" } }),
    ]);

    const stats = {
      activeEmployees: allEmployees.filter((e) => e.status === "ACTIF").length,
      totalBasePayroll: allEmployees.reduce((sum, e) => sum + e.baseSalary, 0),
      lastRun: latestRun,
    };

    return NextResponse.json({
      items,
      employees: items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      stats,
    });
  } catch (error) {
    console.error("GET /api/paie error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { error, organizationId, session } = await getAuthSession();
    if (error) return error;
    const roleError = await requireRole(organizationId, session.user.id, ["OWNER", "ADMIN"]);
    if (roleError) return roleError;

    const body = await request.json();
    const mode = body?.mode === "PAYROLL_RUN" ? "PAYROLL_RUN" : "EMPLOYEE";

    if (mode === "PAYROLL_RUN") {
      const parsed = createPayrollRunSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
          { status: 422 }
        );
      }

      const data = parsed.data;
      const item = await db.payrollRun.create({
        data: {
          organizationId,
          periodMonth: data.periodMonth,
          status: data.status,
          grossAmount: data.grossAmount,
          netAmount: data.netAmount,
          employeeCount: data.employeeCount,
          processedAt: data.processedAt ? new Date(data.processedAt) : null,
        },
      });

      return NextResponse.json({ item, payrollRun: item }, { status: 201 });
    }

    const parsed = createEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.employee.create({
      data: {
        organizationId,
        fullName: data.fullName,
        roleTitle: data.roleTitle || null,
        phone: data.phone || null,
        baseSalary: data.baseSalary,
        status: data.status,
      },
    });

    return NextResponse.json({ item, employee: item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/paie error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
