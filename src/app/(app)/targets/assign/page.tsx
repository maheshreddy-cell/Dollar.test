'use client';
import { useEffect, useState } from 'react';
import { User } from '@/types';
import { ROLE_LABELS } from '@/lib/roles';
import { INCENTIVE_STRUCTURES } from '@/lib/incentives';

export default function AssignTargetPage() {
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
    setSubmitting(true);
    setError('');
    setSuccess('');

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
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assign Target</h2>
        <p className="text-sm text-gray-500 mt-1">Set a revenue target for a team member</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select
              value={form.assignedTo}
              onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a team member…</option>
              {team.filter(u => u.status === 'active').map(u => (
                <option key={u.email} value={u.email}>
                  {u.name} ({ROLE_LABELS[u.role]}) — {u.email}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period (Month)</label>
              <input
                type="month"
                value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Target (₹)</label>
              <input
                type="number"
                value={form.revenueTarget}
                onChange={e => setForm(f => ({ ...f, revenueTarget: e.target.value }))}
                required
                min={0}
                step={1000}
                placeholder="e.g. 1000000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Incentive Structure</label>
            <div className="grid grid-cols-3 gap-3">
              {([1,2,3] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, incentiveStructure: String(s) }))}
                  className={`border rounded-lg p-3 text-sm text-left transition-colors ${
                    form.incentiveStructure === String(s)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium block">Structure {s}</span>
                  <span className="text-xs text-gray-500">
                    {s === 1 ? '1st month' : s === 2 ? '2nd month' : '3rd month'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Show selected structure slabs */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Structure {form.incentiveStructure} Slabs</p>
            <div className="space-y-1">
              {slabs.map(slab => (
                <div key={slab.revenue} className="flex justify-between text-xs text-gray-600">
                  <span>≥ ₹{slab.revenue.toLocaleString('en-IN')}</span>
                  <span className="font-medium">{(slab.rate * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Any additional context…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {submitting ? 'Assigning…' : 'Assign Target'}
          </button>
        </form>
      </div>
    </div>
  );
}
