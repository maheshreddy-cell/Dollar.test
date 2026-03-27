import { google } from 'googleapis';
import { User, Target, SalesDeal, SalesDetail } from '@/types';

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;

function getAuth() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// ---------- Generic helpers ----------

async function readSheet(tab: string): Promise<string[][]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: tab,
  });
  return (res.data.values ?? []) as string[][];
}

async function appendRow(tab: string, values: string[]): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });
}

async function updateRow(
  tab: string,
  rowIndex: number, // 1-based sheet row
  values: string[]
): Promise<void> {
  const sheets = await getSheets();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${tab}!A${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  });
}

// ---------- Users ----------

const USER_COLS = ['Email','Name','Role','ManagerEmail','PasswordHash','InviteToken','InviteExpiry','Status','CreatedAt'];

function rowToUser(row: string[]): User {
  return {
    email: row[0] ?? '',
    name: row[1] ?? '',
    role: (row[2] as User['role']) ?? 'Associate',
    managerEmail: row[3] ?? '',
    passwordHash: row[4] ?? '',
    inviteToken: row[5] ?? '',
    inviteExpiry: row[6] ?? '',
    status: (row[7] as User['status']) ?? 'invited',
    createdAt: row[8] ?? '',
  };
}

function userToRow(u: User): string[] {
  return [u.email, u.name, u.role, u.managerEmail, u.passwordHash, u.inviteToken, u.inviteExpiry, u.status, u.createdAt];
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await readSheet('Users');
  return rows.slice(1).filter(r => r[0]).map(rowToUser);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getAllUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getUserByInviteToken(token: string): Promise<{ user: User; rowIndex: number } | null> {
  const rows = await readSheet('Users');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][5] === token) return { user: rowToUser(rows[i]), rowIndex: i + 1 };
  }
  return null;
}

export async function createUser(user: User): Promise<void> {
  await appendRow('Users', userToRow(user));
}

export async function updateUser(email: string, updates: Partial<User>): Promise<boolean> {
  const rows = await readSheet('Users');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.toLowerCase() === email.toLowerCase()) {
      const existing = rowToUser(rows[i]);
      const updated = { ...existing, ...updates };
      await updateRow('Users', i + 1, userToRow(updated));
      return true;
    }
  }
  return false;
}

// ---------- Targets ----------

function rowToTarget(row: string[]): Target {
  return {
    targetId: row[0] ?? '',
    assignedTo: row[1] ?? '',
    assignedBy: row[2] ?? '',
    period: row[3] ?? '',
    revenueTarget: parseFloat(row[4] ?? '0'),
    incentiveStructure: (parseInt(row[5] ?? '1') as 1 | 2 | 3),
    notes: row[6] ?? '',
    createdAt: row[7] ?? '',
    updatedAt: row[8] ?? '',
  };
}

function targetToRow(t: Target): string[] {
  return [t.targetId, t.assignedTo, t.assignedBy, t.period, String(t.revenueTarget), String(t.incentiveStructure), t.notes, t.createdAt, t.updatedAt];
}

export async function getAllTargets(): Promise<Target[]> {
  const rows = await readSheet('Targets');
  return rows.slice(1).filter(r => r[0]).map(rowToTarget);
}

export async function getTargetsForUser(email: string): Promise<Target[]> {
  const all = await getAllTargets();
  return all.filter(t => t.assignedTo.toLowerCase() === email.toLowerCase());
}

export async function getTargetsAssignedBy(email: string): Promise<Target[]> {
  const all = await getAllTargets();
  return all.filter(t => t.assignedBy.toLowerCase() === email.toLowerCase());
}

export async function createTarget(target: Target): Promise<void> {
  await appendRow('Targets', targetToRow(target));
}

export async function updateTarget(targetId: string, updates: Partial<Target>): Promise<boolean> {
  const rows = await readSheet('Targets');
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === targetId) {
      const existing = rowToTarget(rows[i]);
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      await updateRow('Targets', i + 1, targetToRow(updated));
      return true;
    }
  }
  return false;
}

// ---------- Sales ----------

function rowToSalesDeal(row: string[]): SalesDeal {
  return {
    dealId: row[0] ?? '',
    agentEmail: row[1] ?? '',
    dealDate: row[2] ?? '',
    revenue: parseFloat(row[3] ?? '0'),
    clientName: row[4] ?? '',
    notes: row[5] ?? '',
    createdAt: row[6] ?? '',
  };
}

export async function getSalesForAgent(email: string): Promise<SalesDeal[]> {
  const rows = await readSheet('SalesDone');
  return rows.slice(1)
    .filter(r => r[0] && r[1]?.toLowerCase() === email.toLowerCase())
    .map(rowToSalesDeal);
}

export async function getSalesForPeriod(email: string, period: string): Promise<SalesDeal[]> {
  const deals = await getSalesForAgent(email);
  return deals.filter(d => d.dealDate.startsWith(period));
}

export async function getAllSales(): Promise<SalesDeal[]> {
  const rows = await readSheet('SalesDone');
  return rows.slice(1).filter(r => r[0]).map(rowToSalesDeal);
}

// ---------- Sales Details ----------

function rowToSalesDetail(row: string[]): SalesDetail {
  return {
    dealId: row[0] ?? '',
    agentEmail: row[1] ?? '',
    productType: row[2] ?? '',
    stage: row[3] ?? '',
    amount: parseFloat(row[4] ?? '0'),
    period: row[5] ?? '',
    capturedAt: row[6] ?? '',
  };
}

export async function getSalesDetails(agentEmail?: string): Promise<SalesDetail[]> {
  const rows = await readSheet('SalesDetails');
  const all = rows.slice(1).filter(r => r[0]).map(rowToSalesDetail);
  if (!agentEmail) return all;
  return all.filter(d => d.agentEmail.toLowerCase() === agentEmail.toLowerCase());
}
