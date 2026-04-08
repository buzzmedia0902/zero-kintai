import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const today = getTodayDateString();

  const [users, todayAttendances, pendingLeaveRequests, pendingCorrections] =
    await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      }),
      prisma.attendance.findMany({
        where: { date: today },
        include: { user: { select: { id: true, name: true } } },
      }),
      prisma.leaveRequest.count({ where: { status: "PENDING" } }),
      prisma.attendanceCorrection.count({ where: { status: "PENDING" } }),
    ]);

  const attendanceMap = new Map(
    todayAttendances.map((a) => [a.userId, a])
  );

  const employeeStatus = users.map((user) => {
    const attendance = attendanceMap.get(user.id);
    let status = "未出勤";
    if (attendance) {
      if (attendance.clockOut) {
        status = "退勤済み";
      } else if (attendance.breakStart && !attendance.breakEnd) {
        status = "休憩中";
      } else {
        status = "出勤中";
      }
    }
    return {
      ...user,
      status,
      clockIn: attendance?.clockIn || null,
      clockOut: attendance?.clockOut || null,
    };
  });

  return NextResponse.json({
    employeeStatus,
    pendingLeaveRequests,
    pendingCorrections,
    totalEmployees: users.length,
    presentToday: todayAttendances.filter((a) => !a.clockOut).length,
  });
}
