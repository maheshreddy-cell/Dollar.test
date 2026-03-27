// Commission slab tables (revenue in ₹)
// Logic: find highest slab where actualRevenue >= slabRevenue, apply that rate to full revenue

export interface Slab {
  revenue: number;
  rate: number; // as decimal e.g. 0.01 = 1%
}

export const INCENTIVE_STRUCTURES: Record<1 | 2 | 3, Slab[]> = {
  1: [
    { revenue: 400000,  rate: 0.01 },
    { revenue: 600000,  rate: 0.02 },
    { revenue: 800000,  rate: 0.03 },
    { revenue: 900000,  rate: 0.04 },
    { revenue: 1000000, rate: 0.05 },
    { revenue: 1200000, rate: 0.06 },
    { revenue: 1400000, rate: 0.07 },
    { revenue: 1500000, rate: 0.08 },
  ],
  2: [
    { revenue: 600000,  rate: 0.01 },
    { revenue: 800000,  rate: 0.02 },
    { revenue: 900000,  rate: 0.03 },
    { revenue: 1000000, rate: 0.04 },
    { revenue: 1300000, rate: 0.05 },
    { revenue: 1500000, rate: 0.07 },
  ],
  3: [
    { revenue: 750000,  rate: 0.005 },
    { revenue: 850000,  rate: 0.01  },
    { revenue: 950000,  rate: 0.02  },
    { revenue: 1050000, rate: 0.03  },
    { revenue: 1250000, rate: 0.04  },
    { revenue: 1550000, rate: 0.06  },
  ],
};

export function calculateCommission(
  actualRevenue: number,
  structure: 1 | 2 | 3
): { slab: Slab | null; commission: number } {
  const slabs = INCENTIVE_STRUCTURES[structure];
  // Find highest slab where revenue >= slab.revenue
  let applicableSlab: Slab | null = null;
  for (const slab of slabs) {
    if (actualRevenue >= slab.revenue) {
      applicableSlab = slab;
    }
  }
  if (!applicableSlab) return { slab: null, commission: 0 };
  return {
    slab: applicableSlab,
    commission: Math.round(actualRevenue * applicableSlab.rate),
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
