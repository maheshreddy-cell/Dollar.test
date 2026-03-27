'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Target as TargetIcon, TrendingUp, DollarSign, Percent } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { CommissionResult } from '@/types';
import { formatCurrency } from '@/lib/incentives';

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, valueColor }: StatCardProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={22} className={iconColor} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${valueColor ?? 'text-[#0F172A]'}`}>{value}</p>
      </div>
    </div>
  );
}

interface TopPerformer {
  name: string;
  email: string;
  target: number;
  achieved: number;
  pct: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [viewAs, setViewAs] = useState('');
  const [commission, setCommission] = useState<CommissionResult | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [teamMembers, setTeamMembers] = useState<{ email: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const activeEmail = viewAs || session?.user?.email || '';

  const load = useCallback(async () => {
    if (!activeEmail) return;
    setLoading(true);
    const [commRes, teamRes] = await Promise.all([
      fetch(`/api/commission?agentEmail=${encodeURIComponent(activeEmail)}&period=${period}`).then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
    ]);
    setCommission(commRes.error ? null : commRes);
    setTeamMembers((teamRes as { email: string; name: string }[]) ?? []);

    // Top performers: fetch commission for each team member
    if (Array.isArray(teamRes) && teamRes.length > 0) {
      const results = await Promise.all(
        teamRes.map(async (u: { email: string; name: string }) => {
          const r = await fetch(`/api/commission?agentEmail=${encodeURIComponent(u.email)}&period=${period}`).then(x => x.json());
          return {
            name: u.name,
            email: u.email,
            target: r.revenueTarget ?? 0,
            achieved: r.totalRevenue ?? 0,
            pct: r.achievementPct ?? 0,
          };
        })
      );
      setTopPerformers(results.sort((a, b) => b.achieved - a.achieved));
    }
    setLoading(false);
  }, [activeEmail, period]);

  useEffect(() => { load(); }, [load]);

  const displayName = viewAs
    ? teamMembers.find(m => m.email === viewAs)?.name ?? viewAs
    : session?.user?.name ?? '';

  const pctColor = (commission?.achievementPct ?? 0) >= 100
    ? 'text-green-600'
    : (commission?.achievementPct ?? 0) >= 75
      ? 'text-blue-600'
      : 'text-red-500';

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar
        title="Dashboard"
        period={period}
        onPeriodChange={setPeriod}
        viewAs={viewAs}
        onViewAsChange={setViewAs}
        teamMembers={teamMembers}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">Welcome back, {displayName}</h2>
          <p className="text-sm text-[#64748B] mt-1">Here&apos;s your overview for {period}</p>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Total Target"
              value={commission?.revenueTarget ? formatCurrency(commission.revenueTarget) : '₹0'}
              icon={TargetIcon}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <StatCard
              label="Achieved"
              value={commission ? formatCurrency(commission.totalRevenue) : '₹0'}
              icon={TrendingUp}
              iconBg="bg-green-50"
              iconColor="text-green-500"
            />
            <StatCard
              label="Commission Earned"
              value={commission?.commission ? formatCurrency(commission.commission) : '₹0'}
              icon={DollarSign}
              iconBg="bg-purple-50"
              iconColor="text-purple-500"
            />
            <StatCard
              label="Achievement %"
              value={`${commission?.achievementPct ?? 0}%`}
              icon={Percent}
              iconBg="bg-red-50"
              iconColor="text-red-400"
              valueColor={pctColor}
            />
          </div>
        )}

        {/* Top Performers */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h3 className="text-sm font-semibold text-[#0F172A]">
              Top Performers — {period}
            </h3>
          </div>
          {topPerformers.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[#94A3B8]">
              {loading ? 'Loading…' : 'No team data available for this period.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8] w-12">#</th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Name</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Target</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">Achieved</th>
                  <th className="px-6 py-3 text-right text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {topPerformers.map((p, i) => (
                  <tr key={p.email} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 text-[#94A3B8]">{i + 1}</td>
                    <td className="px-6 py-4 font-semibold text-[#0F172A]">{p.name}</td>
                    <td className="px-6 py-4 text-right text-[#64748B]">
                      {p.target > 0 ? formatCurrency(p.target) : <span className="text-[#CBD5E1]">₹0</span>}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-[#0F172A]">
                      {formatCurrency(p.achieved)}
                    </td>
                    <td className={`px-6 py-4 text-right font-semibold ${
                      p.pct >= 100 ? 'text-green-600' : p.pct > 0 ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
                    }`}>
                      {p.pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
