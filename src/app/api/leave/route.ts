import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [requests, balances] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.leaveBalance.findMany({
      where: { userId: session.user.id },
      orderBy: { fiscalYear: "desc" },
    }),
  ]);

  return NextResponse.json({ requests, balances });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { leaveType, startDate, endDate, reason } = await request.json();

  if (!leaveType || !startDate || !endDate) {
    return NextResponse.json(
      { error: "必須項目が入力されていません" },
      { status: 400 }
    );
  }

  if (leaveType === "PAID") {
    const currentYear = new Date().getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        userId_fiscalYear: {
          userId: session.user.id,
          fiscalYear: currentYear,
        },
      },
    });

    if (!balance) {
      return NextResponse.json(
        { error: "有給休暇の残日数情報がありません" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const remaining = balance.totalDays - balance.usedDays;

    if (diffDays > remaining) {
      return NextResponse.json(
        { error: `有給休暇の残日数が不足しています（残${remaining}日）` },
        { status: 400 }
      );
    }
  }

  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      leaveType,
      startDate,
      endDate,
      reason: reason || null,
    },
  });

  return NextResponse.json({ success: true, leaveRequest });
}
