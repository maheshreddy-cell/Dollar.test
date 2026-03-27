'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Target } from '@/types';
import { formatCurrency } from '@/lib/incentives';
import TopBar from '@/components/layout/TopBar';

export default function MyTargetsPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/targets').then(r => r.json()).then(data => { setTargets(data); setLoading(false); });
  }, []);

  const filtered = targets.filter(t => !period || t.period === period);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="My Targets" period={period} onPeriodChange={setPeriod} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">My Targets</h2>
          <p className="text-sm text-[#64748B] mt-1">Targets assigned to {session?.user?.name}</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-5 h-20 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center text-[#94A3B8]">
            No targets assigned for this period.
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Period</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Target</th>
                  <th className="px-6 py-3 text-center text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Structure</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Notes</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Assigned By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.sort((a,b) => b.period.localeCompare(a.period)).map(t => (
                  <tr key={t.targetId} className="hover:bg-[#F8FAFC]">
                    <td className="px-6 py-4 font-medium text-[#0F172A]">
                      {new Date(t.period + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#0F172A]">{formatCurrency(t.revenueTarget)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                        Structure {t.incentiveStructure}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#64748B]">{t.notes || '—'}</td>
                    <td className="px-6 py-4 text-[#64748B] text-xs">{t.assignedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
