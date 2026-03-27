'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { SalesDeal } from '@/types';
import TopBar from '@/components/layout/TopBar';
import { formatCurrency } from '@/lib/incentives';

export default function DealsPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [deals, setDeals] = useState<SalesDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const url = `/api/sales?agentEmail=${encodeURIComponent(session?.user?.email ?? '')}&period=${period}`;
    const data = await fetch(url).then(r => r.json());
    setDeals(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [session?.user?.email, period]);

  useEffect(() => { load(); }, [load]);

  const totalRevenue = deals.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Deals" period={period} onPeriodChange={setPeriod} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#0F172A]">Deals</h2>
            <p className="text-sm text-[#64748B] mt-1">{deals.length} deals · {formatCurrency(totalRevenue)} total revenue</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 animate-pulse h-48" />
        ) : deals.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center text-[#94A3B8]">
            No deals found for {period}.
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  {['Deal ID','Client','Date','Revenue','Notes'].map(h => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8] ${h === 'Revenue' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {deals.map(d => (
                  <tr key={d.dealId} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4 text-xs text-[#94A3B8] font-mono">{d.dealId}</td>
                    <td className="px-5 py-4 font-medium text-[#0F172A]">{d.clientName || '—'}</td>
                    <td className="px-5 py-4 text-[#64748B]">{d.dealDate}</td>
                    <td className="px-5 py-4 text-right font-semibold text-[#0F172A]">{formatCurrency(d.revenue)}</td>
                    <td className="px-5 py-4 text-[#64748B] max-w-xs truncate">{d.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F8FAFC] border-t border-[#E2E8F0]">
                  <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-[#64748B]">Total</td>
                  <td className="px-5 py-3 text-right text-sm font-bold text-[#0F172A]">{formatCurrency(totalRevenue)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
