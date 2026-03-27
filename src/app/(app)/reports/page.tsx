'use client';
import { useEffect, useState } from 'react';
import { User, CommissionResult } from '@/types';
import { formatCurrency } from '@/lib/incentives';
import { ROLE_LABELS } from '@/lib/roles';
import TopBar from '@/components/layout/TopBar';

export default function ReportsPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [users, setUsers] = useState<User[]>([]);
  const [results, setResults] = useState<CommissionResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setUsers);
  }, []);

  async function runReport() {
    setLoading(true);
    const rows = await Promise.all(
      users.map(u =>
        fetch(`/api/commission?agentEmail=${encodeURIComponent(u.email)}&period=${period}`).then(r => r.json())
      )
    );
    setResults(rows.filter((r): r is CommissionResult => !('error' in r)));
    setLoading(false);
  }

  const totalTarget = results.reduce((s, r) => s + r.revenueTarget, 0);
  const totalRevenue = results.reduce((s, r) => s + r.totalRevenue, 0);
  const totalCommission = results.reduce((s, r) => s + r.commission, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Reports" period={period} onPeriodChange={setPeriod} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#0F172A]">Reports</h2>
            <p className="text-sm text-[#64748B] mt-1">Team revenue vs target for {period}</p>
          </div>
          <button
            onClick={runReport}
            disabled={loading || users.length === 0}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
        </div>

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Target', value: formatCurrency(totalTarget), color: 'text-[#0F172A]' },
                { label: 'Total Revenue', value: formatCurrency(totalRevenue), sub: totalTarget > 0 ? `${Math.round(totalRevenue/totalTarget*100)}% of target` : undefined, color: 'text-[#0F172A]' },
                { label: 'Total Commission', value: formatCurrency(totalCommission), color: 'text-green-600' },
              ].map(c => (
                <div key={c.label} className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                  <p className="text-xs font-semibold tracking-widest uppercase text-[#94A3B8]">{c.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</p>
                  {c.sub && <p className="text-xs text-[#94A3B8] mt-0.5">{c.sub}</p>}
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {['Agent','Role','Target','Revenue','Achievement','Slab','Commission'].map(h => (
                      <th key={h} className={`px-5 py-3 text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8] ${['Target','Revenue','Achievement','Commission'].includes(h) ? 'text-right' : h === 'Slab' ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {results.sort((a,b) => b.totalRevenue - a.totalRevenue).map(r => {
                    const user = users.find(u => u.email === r.agentEmail);
                    const pct = r.achievementPct;
                    return (
                      <tr key={r.agentEmail} className="hover:bg-[#F8FAFC]">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#0F172A]">{user?.name ?? r.agentEmail}</p>
                          <p className="text-xs text-[#94A3B8]">{r.agentEmail}</p>
                        </td>
                        <td className="px-5 py-4 text-[#64748B] text-xs">{user ? ROLE_LABELS[user.role] : '—'}</td>
                        <td className="px-5 py-4 text-right text-[#64748B]">{r.revenueTarget > 0 ? formatCurrency(r.revenueTarget) : '—'}</td>
                        <td className="px-5 py-4 text-right font-semibold text-[#0F172A]">{formatCurrency(r.totalRevenue)}</td>
                        <td className={`px-5 py-4 text-right font-semibold ${pct >= 100 ? 'text-green-600' : pct >= 75 ? 'text-blue-600' : pct > 0 ? 'text-amber-500' : 'text-[#94A3B8]'}`}>
                          {r.revenueTarget > 0 ? `${pct}%` : '—'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{r.incentiveStructure}</span>
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-green-600">
                          {r.commission > 0 ? formatCurrency(r.commission) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
