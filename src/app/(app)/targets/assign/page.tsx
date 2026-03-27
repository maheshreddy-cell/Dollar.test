'use client';
import { useEffect, useState } from 'react';
import { User } from '@/types';
import { ROLE_LABELS } from '@/lib/roles';
import { INCENTIVE_STRUCTURES, formatCurrency } from '@/lib/incentives';
import TopBar from '@/components/layout/TopBar';

export default function AssignTargetPage() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [team, setTeam] = useState<User[]>([]);
  const [form, setForm] = useState({
    assignedTo: '',
    period: new Date().toISOString().slice(0, 7),
    revenueTarget: '',
    incentiveStructure: '1',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setTeam);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    const res = await fetch('/api/targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        revenueTarget: Number(form.revenueTarget),
        incentiveStructure: Number(form.incentiveStructure),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.error) setError(data.error);
    else {
      setSuccess('Target assigned successfully!');
      setForm(f => ({ ...f, assignedTo: '', revenueTarget: '', notes: '' }));
    }
  }

  const slabs = INCENTIVE_STRUCTURES[Number(form.incentiveStructure) as 1|2|3];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Assign Targets" period={period} onPeriodChange={setPeriod} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">Assign Target</h2>
          <p className="text-sm text-[#64748B] mt-1">Set a revenue target for a team member</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Form */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Team Member</label>
                <select
                  value={form.assignedTo}
                  onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  required
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
                >
                  <option value="">Select team member…</option>
                  {team.filter(u => u.status === 'active').map(u => (
                    <option key={u.email} value={u.email}>
                      {u.name} ({ROLE_LABELS[u.role]})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">Period</label>
                  <input
                    type="month"
                    value={form.period}
                    onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                    required
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">Revenue Target (₹)</label>
                  <input
                    type="number"
                    value={form.revenueTarget}
                    onChange={e => setForm(f => ({ ...f, revenueTarget: e.target.value }))}
                    required min={0} step={10000}
                    placeholder="e.g. 1000000"
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Incentive Structure</label>
                <div className="grid grid-cols-3 gap-2">
                  {([1,2,3] as const).map(s => (
                    <button
                      key={s} type="button"
                      onClick={() => setForm(f => ({ ...f, incentiveStructure: String(s) }))}
                      className={`border rounded-lg p-3 text-left text-sm transition-all ${
                        form.incentiveStructure === String(s)
                          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1] text-[#475569]'
                      }`}
                    >
                      <span className="font-semibold block">Structure {s}</span>
                      <span className="text-xs opacity-70">{s === 1 ? '1st month' : s === 2 ? '2nd month' : '3rd month'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any additional context…"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}
              {success && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">{success}</p>}

              <button
                type="submit" disabled={submitting}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
              >
                {submitting ? 'Assigning…' : 'Assign Target'}
              </button>
            </form>
          </div>

          {/* Slab preview */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-[#E2E8F0]">
              <p className="text-sm font-semibold text-[#0F172A]">Structure {form.incentiveStructure} Slabs</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Revenue ≥</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Rate</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {slabs.map(slab => (
                  <tr key={slab.revenue} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-3 text-[#475569]">₹{slab.revenue.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 text-right font-semibold text-[#2563EB]">{(slab.rate * 100).toFixed(1)}%</td>
                    <td className="px-5 py-3 text-right text-[#64748B]">{formatCurrency(Math.round(slab.revenue * slab.rate))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
