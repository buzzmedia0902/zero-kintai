"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatHours } from "@/lib/attendance-utils";
import { Download } from "lucide-react";

interface ReportRow { name: string; email: string; workDays: number; totalWorkHours: number; totalOvertimeHours: number; paidLeaveRemaining: number; paidLeaveTotal: number; }

export default function ReportsPage() {
  const [report, setReport] = useState<ReportRow[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reports?year=${year}&month=${month}`);
    const data = await res.json(); setReport(data.report || []); setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  function changeMonth(delta: number) {
    let m = month + delta, y = year;
    if (m > 12) { m = 1; y++; } else if (m < 1) { m = 12; y--; }
    setMonth(m); setYear(y);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">月次レポート</h1>
        <button onClick={() => window.open(`/api/admin/reports?year=${year}&month=${month}&format=csv`, "_blank")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass border-white/30 text-gray-700 text-sm font-medium hover:bg-white/50 transition-all">
          <Download className="w-4 h-4" /> CSV出力
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => changeMonth(-1)} className="glass border-white/30 hover:bg-white/40">前月</Button>
        <span className="font-medium min-w-[120px] text-center text-gray-700">{year}年{month}月</span>
        <Button variant="outline" size="sm" onClick={() => changeMonth(1)} className="glass border-white/30 hover:bg-white/40">翌月</Button>
      </div>

      <div className="glass rounded-2xl overflow-hidden glass-card">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/30">
                {["氏名", "出勤日数", "総労働時間", "残業時間", "有給残日数"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-white/20">
                {report.map((row) => (
                  <tr key={row.email} className="hover:bg-white/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">{row.name.slice(0, 1)}</div>
                        <span className="text-sm font-medium text-gray-800">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{row.workDays}日</td>
                    <td className="px-5 py-3.5 text-sm text-gray-700 tabular-nums">{formatHours(row.totalWorkHours)}</td>
                    <td className="px-5 py-3.5 text-sm">
                      {row.totalOvertimeHours > 0 ? <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">{formatHours(row.totalOvertimeHours)}</Badge> : <span className="text-gray-500">0:00</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{row.paidLeaveRemaining} / {row.paidLeaveTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
