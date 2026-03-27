'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Target } from '@/types';
import { formatCurrency } from '@/lib/incentives';

export default function MyTargetsPage() {
  const { data: session } = useSession();
  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/targets')
      .then(r => r.json())
      .then(data => { setTargets(data); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Targets</h2>
        <p className="text-sm text-gray-500 mt-1">Targets assigned to {session?.user?.name}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-20 animate-pulse" />)}
        </div>
      ) : targets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No targets assigned yet.
        </div>
      ) : (
        <div className="space-y-3">
          {targets.sort((a,b) => b.period.localeCompare(a.period)).map(t => (
            <div key={t.targetId} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900 text-lg">{formatCurrency(t.revenueTarget)}</span>
                  <span className="ml-3 text-sm text-gray-500">
                    {new Date(t.period + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                  Structure {t.incentiveStructure}
                </span>
              </div>
              {t.notes && <p className="text-sm text-gray-500 mt-2">{t.notes}</p>}
              <p className="text-xs text-gray-400 mt-2">Assigned by {t.assignedBy}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
