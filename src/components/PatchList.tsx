import { usePatchwork } from '@/context/PatchworkContext';
import { PatchCard } from './PatchCard';
import { Layers, Filter } from 'lucide-react';
import { useState } from 'react';
import type { PatchStatus } from '@/types';

const statusFilters: { value: PatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'deployed', label: 'Deployed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rolled_back', label: 'Rolled Back' },
];

export function PatchList() {
  const { patches, conflicts } = usePatchwork();
  const [filter, setFilter] = useState<PatchStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const filtered = patches
    .filter((p) => filter === 'all' || p.status === filter)
    .filter((p) => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        p.id.toLowerCase().includes(s) ||
        p.author.toLowerCase().includes(s) ||
        p.target.label.toLowerCase().includes(s) ||
        p.property.toLowerCase().includes(s) ||
        p.oldValue.toLowerCase().includes(s) ||
        p.newValue.toLowerCase().includes(s)
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const allConflictIds = new Set(conflicts.flatMap((c) => [c.patchId, ...c.conflictsWith]));

  return (
    <div className="space-y-4">
      {/* Header + filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-cyan-600" />
          <h2 className="font-bold text-gray-900 text-lg">Patches</h2>
          <span className="text-sm text-gray-400">({patches.length})</span>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" /> Status:
          </div>
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                filter === f.value
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.label}
              {f.value !== 'all' && (
                <span className="ml-1 opacity-60">
                  ({patches.filter((p) => p.status === f.value).length})
                </span>
              )}
            </button>
          ))}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patches..."
            className="ml-auto px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-48"
          />
        </div>
      </div>

      {/* Patch grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Layers className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {patches.length === 0 ? 'No patches yet. Create one from the Dashboard.' : 'No patches match your filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((patch) => (
            <div key={patch.id} className="relative">
              {allConflictIds.has(patch.id) && (
                <div className="absolute -top-2 -right-2 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                  CONFLICT
                </div>
              )}
              <PatchCard patch={patch} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
