/**
 * Google Sheets data layer via Apps Script web app.
 * All data operations go through APPS_SCRIPT_URL (set in env).
 * Apps Script handles reading/writing the spreadsheet directly.
 */

import { User, Target, SalesDeal } from '@/types';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL!;

async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow', // Apps Script redirects POST
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  if (!res.ok) throw new Error(`Apps Script error: ${res.status}`);
  const data = await res.json();
  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error(data.error as string);
  }
  return data as T;
}

// ─── Users ────────────────────────────────────────────────────────────────────

interface SheetUser {
  Email: string; Name: string; Role: string; ManagerEmail: string;
  PasswordHash: string; InviteToken: string; InviteExpiry: string;
  Status: string; CreatedAt: string;
}

function mapUser(u: SheetUser): User {
  return {
    email: u.Email,
    name: u.Name,
    role: u.Role as User['role'],
    managerEmail: u.ManagerEmail,
    passwordHash: u.PasswordHash,
    inviteToken: u.InviteToken,
    inviteExpiry: u.InviteExpiry,
    status: u.Status as User['status'],
    createdAt: u.CreatedAt,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const raw = await call<SheetUser | null>('getUser', { email });
  return raw ? mapUser(raw) : null;
}

export async function getAllUsers(filters?: { managerEmail?: string; role?: string }): Promise<User[]> {
  const raw = await call<SheetUser[]>('getUsers', filters ?? {});
  return raw.map(mapUser);
}

export async function getUserByInviteToken(token: string): Promise<User | null> {
  const raw = await call<SheetUser | null>('getUserByToken', { token });
  return raw ? mapUser(raw) : null;
}

export async function createUser(user: User): Promise<void> {
  await call('createUser', {
    email: user.email, name: user.name, role: user.role,
    managerEmail: user.managerEmail, passwordHash: user.passwordHash,
    inviteToken: user.inviteToken, inviteExpiry: user.inviteExpiry,
    status: user.status,
  });
}

export async function updateUser(email: string, updates: Partial<User>): Promise<void> {
  await call('updateUser', {
    email,
    ...(updates.name !== undefined && { name: updates.name }),
    ...(updates.role !== undefined && { role: updates.role }),
    ...(updates.managerEmail !== undefined && { managerEmail: updates.managerEmail }),
    ...(updates.passwordHash !== undefined && { passwordHash: updates.passwordHash }),
    ...(updates.inviteToken !== undefined && { inviteToken: updates.inviteToken }),
    ...(updates.inviteExpiry !== undefined && { inviteExpiry: updates.inviteExpiry }),
    ...(updates.status !== undefined && { status: updates.status }),
  });
}

// ─── Targets ─────────────────────────────────────────────────────────────────

interface SheetTarget {
  TargetID: string; AssignedTo: string; AssignedBy: string; Period: string;
  RevenueTarget: number; IncentiveStructure: number; Notes: string;
  CreatedAt: string; UpdatedAt: string;
}

function mapTarget(t: SheetTarget): Target {
  return {
    targetId: t.TargetID,
    assignedTo: t.AssignedTo,
    assignedBy: t.AssignedBy,
    period: t.Period,
    revenueTarget: Number(t.RevenueTarget),
    incentiveStructure: Number(t.IncentiveStructure) as 1 | 2 | 3,
    notes: t.Notes,
    createdAt: t.CreatedAt,
    updatedAt: t.UpdatedAt,
  };
}

export async function getTargetsForUser(email: string): Promise<Target[]> {
  const raw = await call<SheetTarget[]>('getTargets', { assignedTo: email });
  return raw.map(mapTarget);
}

export async function getTargetsAssignedBy(email: string): Promise<Target[]> {
  const raw = await call<SheetTarget[]>('getTargets', { assignedBy: email });
  return raw.map(mapTarget);
}

export async function getAllTargets(): Promise<Target[]> {
  const raw = await call<SheetTarget[]>('getTargets', {});
  return raw.map(mapTarget);
}

export async function createTarget(target: Target): Promise<void> {
  await call('createTarget', {
    targetId: target.targetId,
    assignedTo: target.assignedTo,
    assignedBy: target.assignedBy,
    period: target.period,
    revenueTarget: target.revenueTarget,
    incentiveStructure: target.incentiveStructure,
    notes: target.notes,
  });
}

export async function updateTarget(targetId: string, updates: Partial<Target>): Promise<void> {
  await call('updateTarget', { targetId, ...updates });
}

// ─── Sales ────────────────────────────────────────────────────────────────────

interface SheetDeal {
  DealID: string; AgentEmail: string; DealDate: string;
  Revenue: number; ClientName: string; Notes: string; CreatedAt: string;
}

function mapDeal(d: SheetDeal): SalesDeal {
  return {
    dealId: d.DealID,
    agentEmail: d.AgentEmail,
    dealDate: d.DealDate,
    revenue: Number(d.Revenue),
    clientName: d.ClientName,
    notes: d.Notes,
    createdAt: d.CreatedAt,
  };
}

export async function getSalesForAgent(email: string): Promise<SalesDeal[]> {
  const raw = await call<SheetDeal[]>('getSales', { agentEmail: email });
  return raw.map(mapDeal);
}

export async function getSalesForPeriod(email: string, period: string): Promise<SalesDeal[]> {
  const raw = await call<SheetDeal[]>('getSales', { agentEmail: email, period });
  return raw.map(mapDeal);
}

export async function getAllSales(): Promise<SalesDeal[]> {
  const raw = await call<SheetDeal[]>('getAllSales');
  return raw.map(mapDeal);
}

// ─── Email (via Apps Script MailApp) ─────────────────────────────────────────

export async function sendInviteEmail(
  toEmail: string,
  toName: string,
  inviteToken: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  await call('sendInviteEmail', { toEmail, toName, inviteToken, baseUrl });
}
