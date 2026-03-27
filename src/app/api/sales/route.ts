import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllSales, getSalesForAgent, getSalesForPeriod, getSalesDetails } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const agentEmail = searchParams.get('agentEmail');
  const period = searchParams.get('period'); // YYYY-MM

  // Admins / SalesHead / VH can see all or by agent
  if (['Admin', 'SalesHead', 'VH'].includes(session.user.role)) {
    if (agentEmail && period) {
      return NextResponse.json(await getSalesForPeriod(agentEmail, period));
    }
    if (agentEmail) {
      return NextResponse.json(await getSalesForAgent(agentEmail));
    }
    return NextResponse.json(await getAllSales());
  }

  // Manager: can see their direct reports
  if (session.user.role === 'Manager') {
    const email = agentEmail ?? session.user.email;
    if (period) return NextResponse.json(await getSalesForPeriod(email, period));
    return NextResponse.json(await getSalesForAgent(email));
  }

  // Associate: only their own sales
  const email = session.user.email;
  if (period) return NextResponse.json(await getSalesForPeriod(email, period));
  return NextResponse.json(await getSalesForAgent(email));
}
