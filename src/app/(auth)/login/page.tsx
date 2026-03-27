'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError('Invalid email or password.');
    else router.push('/dashboard');
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2563EB]">Dollar.v2</h1>
          <p className="text-sm text-[#64748B] mt-2">Target Management Platform</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-1">Sign in</h2>
          <p className="text-sm text-[#64748B] mb-6">Enter your email and password to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Email address</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
                placeholder="you@company.com"
                className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Password</label>
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-[#E2E8F0] rounded-lg text-sm text-[#0F172A] placeholder:text-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-shadow"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          Don&apos;t have an account? Contact your manager to receive an invite.
        </p>
      </div>
    </div>
  );
}
