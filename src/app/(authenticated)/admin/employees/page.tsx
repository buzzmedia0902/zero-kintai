"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Employee { id: string; email: string; name: string; role: string; createdAt: string; }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); const [role, setRole] = useState("EMPLOYEE");

  const fetchEmployees = useCallback(async () => {
    const res = await fetch("/api/admin/employees");
    const data = await res.json();
    setEmployees(data.employees || []); setLoading(false);
  }, []);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setFormLoading(true);
    const res = await fetch("/api/admin/employees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password, role }) });
    const data = await res.json(); setFormLoading(false);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success("従業員を登録しました"); setDialogOpen(false);
    setName(""); setEmail(""); setPassword(""); setRole("EMPLOYEE"); fetchEmployees();
  }

  async function handleDelete(id: string, empName: string) {
    if (!confirm(`${empName}を削除しますか？`)) return;
    const res = await fetch(`/api/admin/employees?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("削除しました"); fetchEmployees(); } else { toast.error("削除に失敗しました"); }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">従業員管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <Plus className="w-4 h-4" /> 従業員追加
          </DialogTrigger>
          <DialogContent className="glass-strong rounded-2xl border-white/30">
            <DialogHeader><DialogTitle className="text-gray-800">従業員追加</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2"><Label className="text-gray-700">氏名</Label><Input value={name} onChange={(e) => setName(e.target.value)} required className="glass border-white/30" /></div>
              <div className="space-y-2"><Label className="text-gray-700">メールアドレス</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="glass border-white/30" /></div>
              <div className="space-y-2"><Label className="text-gray-700">パスワード</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="glass border-white/30" /></div>
              <div className="space-y-2"><Label className="text-gray-700">権限</Label>
                <Select value={role} onValueChange={(v) => setRole(v || "EMPLOYEE")}><SelectTrigger className="glass border-white/30"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-strong border-white/30"><SelectItem value="EMPLOYEE">一般社員</SelectItem><SelectItem value="ADMIN">管理者</SelectItem></SelectContent>
                </Select>
              </div>
              <button type="submit" disabled={formLoading} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60">{formLoading ? "登録中..." : "登録する"}</button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass rounded-2xl overflow-hidden glass-card">
        <div className="divide-y divide-white/20">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold">{emp.name.slice(0, 1)}</div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={emp.role === "ADMIN" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0" : "bg-gray-100/60 text-gray-600 border-0"}>
                  {emp.role === "ADMIN" ? "管理者" : "社員"}
                </Badge>
                <button onClick={() => handleDelete(emp.id, emp.name)} className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
