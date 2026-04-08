import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { attendanceId, correctedClockIn, correctedClockOut, reason } =
    await request.json();

  if (!attendanceId || !correctedClockIn || !reason) {
    return NextResponse.json(
      { error: "必須項目が入力されていません" },
      { status: 400 }
    );
  }

  const attendance = await prisma.attendance.findFirst({
    where: { id: attendanceId, userId: session.user.id },
  });

  if (!attendance) {
    return NextResponse.json(
      { error: "勤怠記録が見つかりません" },
      { status: 404 }
    );
  }

  const correction = await prisma.attendanceCorrection.create({
    data: {
      attendanceId,
      userId: session.user.id,
      correctedClockIn: new Date(correctedClockIn),
      correctedClockOut: correctedClockOut
        ? new Date(correctedClockOut)
        : null,
      reason,
    },
  });

  return NextResponse.json({ success: true, correction });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const corrections = await prisma.attendanceCorrection.findMany({
    where: { userId: session.user.id },
    include: { attendance: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ corrections });
}
