'use client';
import { useState } from 'react';
import { INCENTIVE_STRUCTURES, formatCurrency } from '@/lib/incentives';

const STRUCTURE_NAMES: Record<1|2|3, string> = {
  1: 'Structure 1 — 1st Month',
  2: 'Structure 2 — 2nd Month',
  3: 'Structure 3 — 3rd Month',
};

export default function IncentivesPage() {
  const [simRevenue, setSimRevenue] = useState('');
  const [simStructure, setSimStructure] = useState<1|2|3>(1);

  const simAmount = parseFloat(simRevenue) || 0;
  let simSlab = null;
  let simCommission = 0;
  if (simAmount > 0) {
    for (const slab of INCENTIVE_STRUCTURES[simStructure]) {
      if (simAmount >= slab.revenue) simSlab = slab;
    }
    if (simSlab) simCommission = Math.round(simAmount * simSlab.rate);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Incentive Structures</h2>
        <p className="text-sm text-gray-500 mt-1">Commission slab tables and calculator</p>
      </div>

      {/* Slab tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {([1,2,3] as const).map(s => (
          <div key={s} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <p className="font-semibold text-gray-800 text-sm">{STRUCTURE_NAMES[s]}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-xs text-gray-500 font-medium">Revenue ≥</th>
                  <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Rate</th>
                  <th className="text-right px-4 py-2 text-xs text-gray-500 font-medium">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {INCENTIVE_STRUCTURES[s].map(slab => (
                  <tr key={slab.revenue} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">₹{slab.revenue.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 text-right font-medium text-blue-600">
                      {(slab.rate * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {formatCurrency(Math.round(slab.revenue * slab.rate))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* Commission simulator */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-lg">
        <h3 className="font-semibold text-gray-900 mb-4">Commission Calculator</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Achieved (₹)</label>
            <input
              type="number"
              value={simRevenue}
              onChange={e => setSimRevenue(e.target.value)}
              placeholder="e.g. 1200000"
              min={0}
              step={10000}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Structure</label>
            <div className="flex gap-2">
              {([1,2,3] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSimStructure(s)}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    simStructure === s
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {simAmount > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Revenue</span>
                <span className="font-medium">{formatCurrency(simAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Applicable Slab</span>
                <span className="font-medium">
                  {simSlab ? `${(simSlab.rate * 100).toFixed(1)}% (≥ ₹${simSlab.revenue.toLocaleString('en-IN')})` : 'Below minimum slab'}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-900">Commission</span>
                <span className="font-bold text-green-600 text-base">{formatCurrency(simCommission)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
