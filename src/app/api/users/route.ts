import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllUsers, createUser, updateUser, getUserByEmail } from '@/lib/sheets';
import { sendInviteEmail } from '@/lib/mailer';
import { canManageUsers, ASSIGNABLE_ROLES } from '@/lib/roles';
import { User, Role } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filterRole = searchParams.get('role') as Role | null;
  const filterManager = searchParams.get('managerEmail');

  let users = await getAllUsers();

  // Non-admins only see their direct reports
  if (session.user.role !== 'Admin') {
    users = users.filter(u => u.managerEmail === session.user.email);
  }

  if (filterRole) users = users.filter(u => u.role === filterRole);
  if (filterManager) users = users.filter(u => u.managerEmail === filterManager);

  // Strip password hashes before returning
  return NextResponse.json(users.map(u => ({ ...u, passwordHash: '' })));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { email, name, role, managerEmail } = body as Partial<User>;

  if (!email || !name || !role) {
    return NextResponse.json({ error: 'email, name, role are required' }, { status: 400 });
  }

  // Verify assigner can assign this role
  const assignableRoles = ASSIGNABLE_ROLES[session.user.role];
  if (!assignableRoles.includes(role as Role)) {
    return NextResponse.json({ error: 'You cannot create a user with that role' }, { status: 403 });
  }

  // Check email not already used
  const existing = await getUserByEmail(email);
  if (existing) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });

  const inviteToken = uuidv4();
  const inviteExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const newUser: User = {
    email,
    name,
    role: role as Role,
    managerEmail: managerEmail ?? session.user.email,
    passwordHash: '',
    inviteToken,
    inviteExpiry,
    status: 'invited',
    createdAt: new Date().toISOString(),
  };

  await createUser(newUser);

  try {
    await sendInviteEmail(email, name, inviteToken);
  } catch {
    // Non-fatal: user created but email failed
  }

  return NextResponse.json({ success: true, inviteToken }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await req.json();
  const { email, ...updates } = body;
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

  delete updates.passwordHash; // Never update password hash via this endpoint
  const updated = await updateUser(email, updates);
  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
