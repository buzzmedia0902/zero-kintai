import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { calculateWorkHours } from "@/lib/attendance-utils";

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const yesterday = getYesterdayDateString();

  // Find missing clock-outs from yesterday
  const missingClockOuts = await prisma.attendance.findMany({
    where: {
      date: yesterday,
      clockOut: null,
    },
    include: { user: { select: { name: true, email: true } } },
  });

  // Find users with high overtime this month
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

  const monthAttendances = await prisma.attendance.findMany({
    where: {
      date: { gte: monthStart, lte: monthEnd },
      clockOut: { not: null },
    },
    include: { user: { select: { id: true, name: true } } },
  });

  const overtimeByUser = new Map<string, { name: string; hours: number }>();
  for (const a of monthAttendances) {
    const { overtimeHours } = calculateWorkHours(
      a.clockIn.toISOString(),
      a.clockOut?.toISOString() || null,
      a.breakStart?.toISOString() || null,
      a.breakEnd?.toISOString() || null
    );
    const current = overtimeByUser.get(a.userId) || {
      name: a.user.name,
      hours: 0,
    };
    current.hours += overtimeHours;
    overtimeByUser.set(a.userId, current);
  }

  const overtimeAlerts = Array.from(overtimeByUser.entries())
    .filter(([, v]) => v.hours >= 20)
    .map(([userId, v]) => ({
      userId,
      name: v.name,
      overtimeHours: Math.round(v.hours * 100) / 100,
    }));

  // Low leave balance alerts
  const currentYear = now.getFullYear();
  const lowLeaveBalances = await prisma.leaveBalance.findMany({
    where: {
      fiscalYear: currentYear,
    },
    include: { user: { select: { name: true } } },
  });

  const leaveAlerts = lowLeaveBalances
    .filter((b) => b.totalDays - b.usedDays <= 3 && b.totalDays > 0)
    .map((b) => ({
      name: b.user.name,
      remaining: b.totalDays - b.usedDays,
    }));

  return NextResponse.json({
    missingClockOuts: missingClockOuts.map((a) => ({
      name: a.user.name,
      date: a.date,
    })),
    overtimeAlerts,
    leaveAlerts,
  });
}
