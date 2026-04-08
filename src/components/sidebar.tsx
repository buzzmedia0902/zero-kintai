"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Clock,
  CalendarDays,
  Palmtree,
  LayoutDashboard,
  Users,
  ClipboardList,
  FileCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  userName: string;
  userRole: string;
}

const employeeLinks = [
  { href: "/", label: "打刻", icon: Clock },
  { href: "/attendance", label: "勤務記録", icon: CalendarDays },
  { href: "/leave", label: "休暇管理", icon: Palmtree },
];

const adminLinks = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/employees", label: "従業員管理", icon: Users },
  { href: "/admin/attendance", label: "勤怠管理", icon: ClipboardList },
  { href: "/admin/leave", label: "休暇承認", icon: FileCheck },
  { href: "/admin/reports", label: "レポート", icon: BarChart3 },
];

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = isAdmin
    ? [...employeeLinks, { divider: true } as never, ...adminLinks]
    : employeeLinks;

  const initials = userName.slice(0, 2);

  const navContent = (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-bold gradient-text">勤怠管理</h1>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1">
        {employeeLinks.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                  : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4.5 h-4.5" />
              {link.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                管理者メニュー
              </p>
            </div>
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                      : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {link.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div className="p-3 mt-auto">
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">
                {userName}
              </p>
              <p className="text-[11px] text-gray-500">
                {isAdmin ? "管理者" : "社員"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-2 flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-500 hover:bg-red-50/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            ログアウト
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 glass-strong rounded-r-2xl z-40">
        {navContent}
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold gradient-text">勤怠管理</h1>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            {mobileOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-64 glass-strong z-50 flex flex-col animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
        </>
      )}
    </>
  );
}
