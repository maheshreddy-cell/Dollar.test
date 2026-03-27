'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Eye, ChevronDown, Calendar, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface TopBarProps {
  title: string;
  period: string;         // YYYY-MM
  onPeriodChange: (p: string) => void;
  viewAs?: string;        // email of impersonated user (admin only)
  onViewAsChange?: (email: string) => void;
  teamMembers?: { email: string; name: string }[];
}

function daysLeftInMonth(period: string): number {
  const [y, m] = period.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const today = new Date();
  if (today.getFullYear() === y && today.getMonth() + 1 === m) {
    return lastDay - today.getDate();
  }
  return 0;
}

function formatPeriod(period: string): string {
  const [y, m] = period.split('-');
  return new Date(Number(y), Number(m) - 1, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });
}

export default function TopBar({
  title, period, onPeriodChange, viewAs, onViewAsChange, teamMembers = [],
}: TopBarProps) {
  const { data: session } = useSession();
  const [showViewAs, setShowViewAs] = useState(false);
  const daysLeft = daysLeftInMonth(period);
  const isAdmin = session?.user?.role === 'Admin';

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center px-6 gap-4 flex-shrink-0">
      {/* Page title */}
      <h1 className="text-lg font-semibold text-[#0F172A] flex-1">{title}</h1>

      {/* View as (Admin only) */}
      {isAdmin && onViewAsChange && (
        <div className="relative">
          <button
            onClick={() => setShowViewAs(v => !v)}
            className="flex items-center gap-2 text-sm text-[#475569] border border-[#E2E8F0] rounded-lg px-3 py-1.5 hover:bg-[#F8FAFC] transition-colors"
          >
            <Eye size={15} />
            <span>{viewAs ? teamMembers.find(m => m.email === viewAs)?.name ?? viewAs : 'View as...'}</span>
            <ChevronDown size={14} />
          </button>
          {showViewAs && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg z-50 py-1">
              <button
                onClick={() => { onViewAsChange(''); setShowViewAs(false); }}
                className="w-full text-left px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC]"
              >
                Myself (Admin)
              </button>
              {teamMembers.map(m => (
                <button
                  key={m.email}
                  onClick={() => { onViewAsChange(m.email); setShowViewAs(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Month picker */}
      <div className="flex items-center gap-2 text-sm text-[#475569]">
        <span className="font-medium text-[#0F172A]">Month</span>
        <div className="flex items-center gap-1.5 border border-[#E2E8F0] rounded-lg px-3 py-1.5 hover:bg-[#F8FAFC]">
          <input
            type="month"
            value={period}
            onChange={e => onPeriodChange(e.target.value)}
            className="text-sm text-[#0F172A] bg-transparent outline-none cursor-pointer"
          />
          <Calendar size={14} className="text-[#94A3B8]" />
        </div>
      </div>

      {/* Days left badge */}
      {daysLeft > 0 && (
        <span className="text-xs font-medium bg-[#FEF9C3] text-[#854D0E] px-3 py-1 rounded-full flex items-center gap-1">
          ⏳ {daysLeft} days left in {formatPeriod(period).split(' ')[0]}
        </span>
      )}

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <LogOut size={15} />
        Logout
      </button>
    </header>
  );
}
