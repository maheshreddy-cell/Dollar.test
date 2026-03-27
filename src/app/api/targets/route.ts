import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllTargets, getTargetsForUser, createTarget, updateTarget, getUserByEmail } from '@/lib/sheets';
import { canAssignTo } from '@/lib/roles';
import { Target, Role } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view'); // 'mine' | 'team' | 'all'
  const email = searchParams.get('email') ?? session.user.email;

  if (view === 'all' && session.user.role === 'Admin') {
    return NextResponse.json(await getAllTargets());
  }

  if (view === 'team') {
    const all = await getAllTargets();
    // Return targets assigned by this user
    const team = all.filter(t => t.assignedBy.toLowerCase() === session.user.email.toLowerCase());
    return NextResponse.json(team);
  }

  // Default: targets assigned to the queried user
  return NextResponse.json(await getTargetsForUser(email));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { assignedTo, period, revenueTarget, incentiveStructure, notes } = body;

  if (!assignedTo || !period || !revenueTarget) {
    return NextResponse.json({ error: 'assignedTo, period, revenueTarget are required' }, { status: 400 });
  }

  // Verify the target recipient exists and the assigner has permission
  const targetUser = await getUserByEmail(assignedTo);
  if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

  if (!canAssignTo(session.user.role, targetUser.role as Role)) {
    return NextResponse.json({ error: 'You cannot assign targets to this role' }, { status: 403 });
  }

  // Non-admins can only assign to their direct reports
  if (session.user.role !== 'Admin' && targetUser.managerEmail !== session.user.email) {
    return NextResponse.json({ error: 'You can only assign targets to your direct reports' }, { status: 403 });
  }

  const now = new Date().toISOString();
  const target: Target = {
    targetId: uuidv4(),
    assignedTo,
    assignedBy: session.user.email,
    period,
    revenueTarget: Number(revenueTarget),
    incentiveStructure: (Number(incentiveStructure ?? 1) as 1 | 2 | 3),
    notes: notes ?? '',
    createdAt: now,
    updatedAt: now,
  };

  await createTarget(target);
  return NextResponse.json(target, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { targetId, ...updates } = body;
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 });

  // Only allow updating non-ownership fields
  const allowedUpdates = ['revenueTarget', 'incentiveStructure', 'notes', 'period'];
  const filtered = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowedUpdates.includes(k))
  );

  const updated = await updateTarget(targetId, filtered);
  if (!updated) return NextResponse.json({ error: 'Target not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
