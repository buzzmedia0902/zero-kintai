import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action } = await request.json();
  const today = getTodayDateString();
  const now = new Date();

  if (action === "clock-in") {
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "本日はすでに出勤打刻済みです" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: session.user.id,
        date: today,
        clockIn: now,
      },
    });

    return NextResponse.json({ success: true, attendance });
  }

  if (action === "clock-out") {
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "本日の出勤打刻がありません" },
        { status: 400 }
      );
    }

    if (existing.clockOut) {
      return NextResponse.json(
        { error: "本日はすでに退勤打刻済みです" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: { clockOut: now },
    });

    return NextResponse.json({ success: true, attendance });
  }

  if (action === "break-start") {
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    });

    if (!existing || existing.clockOut) {
      return NextResponse.json(
        { error: "出勤中でないため休憩を開始できません" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: { breakStart: now },
    });

    return NextResponse.json({ success: true, attendance });
  }

  if (action === "break-end") {
    const existing = await prisma.attendance.findUnique({
      where: { userId_date: { userId: session.user.id, date: today } },
    });

    if (!existing || !existing.breakStart) {
      return NextResponse.json(
        { error: "休憩中ではありません" },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: { breakEnd: now },
    });

    return NextResponse.json({ success: true, attendance });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = getTodayDateString();
  const attendance = await prisma.attendance.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  return NextResponse.json({ attendance });
}
