'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface InviteInfo {
  email: string;
  name: string;
  role: string;
}

function InviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [tokenError, setTokenError] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setTokenError('No invite token provided.'); return; }
    fetch(`/api/users/invite?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setTokenError(data.error);
        else setInfo(data);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    setError('');

    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) setError(data.error);
    else { setDone(true); setTimeout(() => router.push('/login'), 2000); }
  }

  if (tokenError) {
    return (
      <div className="text-center">
        <p className="text-red-600 font-medium">{tokenError}</p>
        <p className="text-sm text-gray-500 mt-2">Please contact your manager for a new invite link.</p>
      </div>
    );
  }

  if (!info) return <p className="text-center text-gray-500">Validating invite…</p>;

  if (done) {
    return (
      <div className="text-center">
        <p className="text-green-600 font-medium text-lg">Account activated!</p>
        <p className="text-sm text-gray-500 mt-1">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {info.name}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {info.email} · {info.role}
        </p>
        <p className="text-sm text-gray-600 mt-3">Set a password to activate your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            placeholder="Repeat password"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Activating…' : 'Activate Account'}
        </button>
      </form>
    </>
  );
}

export default function InvitePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <Suspense fallback={<p className="text-center text-gray-500">Loading…</p>}>
          <InviteForm />
        </Suspense>
      </div>
    </div>
  );
}
