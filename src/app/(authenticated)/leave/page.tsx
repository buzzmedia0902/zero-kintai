"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Palmtree, Plus } from "lucide-react";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  createdAt: string;
}

interface LeaveBalance {
  fiscalYear: number;
  totalDays: number;
  usedDays: number;
}

const LEAVE_TYPE_LABELS: Record<string, string> = {
  PAID: "有給休暇", SUBSTITUTE: "振替休日", SPECIAL: "特別休暇", ABSENCE: "欠勤",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "承認待ち", className: "bg-amber-100/60 text-amber-700 border-0" },
  APPROVED: { label: "承認済み", className: "bg-emerald-100/60 text-emerald-700 border-0" },
  REJECTED: { label: "却下", className: "bg-rose-100/60 text-rose-700 border-0" },
};

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [leaveType, setLeaveType] = useState("PAID");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/leave");
    const data = await res.json();
    setRequests(data.requests || []);
    setBalances(data.balances || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    const res = await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveType, startDate, endDate, reason }),
    });
    const data = await res.json();
    setFormLoading(false);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("休暇申請を送信しました");
    setDialogOpen(false);
    setLeaveType("PAID"); setStartDate(""); setEndDate(""); setReason("");
    fetchData();
  }

  const currentBalance = balances.find((b) => b.fiscalYear === new Date().getFullYear());
  const remaining = currentBalance ? currentBalance.totalDays - currentBalance.usedDays : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">休暇管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" />
            休暇申請
          </DialogTrigger>
          <DialogContent className="glass-strong rounded-2xl border-white/30">
            <DialogHeader>
              <DialogTitle className="text-gray-800">休暇申請</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-700">休暇種別</Label>
                <Select value={leaveType} onValueChange={(v) => setLeaveType(v || "PAID")}>
                  <SelectTrigger className="glass border-white/30"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong border-white/30">
                    <SelectItem value="PAID">有給休暇</SelectItem>
                    <SelectItem value="SUBSTITUTE">振替休日</SelectItem>
                    <SelectItem value="SPECIAL">特別休暇</SelectItem>
                    <SelectItem value="ABSENCE">欠勤</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">開始日</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="glass border-white/30" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">終了日</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="glass border-white/30" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">理由</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="休暇の理由を入力（任意）" className="glass border-white/30" />
              </div>
              <button type="submit" disabled={formLoading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-60">
                {formLoading ? "送信中..." : "申請する"}
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave balance */}
      {currentBalance && (
        <div className="glass rounded-2xl p-6 glass-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Palmtree className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">有給休暇残日数（{currentBalance.fiscalYear}年度）</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-600">{remaining}日</span>
                <span className="text-sm text-gray-500">/ {currentBalance.totalDays}日</span>
              </div>
            </div>
          </div>
          <div className="h-2 rounded-full bg-gray-200/50 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all" style={{ width: `${(remaining / currentBalance.totalDays) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Requests */}
      <div className="glass rounded-2xl overflow-hidden glass-card">
        <div className="px-5 py-4 border-b border-white/30">
          <h2 className="text-base font-semibold text-gray-800">申請履歴</h2>
        </div>
        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">休暇申請はありません</div>
        ) : (
          <div className="divide-y divide-white/20">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status];
              return (
                <div key={req.id} className="px-5 py-4 hover:bg-white/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-800">{LEAVE_TYPE_LABELS[req.leaveType]}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{req.startDate} 〜 {req.endDate}</p>
                      {req.reason && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{req.reason}</p>}
                    </div>
                    <Badge className={cfg.className}>{cfg.label}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
