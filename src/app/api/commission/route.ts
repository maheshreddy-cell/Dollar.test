import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSalesForPeriod, getTargetsForUser } from '@/lib/sheets';
import { calculateCommission } from '@/lib/incentives';
import { CommissionResult } from '@/types';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentEmail = searchParams.get('agentEmail') ?? session.user.email;
  const period = searchParams.get('period');

  if (!period) return NextResponse.json({ error: 'period (YYYY-MM) is required' }, { status: 400 });

  // Associates can only see their own commission
  if (session.user.role === 'Associate' && agentEmail !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [sales, targets] = await Promise.all([
    getSalesForPeriod(agentEmail, period),
    getTargetsForUser(agentEmail),
  ]);

  const periodTarget = targets.find(t => t.period === period);
  const totalRevenue = sales.reduce((sum, d) => sum + d.revenue, 0);
  const structure = periodTarget?.incentiveStructure ?? 1;
  const { slab, commission } = calculateCommission(totalRevenue, structure);

  const result: CommissionResult = {
    agentEmail,
    period,
    totalRevenue,
    revenueTarget: periodTarget?.revenueTarget ?? 0,
    incentiveStructure: structure,
    applicableSlab: slab ? { revenue: slab.revenue, rate: slab.rate } : null,
    commission,
    achievementPct: periodTarget?.revenueTarget
      ? Math.round((totalRevenue / periodTarget.revenueTarget) * 100)
      : 0,
  };

  return NextResponse.json(result);
}
