import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const requests = await prisma.leaveRequest.findMany({
    include: {
      user: { select: { name: true, email: true } },
      approvedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function PATCH(request: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { requestId, action } = await request.json();

  if (!requestId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const leaveRequest = await prisma.leaveRequest.findUnique({
    where: { id: requestId },
  });

  if (!leaveRequest || leaveRequest.status !== "PENDING") {
    return NextResponse.json(
      { error: "申請が見つからないか、既に処理済みです" },
      { status: 400 }
    );
  }

  const newStatus = action === "approve" ? "APPROVED" : "REJECTED";

  await prisma.leaveRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      approvedById: session!.user.id,
    },
  });

  if (action === "approve" && leaveRequest.leaveType === "PAID") {
    const start = new Date(leaveRequest.startDate);
    const end = new Date(leaveRequest.endDate);
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentYear = new Date().getFullYear();

    await prisma.leaveBalance.update({
      where: {
        userId_fiscalYear: {
          userId: leaveRequest.userId,
          fiscalYear: currentYear,
        },
      },
      data: {
        usedDays: { increment: days },
      },
    });
  }

  return NextResponse.json({ success: true });
}
