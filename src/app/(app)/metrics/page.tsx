'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import TopBar from '@/components/layout/TopBar';
import { CommissionResult } from '@/types';
import { formatCurrency, INCENTIVE_STRUCTURES } from '@/lib/incentives';

export default function MetricsPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [commission, setCommission] = useState<CommissionResult | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    const r = await fetch(`/api/commission?agentEmail=${encodeURIComponent(session.user.email)}&period=${period}`).then(x => x.json());
    setCommission(r.error ? null : r);
    setLoading(false);
  }, [session?.user?.email, period]);

  useEffect(() => { load(); }, [load]);

  const structure = commission?.incentiveStructure ?? 1;
  const slabs = INCENTIVE_STRUCTURES[structure as 1|2|3];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Metrics" period={period} onPeriodChange={setPeriod} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">My Metrics</h2>
          <p className="text-sm text-[#64748B] mt-1">Detailed performance breakdown for {period}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2].map(i => <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-6 h-40 animate-pulse" />)}
          </div>
        ) : !commission ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center text-[#94A3B8]">
            No target assigned for this period.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Performance card */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
              <h3 className="text-sm font-semibold text-[#0F172A] mb-4">Performance Summary</h3>
              <div className="space-y-3">
                {[
                  { label: 'Revenue Target', value: formatCurrency(commission.revenueTarget) },
                  { label: 'Revenue Achieved', value: formatCurrency(commission.totalRevenue) },
                  { label: 'Achievement', value: `${commission.achievementPct}%` },
                  { label: 'Commission Earned', value: formatCurrency(commission.commission), highlight: true },
                  { label: 'Incentive Structure', value: `Structure ${commission.incentiveStructure}` },
                  { label: 'Applied Slab Rate',  value: commission.applicableSlab ? `${(commission.applicableSlab.rate * 100).toFixed(1)}%` : 'Below minimum' },
                ].map(row => (
                  <div key={row.label} className={`flex justify-between py-2 border-b border-[#F1F5F9] last:border-0 ${row.highlight ? 'font-semibold' : ''}`}>
                    <span className="text-sm text-[#64748B]">{row.label}</span>
                    <span className={`text-sm ${row.highlight ? 'text-green-600' : 'text-[#0F172A]'}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-5">
                <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                  <span>Progress</span>
                  <span>{commission.achievementPct}%</span>
                </div>
                <div className="w-full bg-[#F1F5F9] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      commission.achievementPct >= 100 ? 'bg-green-500'
                      : commission.achievementPct >= 75 ? 'bg-blue-500'
                      : commission.achievementPct >= 50 ? 'bg-amber-400'
                      : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(commission.achievementPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Slab table */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#E2E8F0]">
                <h3 className="text-sm font-semibold text-[#0F172A]">Structure {structure} — Commission Slabs</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Revenue ≥</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Rate</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {slabs.map(slab => {
                    const isActive = commission.applicableSlab?.revenue === slab.revenue;
                    return (
                      <tr key={slab.revenue} className={isActive ? 'bg-blue-50' : 'hover:bg-[#F8FAFC]'}>
                        <td className={`px-5 py-3 ${isActive ? 'font-semibold text-blue-700' : 'text-[#475569]'}`}>
                          ₹{slab.revenue.toLocaleString('en-IN')}
                        </td>
                        <td className={`px-5 py-3 text-right font-semibold ${isActive ? 'text-blue-700' : 'text-[#2563EB]'}`}>
                          {(slab.rate * 100).toFixed(1)}%
                        </td>
                        <td className={`px-5 py-3 text-right ${isActive ? 'font-semibold text-blue-700' : 'text-[#64748B]'}`}>
                          {formatCurrency(Math.round(slab.revenue * slab.rate))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
