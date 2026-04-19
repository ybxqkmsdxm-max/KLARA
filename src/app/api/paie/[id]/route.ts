import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAuthSession, requireRole } from "@/lib/auth-helper";

const updateEmployeeSchema = z.object({
  fullName: z.string().min(2).optional(),
  roleTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  baseSalary: z.number().int().min(0).optional(),
  status: z.enum(["ACTIF", "INACTIF"]).optional(),
});

const updatePayrollRunSchema = z.object({
  mode: z.literal("PAYROLL_RUN").optional(),
  periodMonth: z.string().min(7).optional(),
  status: z.enum(["BROUILLON", "CALCULE", "VALIDE", "PAYE"]).optional(),
  grossAmount: z.number().int().min(0).optional(),
  netAmount: z.number().int().min(0).optional(),
  employeeCount: z.number().int().min(0).optional(),
  processedAt: z.string().nullable().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId, session } = await getAuthSession();
    if (error) return error;
    const roleError = await requireRole(organizationId, session.user.id, ["OWNER", "ADMIN"]);
    if (roleError) return roleError;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "PAYROLL_RUN" ? "PAYROLL_RUN" : "EMPLOYEE";

    const body = await request.json();

    if (mode === "PAYROLL_RUN") {
      const existingRun = await db.payrollRun.findFirst({ where: { id, organizationId } });
      if (!existingRun) return NextResponse.json({ error: "Run de paie non trouve" }, { status: 404 });

      const parsed = updatePayrollRunSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
          { status: 422 }
        );
      }

      const data = parsed.data;
      const item = await db.payrollRun.update({
        where: { id },
        data: {
          ...(data.periodMonth ? { periodMonth: data.periodMonth } : {}),
          ...(data.status ? { status: data.status } : {}),
          ...(data.grossAmount !== undefined ? { grossAmount: data.grossAmount } : {}),
          ...(data.netAmount !== undefined ? { netAmount: data.netAmount } : {}),
          ...(data.employeeCount !== undefined ? { employeeCount: data.employeeCount } : {}),
          ...(data.processedAt !== undefined ? { processedAt: data.processedAt ? new Date(data.processedAt) : null } : {}),
        },
      });

      return NextResponse.json({ item });
    }

    const existingEmployee = await db.employee.findFirst({ where: { id, organizationId } });
    if (!existingEmployee) return NextResponse.json({ error: "Employe non trouve" }, { status: 404 });

    const parsed = updateEmployeeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Donnees invalides", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const data = parsed.data;
    const item = await db.employee.update({
      where: { id },
      data: {
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.roleTitle !== undefined ? { roleTitle: data.roleTitle } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.baseSalary !== undefined ? { baseSalary: data.baseSalary } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PUT /api/paie/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { error, organizationId, session } = await getAuthSession();
    if (error) return error;
    const roleError = await requireRole(organizationId, session.user.id, ["OWNER", "ADMIN"]);
    if (roleError) return roleError;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "PAYROLL_RUN" ? "PAYROLL_RUN" : "EMPLOYEE";

    if (mode === "PAYROLL_RUN") {
      const existingRun = await db.payrollRun.findFirst({ where: { id, organizationId } });
      if (!existingRun) return NextResponse.json({ error: "Run de paie non trouve" }, { status: 404 });
      await db.payrollRun.delete({ where: { id } });
      return NextResponse.json({ success: true, id });
    }

    const existingEmployee = await db.employee.findFirst({ where: { id, organizationId } });
    if (!existingEmployee) return NextResponse.json({ error: "Employe non trouve" }, { status: 404 });
    await db.employee.delete({ where: { id } });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("DELETE /api/paie/[id] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
