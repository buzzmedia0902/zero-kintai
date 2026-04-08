"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, TrendingUp } from "lucide-react";
import {
  calculateWorkHours,
  formatHours,
  formatTimeFromISO,
} from "@/lib/attendance-utils";

interface Attendance {
  id: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  breakStart: string | null;
  breakEnd: string | null;
}

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  const fetchAttendances = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/attendance?year=${year}&month=${month}`);
    const data = await res.json();
    setAttendances(data.attendances || []);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  const totalWorkHours = attendances.reduce((sum, a) => {
    const { workHours } = calculateWorkHours(a.clockIn, a.clockOut, a.breakStart, a.breakEnd);
    return sum + workHours;
  }, 0);

  const totalOvertimeHours = attendances.reduce((sum, a) => {
    const { overtimeHours } = calculateWorkHours(a.clockIn, a.clockOut, a.breakStart, a.breakEnd);
    return sum + overtimeHours;
  }, 0);

  const workDays = attendances.filter((a) => a.clockOut).length;

  function changeMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    else if (newMonth < 1) { newMonth = 12; newYear--; }
    setMonth(newMonth);
    setYear(newYear);
  }

  const dayOfWeek = (dateStr: string) => {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return days[new Date(dateStr).getDay()];
  };

  const statCards = [
    { label: "出勤日数", value: `${workDays}日`, icon: CalendarDays, gradient: "from-indigo-500 to-blue-500" },
    { label: "総労働時間", value: formatHours(totalWorkHours), icon: Clock, gradient: "from-emerald-500 to-teal-500" },
    { label: "残業時間", value: formatHours(totalOvertimeHours), icon: TrendingUp, gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">勤務記録</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => changeMonth(-1)} className="glass border-white/30 hover:bg-white/40">前月</Button>
          <span className="font-medium min-w-[120px] text-center text-gray-700">{year}年{month}月</span>
          <Button variant="outline" size="sm" onClick={() => changeMonth(1)} className="glass border-white/30 hover:bg-white/40">翌月</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass rounded-2xl p-5 glass-card">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-gray-500 font-medium">{card.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-0.5">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="glass rounded-2xl overflow-hidden glass-card">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-gray-500">この月の勤務記録はありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">日付</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">出勤</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">退勤</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">休憩</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">労働時間</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">残業</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {attendances.map((a) => {
                  const { workHours, overtimeHours } = calculateWorkHours(a.clockIn, a.clockOut, a.breakStart, a.breakEnd);
                  const day = parseInt(a.date.split("-")[2]);
                  const dow = dayOfWeek(a.date);
                  const isWeekend = dow === "土" || dow === "日";
                  return (
                    <tr key={a.id} className="hover:bg-white/20 transition-colors">
                      <td className={`px-5 py-3 text-sm font-medium ${isWeekend ? "text-rose-500" : "text-gray-700"}`}>
                        {day}日({dow})
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700 tabular-nums">{formatTimeFromISO(a.clockIn)}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 tabular-nums">{a.clockOut ? formatTimeFromISO(a.clockOut) : "--:--"}</td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {a.breakStart && a.breakEnd ? `${formatTimeFromISO(a.breakStart)} - ${formatTimeFromISO(a.breakEnd)}` : "-"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700 tabular-nums">{a.clockOut ? formatHours(workHours) : "-"}</td>
                      <td className="px-5 py-3 text-sm">
                        {overtimeHours > 0 ? (
                          <Badge variant="destructive" className="bg-gradient-to-r from-amber-500 to-orange-500 border-0">{formatHours(overtimeHours)}</Badge>
                        ) : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
