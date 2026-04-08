export function calculateWorkHours(
  clockIn: string,
  clockOut: string | null,
  breakStart: string | null,
  breakEnd: string | null
): { workHours: number; overtimeHours: number } {
  if (!clockOut) {
    return { workHours: 0, overtimeHours: 0 };
  }

  const start = new Date(clockIn).getTime();
  const end = new Date(clockOut).getTime();
  let totalMs = end - start;

  if (breakStart && breakEnd) {
    const bStart = new Date(breakStart).getTime();
    const bEnd = new Date(breakEnd).getTime();
    totalMs -= bEnd - bStart;
  } else {
    // Default 1 hour break
    totalMs -= 60 * 60 * 1000;
  }

  const workHours = Math.max(0, totalMs / (1000 * 60 * 60));
  const overtimeHours = Math.max(0, workHours - 8);

  return {
    workHours: Math.round(workHours * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
  };
}

export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function formatTimeFromISO(iso: string): string {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
