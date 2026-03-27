'use client';
import { useEffect, useState } from 'react';
import { User, Role } from '@/types';
import { ROLE_LABELS, ROLE_COLORS, ASSIGNABLE_ROLES } from '@/lib/roles';
import { useSession } from 'next-auth/react';
import { UserPlus } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';

export default function UsersPage() {
  const { data: session } = useSession();
  const [period] = useState(new Date().toISOString().slice(0, 7));
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', role: 'Associate' as Role, managerEmail: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function load() {
    fetch('/api/users').then(r => r.json()).then(data => { setUsers(data); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  const assignableRoles = ASSIGNABLE_ROLES[session?.user?.role as Role ?? 'Associate'];

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (data.error) setError(data.error);
    else {
      setSuccess(`Invite sent to ${form.email}`);
      setForm({ email: '', name: '', role: 'Associate', managerEmail: '' });
      setShowForm(false);
      load();
    }
  }

  async function toggleStatus(user: User) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, status: newStatus }),
    });
    load();
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <TopBar title="Users" period={period} onPeriodChange={() => {}} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-[#0F172A]">Users</h2>
            <p className="text-sm text-[#64748B] mt-1">{users.length} users</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <UserPlus size={15} />
            Invite User
          </button>
        </div>

        {success && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">{success}</p>}

        {showForm && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-[#0F172A] mb-5">Invite New User</h3>
            <form onSubmit={handleInvite} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Full Name</label>
                <input
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required placeholder="Full name"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
                <input
                  type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required placeholder="user@example.com"
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Role</label>
                <select
                  value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white"
                >
                  {assignableRoles.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Manager Email</label>
                <input
                  type="email" value={form.managerEmail} onChange={e => setForm(f => ({ ...f, managerEmail: e.target.value }))}
                  placeholder={session?.user?.email ?? '(defaults to you)'}
                  className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
              {error && <p className="col-span-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5">{error}</p>}
              <div className="col-span-2 flex gap-3">
                <button
                  type="submit" disabled={submitting}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  {submitting ? 'Sending…' : 'Send Invite'}
                </button>
                <button
                  type="button" onClick={() => setShowForm(false)}
                  className="border border-[#E2E8F0] text-[#475569] px-5 py-2.5 rounded-lg text-sm hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 animate-pulse h-48" />
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  {['User','Role','Manager','Status',''].map(h => (
                    <th key={h} className={`px-5 py-3 text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8] ${h === '' ? '' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {users.map(u => (
                  <tr key={u.email} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#0F172A]">{u.name}</p>
                      <p className="text-xs text-[#94A3B8]">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-[#64748B]">{u.managerEmail || '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'active' ? 'bg-green-50 text-green-600'
                        : u.status === 'invited' ? 'bg-amber-50 text-amber-600'
                        : 'bg-gray-50 text-gray-400'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {u.status !== 'invited' && (
                        <button
                          onClick={() => toggleStatus(u)}
                          className="text-xs text-[#64748B] hover:text-[#0F172A] underline"
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
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
