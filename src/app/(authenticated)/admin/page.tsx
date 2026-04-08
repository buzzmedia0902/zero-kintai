"use client";

import { useState, useEffect } from "react";
import { Users, UserCheck, FileText, Edit3, AlertTriangle } from "lucide-react";

interface EmployeeStatus {
  id: string;
  name: string;
  email: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
}

interface DashboardData {
  employeeStatus: EmployeeStatus[];
  pendingLeaveRequests: number;
  pendingCorrections: number;
  totalEmployees: number;
  presentToday: number;
}

interface AlertData {
  missingClockOuts: { name: string; date: string }[];
  overtimeAlerts: { name: string; overtimeHours: number }[];
  leaveAlerts: { name: string; remaining: number }[];
}

const statusStyles: Record<string, { dot: string; text: string; bg: string }> = {
  出勤中: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50/60" },
  退勤済み: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50/60" },
  休憩中: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50/60" },
  未出勤: { dot: "bg-gray-400", text: "text-gray-500", bg: "bg-gray-50/60" },
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<AlertData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then(setData);
    fetch("/api/admin/alerts").then((r) => r.json()).then(setAlerts);
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "総従業員数", value: `${data.totalEmployees}名`, icon: Users, gradient: "from-indigo-500 to-blue-500" },
    { label: "本日出勤中", value: `${data.presentToday}名`, icon: UserCheck, gradient: "from-emerald-500 to-teal-500" },
    { label: "休暇申請", value: `${data.pendingLeaveRequests}件`, icon: FileText, gradient: "from-amber-500 to-orange-500" },
    { label: "打刻修正", value: `${data.pendingCorrections}件`, icon: Edit3, gradient: "from-rose-500 to-pink-500" },
  ];

  const hasAlerts = alerts && (alerts.missingClockOuts.length > 0 || alerts.overtimeAlerts.length > 0 || alerts.leaveAlerts.length > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">ダッシュボード</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Alerts */}
      {hasAlerts && (
        <div className="glass rounded-2xl p-5 border-amber-200/50 glass-card">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-800">アラート</h2>
          </div>
          <div className="space-y-2">
            {alerts.missingClockOuts.map((a, i) => (
              <div key={`mc-${i}`} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-red-50/50">
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-gray-700"><strong>{a.name}</strong> - {a.date}の退勤打刻なし</span>
              </div>
            ))}
            {alerts.overtimeAlerts.map((a, i) => (
              <div key={`ot-${i}`} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-orange-50/50">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span className="text-gray-700"><strong>{a.name}</strong> - 残業{a.overtimeHours}時間</span>
              </div>
            ))}
            {alerts.leaveAlerts.map((a, i) => (
              <div key={`la-${i}`} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-yellow-50/50">
                <span className="w-2 h-2 rounded-full bg-yellow-500 shrink-0" />
                <span className="text-gray-700"><strong>{a.name}</strong> - 有給残{a.remaining}日</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's attendance */}
      <div className="glass rounded-2xl overflow-hidden glass-card">
        <div className="px-5 py-4 border-b border-white/30">
          <h2 className="text-base font-semibold text-gray-800">本日の出勤状況</h2>
        </div>
        <div className="divide-y divide-white/20">
          {data.employeeStatus.map((emp) => {
            const style = statusStyles[emp.status] || statusStyles["未出勤"];
            return (
              <div key={emp.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-white/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                    {emp.name.slice(0, 1)}
                  </div>
                  <span className="font-medium text-gray-800 text-sm">{emp.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {emp.status}
                  </span>
                  <span className="text-xs text-gray-500 tabular-nums w-12 text-right">
                    {emp.clockIn ? new Date(emp.clockIn).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
