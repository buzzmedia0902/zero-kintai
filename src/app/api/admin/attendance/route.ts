import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";

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
  const userId = searchParams.get("userId");

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

  const where: Record<string, unknown> = {
    date: { gte: startDate, lte: endDate },
  };

  if (userId && userId !== "all") {
    where.userId = userId;
  }

  const attendances = await prisma.attendance.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: [{ date: "asc" }, { clockIn: "asc" }],
  });

  return NextResponse.json({ attendances });
}
