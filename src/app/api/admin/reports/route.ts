import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { calculateWorkHours } from "@/lib/attendance-utils";

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const year = parseInt(
    searchParams.get("year") || String(new Date().getFullYear())
  );
  const month = parseInt(
    searchParams.get("month") || String(new Date().getMonth() + 1)
  );
  const format = searchParams.get("format");

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
  });

  const leaveBalances = await prisma.leaveBalance.findMany({
    where: { fiscalYear: year },
  });

  const report = users.map((user) => {
    const userAttendances = attendances.filter((a) => a.userId === user.id);
    const balance = leaveBalances.find((b) => b.userId === user.id);

    let totalWorkHours = 0;
    let totalOvertimeHours = 0;
    const workDays = userAttendances.filter((a) => a.clockOut).length;

    for (const a of userAttendances) {
      const { workHours, overtimeHours } = calculateWorkHours(
        a.clockIn.toISOString(),
        a.clockOut?.toISOString() || null,
        a.breakStart?.toISOString() || null,
        a.breakEnd?.toISOString() || null
      );
      totalWorkHours += workHours;
      totalOvertimeHours += overtimeHours;
    }

    return {
      name: user.name,
      email: user.email,
      workDays,
      totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      paidLeaveRemaining: balance
        ? balance.totalDays - balance.usedDays
        : 0,
      paidLeaveTotal: balance?.totalDays || 0,
    };
  });

  if (format === "csv") {
    const header =
      "氏名,メール,出勤日数,総労働時間,残業時間,有給残日数,有給付与日数";
    const rows = report.map(
      (r) =>
        `${r.name},${r.email},${r.workDays},${r.totalWorkHours},${r.totalOvertimeHours},${r.paidLeaveRemaining},${r.paidLeaveTotal}`
    );
    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=report_${year}_${month}.csv`,
      },
    });
  }

  return NextResponse.json({ report, year, month });
}
