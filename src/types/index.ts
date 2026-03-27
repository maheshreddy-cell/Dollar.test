export type Role = 'Admin' | 'SalesHead' | 'VH' | 'Manager' | 'Associate';

export interface User {
  email: string;
  name: string;
  role: Role;
  managerEmail: string;
  passwordHash: string;
  inviteToken: string;
  inviteExpiry: string;
  status: 'active' | 'invited' | 'inactive';
  createdAt: string;
}

export interface Target {
  targetId: string;
  assignedTo: string;
  assignedBy: string;
  period: string; // YYYY-MM
  revenueTarget: number;
  incentiveStructure: 1 | 2 | 3;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesDeal {
  dealId: string;
  agentEmail: string;
  dealDate: string;
  revenue: number;
  clientName: string;
  notes: string;
  createdAt: string;
}

export interface SalesDetail {
  dealId: string;
  agentEmail: string;
  productType: string;
  stage: string;
  amount: number;
  period: string;
  capturedAt: string;
}

export interface CommissionResult {
  agentEmail: string;
  period: string;
  totalRevenue: number;
  revenueTarget: number;
  incentiveStructure: 1 | 2 | 3;
  applicableSlab: { revenue: number; rate: number } | null;
  commission: number;
  achievementPct: number;
}
