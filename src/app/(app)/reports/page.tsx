'use client';
import { useEffect, useState } from 'react';
import { User, CommissionResult } from '@/types';
import { formatCurrency } from '@/lib/incentives';
import { ROLE_LABELS } from '@/lib/roles';

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
      users.map(async u => {
        const res = await fetch(`/api/commission?agentEmail=${encodeURIComponent(u.email)}&period=${period}`);
        return res.json() as Promise<CommissionResult>;
      })
    );
    setResults(rows.filter(r => !('error' in r)));
    setLoading(false);
  }

  const totalRevenue = results.reduce((s, r) => s + r.totalRevenue, 0);
  const totalCommission = results.reduce((s, r) => s + r.commission, 0);
  const totalTarget = results.reduce((s, r) => s + r.revenueTarget, 0);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="text-sm text-gray-500 mt-1">Team revenue vs target summary</p>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="month"
          value={period}
          onChange={e => setPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={runReport}
          disabled={loading || users.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
        >
          {loading ? 'Loading…' : 'Generate Report'}
        </button>
      </div>

      {results.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Target</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalTarget)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
              {totalTarget > 0 && (
                <p className="text-xs text-gray-400 mt-1">{Math.round(totalRevenue/totalTarget*100)}% of target</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Commission</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalCommission)}</p>
            </div>
          </div>

          {/* Detail table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-600 font-medium">Agent</th>
                  <th className="text-right px-5 py-3 text-gray-600 font-medium">Target</th>
                  <th className="text-right px-5 py-3 text-gray-600 font-medium">Revenue</th>
                  <th className="text-right px-5 py-3 text-gray-600 font-medium">Achievement</th>
                  <th className="text-center px-5 py-3 text-gray-600 font-medium">Structure</th>
                  <th className="text-right px-5 py-3 text-gray-600 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .map(r => {
                    const user = users.find(u => u.email === r.agentEmail);
                    return (
                      <tr key={r.agentEmail} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{user?.name ?? r.agentEmail}</p>
                          <p className="text-xs text-gray-400">{r.agentEmail}</p>
                          {user && <p className="text-xs text-gray-400">{ROLE_LABELS[user.role]}</p>}
                        </td>
                        <td className="px-5 py-4 text-right text-gray-600">
                          {r.revenueTarget > 0 ? formatCurrency(r.revenueTarget) : '—'}
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-gray-900">
                          {formatCurrency(r.totalRevenue)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {r.revenueTarget > 0 ? (
                            <span className={`font-medium ${r.achievementPct >= 100 ? 'text-green-600' : r.achievementPct >= 75 ? 'text-blue-600' : 'text-red-500'}`}>
                              {r.achievementPct}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {r.incentiveStructure}
                          </span>
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
    </div>
  );
}
