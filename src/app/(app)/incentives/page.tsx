'use client';
import { useState } from 'react';
import { INCENTIVE_STRUCTURES, formatCurrency } from '@/lib/incentives';
import TopBar from '@/components/layout/TopBar';

const STRUCTURE_LABELS: Record<1|2|3, string> = {
  1: '1st Month',
  2: '2nd Month',
  3: '3rd Month',
};

export default function CommissionConfigPage() {
  const [period] = useState(new Date().toISOString().slice(0, 7));
  const [simRevenue, setSimRevenue] = useState('');
  const [simStructure, setSimStructure] = useState<1|2|3>(1);

  const amount = parseFloat(simRevenue) || 0;
  let simSlab = null;
  if (amount > 0) {
    for (const slab of INCENTIVE_STRUCTURES[simStructure]) {
      if (amount >= slab.revenue) simSlab = slab;
    }
  }
  const simCommission = simSlab ? Math.round(amount * simSlab.rate) : 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Commission Config" period={period} onPeriodChange={() => {}} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">Commission Configuration</h2>
          <p className="text-sm text-[#64748B] mt-1">Three incentive structures with revenue-based slabs</p>
        </div>

        {/* 3 slab tables */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {([1,2,3] as const).map(s => (
            <div key={s} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center justify-between">
                <p className="font-semibold text-sm text-[#0F172A]">Structure {s}</p>
                <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2.5 py-1 rounded-full">{STRUCTURE_LABELS[s]}</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#F1F5F9]">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Revenue ≥</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F8FAFC]">
                  {INCENTIVE_STRUCTURES[s].map(slab => (
                    <tr key={slab.revenue} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-2.5 text-[#475569]">₹{slab.revenue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#2563EB]">{(slab.rate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Commission calculator */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 max-w-md">
          <h3 className="font-semibold text-[#0F172A] mb-4">Commission Calculator</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Revenue Achieved (₹)</label>
              <input
                type="number" value={simRevenue}
                onChange={e => setSimRevenue(e.target.value)}
                placeholder="e.g. 1200000" min={0} step={10000}
                className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Structure</label>
              <div className="flex gap-2">
                {([1,2,3] as const).map(s => (
                  <button
                    key={s} onClick={() => setSimStructure(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      simStructure === s
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {amount > 0 && (
              <div className="bg-[#F8FAFC] rounded-lg p-4 space-y-2 border border-[#E2E8F0]">
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Revenue</span>
                  <span className="font-medium text-[#0F172A]">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#64748B]">Applied slab</span>
                  <span className="font-medium text-[#0F172A]">
                    {simSlab ? `${(simSlab.rate * 100).toFixed(1)}% (≥ ₹${simSlab.revenue.toLocaleString('en-IN')})` : 'Below minimum'}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-[#E2E8F0] pt-2">
                  <span className="font-semibold text-[#0F172A]">Commission</span>
                  <span className="font-bold text-green-600 text-base">{formatCurrency(simCommission)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
