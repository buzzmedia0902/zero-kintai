"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { calculateWorkHours, formatHours, formatTimeFromISO } from "@/lib/attendance-utils";

interface Attendance { id: string; date: string; clockIn: string; clockOut: string | null; breakStart: string | null; breakEnd: string | null; user: { name: string }; }
interface Employee { id: string; name: string; }

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedUser, setSelectedUser] = useState("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [attRes, empRes] = await Promise.all([fetch(`/api/admin/attendance?year=${year}&month=${month}&userId=${selectedUser}`), fetch("/api/admin/employees")]);
    const attData = await attRes.json(); const empData = await empRes.json();
    setAttendances(attData.attendances || []); setEmployees(empData.employees || []); setLoading(false);
  }, [year, month, selectedUser]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">勤怠管理</h1>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => changeMonth(-1)} className="glass border-white/30 hover:bg-white/40">前月</Button>
          <span className="font-medium min-w-[120px] text-center text-gray-700">{year}年{month}月</span>
          <Button variant="outline" size="sm" onClick={() => changeMonth(1)} className="glass border-white/30 hover:bg-white/40">翌月</Button>
        </div>
        <Select value={selectedUser} onValueChange={(v) => setSelectedUser(v || "all")}>
          <SelectTrigger className="w-[200px] glass border-white/30"><SelectValue placeholder="従業員を選択" /></SelectTrigger>
          <SelectContent className="glass-strong border-white/30">
            <SelectItem value="all">全員</SelectItem>
            {employees.map((emp) => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-2xl overflow-hidden glass-card">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : attendances.length === 0 ? (
          <div className="p-12 text-center text-gray-500">勤怠記録はありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/30">
                {["日付", "氏名", "出勤", "退勤", "労働時間", "残業"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-white/20">
                {attendances.map((a) => {
                  const { workHours, overtimeHours } = calculateWorkHours(a.clockIn, a.clockOut, a.breakStart, a.breakEnd);
                  return (
                    <tr key={a.id} className="hover:bg-white/20 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-700">{a.date}</td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-800">{a.user.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 tabular-nums">{formatTimeFromISO(a.clockIn)}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 tabular-nums">{a.clockOut ? formatTimeFromISO(a.clockOut) : "--:--"}</td>
                      <td className="px-5 py-3 text-sm text-gray-700 tabular-nums">{a.clockOut ? formatHours(workHours) : "-"}</td>
                      <td className="px-5 py-3 text-sm">{overtimeHours > 0 ? <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">{formatHours(overtimeHours)}</Badge> : "-"}</td>
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
