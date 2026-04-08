"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Clock, Coffee, LogOut as LogOutIcon } from "lucide-react";

interface AttendanceData {
  id: string;
  clockIn: string;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CurrentTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center">
      <p className="text-6xl sm:text-7xl font-bold tabular-nums tracking-tight gradient-text">
        {time.toLocaleTimeString("ja-JP", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </p>
      <p className="text-gray-500 mt-2 text-sm">
        {time.toLocaleDateString("ja-JP", {
          year: "numeric",
          month: "long",
          day: "numeric",
          weekday: "long",
        })}
      </p>
    </div>
  );
}

export default function ClockPage() {
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAttendance = useCallback(async () => {
    const res = await fetch("/api/attendance/clock");
    const data = await res.json();
    setAttendance(data.attendance);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  async function handleAction(action: string) {
    setActionLoading(true);
    const res = await fetch("/api/attendance/clock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    const data = await res.json();
    setActionLoading(false);

    if (!res.ok) {
      toast.error(data.error);
      return;
    }

    const messages: Record<string, string> = {
      "clock-in": "出勤しました",
      "clock-out": "退勤しました",
      "break-start": "休憩を開始しました",
      "break-end": "休憩を終了しました",
    };

    toast.success(messages[action]);
    fetchAttendance();
  }

  const status = !attendance
    ? "未出勤"
    : attendance.clockOut
      ? "退勤済み"
      : attendance.breakStart && !attendance.breakEnd
        ? "休憩中"
        : "出勤中";

  const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
    未出勤: { color: "text-gray-600", bg: "bg-gray-100/60", dot: "bg-gray-400" },
    出勤中: { color: "text-emerald-600", bg: "bg-emerald-50/60", dot: "bg-emerald-500" },
    休憩中: { color: "text-amber-600", bg: "bg-amber-50/60", dot: "bg-amber-500" },
    退勤済み: { color: "text-blue-600", bg: "bg-blue-50/60", dot: "bg-blue-500" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pt-4">
      {/* Time display */}
      <div className="glass rounded-3xl p-8 glass-card">
        <CurrentTime />
      </div>

      {/* Status & Actions */}
      <div className="glass rounded-3xl p-6 glass-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">本日の勤怠</h2>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig[status].bg} ${statusConfig[status].color}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusConfig[status].dot} animate-pulse`} />
            {status}
          </span>
        </div>

        {/* Time info */}
        {attendance && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">出勤</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatTime(attendance.clockIn)}
              </p>
            </div>
            <div className="glass rounded-2xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">退勤</p>
              <p className="text-2xl font-bold text-gray-800">
                {attendance.clockOut ? formatTime(attendance.clockOut) : "--:--"}
              </p>
            </div>
            {attendance.breakStart && (
              <>
                <div className="glass rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">休憩開始</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {formatTime(attendance.breakStart)}
                  </p>
                </div>
                <div className="glass rounded-2xl p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">休憩終了</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {attendance.breakEnd ? formatTime(attendance.breakEnd) : "--:--"}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          {!attendance && (
            <button
              className="relative w-full h-20 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 btn-pulse overflow-hidden flex items-center justify-center gap-3"
              onClick={() => handleAction("clock-in")}
              disabled={actionLoading}
            >
              <Clock className="w-6 h-6" />
              出勤する
            </button>
          )}

          {attendance && !attendance.clockOut && (
            <>
              <button
                className="relative w-full h-20 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xl font-bold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 btn-pulse overflow-hidden flex items-center justify-center gap-3"
                onClick={() => handleAction("clock-out")}
                disabled={actionLoading}
              >
                <LogOutIcon className="w-6 h-6" />
                退勤する
              </button>

              {!attendance.breakStart && (
                <button
                  className="w-full h-14 rounded-2xl glass border border-amber-200/50 text-amber-700 font-medium hover:bg-amber-50/50 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  onClick={() => handleAction("break-start")}
                  disabled={actionLoading}
                >
                  <Coffee className="w-5 h-5" />
                  休憩開始
                </button>
              )}

              {attendance.breakStart && !attendance.breakEnd && (
                <button
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-medium shadow-lg shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  onClick={() => handleAction("break-end")}
                  disabled={actionLoading}
                >
                  <Coffee className="w-5 h-5" />
                  休憩終了
                </button>
              )}
            </>
          )}

          {attendance?.clockOut && (
            <div className="text-center py-6">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass text-gray-600 font-medium">
                <span className="text-lg">本日の勤務は終了しました</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
