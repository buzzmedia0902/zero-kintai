"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

interface LeaveRequestWithUser {
  id: string; leaveType: string; startDate: string; endDate: string;
  reason: string | null; status: string; createdAt: string;
  user: { name: string; email: string }; approvedBy: { name: string } | null;
}

const LEAVE_TYPE_LABELS: Record<string, string> = { PAID: "有給休暇", SUBSTITUTE: "振替休日", SPECIAL: "特別休暇", ABSENCE: "欠勤" };

export default function AdminLeavePage() {
  const [requests, setRequests] = useState<LeaveRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/admin/leave"); const data = await res.json();
    setRequests(data.requests || []); setLoading(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleAction(requestId: string, action: "approve" | "reject") {
    const res = await fetch("/api/admin/leave", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId, action }) });
    if (res.ok) { toast.success(action === "approve" ? "承認しました" : "却下しました"); fetchRequests(); } else { const data = await res.json(); toast.error(data.error); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  const pending = requests.filter((r) => r.status === "PENDING");
  const processed = requests.filter((r) => r.status !== "PENDING");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">休暇承認</h1>

      {pending.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden glass-card border-amber-200/30">
          <div className="px-5 py-4 border-b border-white/30">
            <h2 className="text-base font-semibold text-gray-800">承認待ち（{pending.length}件）</h2>
          </div>
          <div className="divide-y divide-white/20">
            {pending.map((req) => (
              <div key={req.id} className="px-5 py-4 hover:bg-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">{req.user.name.slice(0, 1)}</div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{req.user.name}</p>
                      <p className="text-xs text-gray-500">{LEAVE_TYPE_LABELS[req.leaveType]} - {req.startDate} 〜 {req.endDate}</p>
                      {req.reason && <p className="text-xs text-gray-400 mt-0.5">{req.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAction(req.id, "approve")} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"><Check className="w-4 h-4" /></button>
                    <button onClick={() => handleAction(req.id, "reject")} className="p-2 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl overflow-hidden glass-card">
        <div className="px-5 py-4 border-b border-white/30"><h2 className="text-base font-semibold text-gray-800">処理済み</h2></div>
        {processed.length === 0 ? (
          <div className="p-12 text-center text-gray-500">処理済みの申請はありません</div>
        ) : (
          <div className="divide-y divide-white/20">
            {processed.map((req) => (
              <div key={req.id} className="px-5 py-4 hover:bg-white/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-bold">{req.user.name.slice(0, 1)}</div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{req.user.name}</p>
                      <p className="text-xs text-gray-500">{LEAVE_TYPE_LABELS[req.leaveType]} - {req.startDate} 〜 {req.endDate}</p>
                    </div>
                  </div>
                  <Badge className={req.status === "APPROVED" ? "bg-emerald-100/60 text-emerald-700 border-0" : "bg-rose-100/60 text-rose-700 border-0"}>
                    {req.status === "APPROVED" ? "承認済み" : "却下"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
