'use client';
import { useEffect, useState, useCallback } from 'react';
import { User, CommissionResult } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles';
import { formatCurrency } from '@/lib/incentives';
import TopBar from '@/components/layout/TopBar';

interface MemberRow { user: User; commission?: CommissionResult }

export default function TeamPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const users: User[] = await fetch('/api/users').then(r => r.json());
    const rows: MemberRow[] = await Promise.all(
      users.map(async user => {
        const r = await fetch(`/api/commission?agentEmail=${encodeURIComponent(user.email)}&period=${period}`).then(x => x.json());
        return { user, commission: r.error ? undefined : r as CommissionResult };
      })
    );
    setMembers(rows);
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="My Team" period={period} onPeriodChange={setPeriod} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">My Team</h2>
          <p className="text-sm text-[#64748B] mt-1">Performance overview for {period}</p>
        </div>

        {loading ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 animate-pulse h-48" />
        ) : members.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center text-[#94A3B8]">No team members found.</div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  {['Member','Role','Target','Achieved','Progress','Commission'].map(h => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8] ${h === 'Progress' ? 'text-center w-36' : h === 'Member' || h === 'Role' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {members.map(({ user, commission: c }) => {
                  const pct = c?.achievementPct ?? 0;
                  return (
                    <tr key={user.email} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#0F172A]">{user.name}</p>
                        <p className="text-xs text-[#94A3B8]">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right text-[#64748B]">
                        {c?.revenueTarget ? formatCurrency(c.revenueTarget) : <span className="text-[#CBD5E1]">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-[#0F172A]">
                        {c ? formatCurrency(c.totalRevenue) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {c && c.revenueTarget > 0 ? (
                          <div>
                            <div className="w-full bg-[#F1F5F9] rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <p className="text-xs text-[#94A3B8] mt-1 text-center">{pct}%</p>
                          </div>
                        ) : <span className="text-[#CBD5E1] block text-center">—</span>}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-green-600">
                        {c?.commission ? formatCurrency(c.commission) : <span className="text-[#CBD5E1]">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
