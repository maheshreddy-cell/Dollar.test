import { NextRequest, NextResponse } from 'next/server';
import { getUserByInviteToken, updateUser } from '@/lib/sheets';
import bcrypt from 'bcryptjs';

// GET /api/users/invite?token=xxx — validate token
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

  const user = await getUserByInviteToken(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

  if (user.inviteExpiry && new Date(user.inviteExpiry) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 });
  }

  return NextResponse.json({ email: user.email, name: user.name, role: user.role });
}

// POST /api/users/invite — set password and activate
export async function POST(req: NextRequest) {
  const { token, password } = await req.json();
  if (!token || !password) return NextResponse.json({ error: 'token and password required' }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const user = await getUserByInviteToken(token);
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

  if (user.inviteExpiry && new Date(user.inviteExpiry) < new Date()) {
    return NextResponse.json({ error: 'Token expired' }, { status: 410 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await updateUser(user.email, {
    passwordHash,
    status: 'active',
    inviteToken: '',
    inviteExpiry: '',
  });

  return NextResponse.json({ success: true });
}
