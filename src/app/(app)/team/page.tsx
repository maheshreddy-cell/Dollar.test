'use client';
import { useEffect, useState } from 'react';
import { User, CommissionResult } from '@/types';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/roles';
import { formatCurrency } from '@/lib/incentives';

function ProgressBar({ pct }: { pct: number }) {
  const capped = Math.min(pct, 100);
  const color = pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400';
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5">
      <div className={`${color} h-1.5 rounded-full`} style={{ width: `${capped}%` }} />
    </div>
  );
}

interface MemberRow {
  user: User;
  commission?: CommissionResult;
}

export default function TeamPage() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const period = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(async (users: User[]) => {
        const rows: MemberRow[] = await Promise.all(
          users.map(async (user) => {
            const res = await fetch(`/api/commission?agentEmail=${encodeURIComponent(user.email)}&period=${period}`);
            const commission = await res.json() as CommissionResult & { error?: string };
            return { user, commission: commission.error ? undefined : commission as CommissionResult };
          })
        );
        setMembers(rows);
        setLoading(false);
      });
  }, [period]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Team</h2>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} performance
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No team members found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Member</th>
                <th className="text-left px-5 py-3 text-gray-600 font-medium">Role</th>
                <th className="text-right px-5 py-3 text-gray-600 font-medium">Target</th>
                <th className="text-right px-5 py-3 text-gray-600 font-medium">Achieved</th>
                <th className="px-5 py-3 text-gray-600 font-medium w-32">Progress</th>
                <th className="text-right px-5 py-3 text-gray-600 font-medium">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map(({ user, commission }) => (
                <tr key={user.email} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600">
                    {commission?.revenueTarget ? formatCurrency(commission.revenueTarget) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right text-gray-900 font-medium">
                    {commission ? formatCurrency(commission.totalRevenue) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    {commission && commission.revenueTarget > 0 ? (
                      <div>
                        <ProgressBar pct={commission.achievementPct} />
                        <p className="text-xs text-gray-400 mt-1 text-center">{commission.achievementPct}%</p>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-green-600">
                    {commission?.commission ? formatCurrency(commission.commission) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
