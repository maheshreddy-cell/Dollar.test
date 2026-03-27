'use client';
import { useEffect, useState } from 'react';
import { User } from '@/types';
import { ROLE_LABELS, ROLE_COLORS, ROLE_ORDER } from '@/lib/roles';
import TopBar from '@/components/layout/TopBar';

export default function OrgPage() {
  const [period] = useState(new Date().toISOString().slice(0, 7));
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(data => { setUsers(data); setLoading(false); });
  }, []);

  // Group by role level
  const byRole = [...ROLE_ORDER].reverse().map(role => ({
    role,
    members: users.filter(u => u.role === role),
  })).filter(g => g.members.length > 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Org Chart" period={period} onPeriodChange={() => {}} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-[#0F172A]">Org Chart</h2>
          <p className="text-sm text-[#64748B] mt-1">{users.length} people across {byRole.length} levels</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-5 h-24 animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-4">
            {byRole.map(({ role, members }) => (
              <div key={role} className="bg-white border border-[#E2E8F0] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[role]}`}>
                    {ROLE_LABELS[role]}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{members.length} {members.length === 1 ? 'person' : 'people'}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {members.map(u => (
                    <div key={u.email} className="border border-[#E2E8F0] rounded-lg p-3">
                      <p className="font-semibold text-sm text-[#0F172A]">{u.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{u.email}</p>
                      {u.managerEmail && (
                        <p className="text-xs text-[#CBD5E1] mt-1 truncate">↑ {u.managerEmail}</p>
                      )}
                      <span className={`inline-block mt-2 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        u.status === 'active' ? 'bg-green-50 text-green-600'
                        : u.status === 'invited' ? 'bg-amber-50 text-amber-600'
                        : 'bg-gray-50 text-gray-400'
                      }`}>
                        {u.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
