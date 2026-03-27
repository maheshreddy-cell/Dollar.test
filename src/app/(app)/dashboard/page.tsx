'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CommissionResult } from '@/types';
import { formatCurrency } from '@/lib/incentives';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const capped = Math.min(pct, 100);
  const color = pct >= 100 ? 'bg-green-500' : pct >= 75 ? 'bg-blue-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400';
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5">
      <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${capped}%` }} />
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [commission, setCommission] = useState<CommissionResult | null>(null);
  const [loading, setLoading] = useState(true);

  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/commission?agentEmail=${encodeURIComponent(session.user.email)}&period=${currentPeriod}`)
      .then(r => r.json())
      .then(data => { setCommission(data); setLoading(false); });
  }, [session, currentPeriod]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} — {session?.user?.name}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-24 animate-pulse" />)}
        </div>
      ) : commission ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Revenue Target"
              value={commission.revenueTarget > 0 ? formatCurrency(commission.revenueTarget) : '—'}
              sub={`Structure ${commission.incentiveStructure}`}
            />
            <StatCard
              label="Revenue Achieved"
              value={formatCurrency(commission.totalRevenue)}
              sub={commission.revenueTarget > 0 ? `${commission.achievementPct}% of target` : undefined}
            />
            <StatCard
              label="Estimated Commission"
              value={commission.commission > 0 ? formatCurrency(commission.commission) : '₹0'}
              sub={commission.applicableSlab
                ? `@ ${(commission.applicableSlab.rate * 100).toFixed(1)}% slab`
                : 'Below minimum slab'}
            />
          </div>

          {commission.revenueTarget > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Target Achievement</span>
                <span className="font-medium">{commission.achievementPct}%</span>
              </div>
              <ProgressBar pct={commission.achievementPct} />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>₹0</span>
                <span>{formatCurrency(commission.revenueTarget)}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No target data available for this month.
        </div>
      )}
    </div>
  );
}
