import { usePatchwork } from '@/context/PatchworkContext';
import { ScrollText, Search, Filter } from 'lucide-react';
import { useState } from 'react';

const actionColors: Record<string, string> = {
  INIT: 'text-gray-600 bg-gray-100',
  RESET: 'text-gray-600 bg-gray-100',
  PATCH_CREATED: 'text-cyan-700 bg-cyan-50',
  VERIFIED: 'text-blue-700 bg-blue-50',
  APPROVED: 'text-green-700 bg-green-50',
  REJECTED: 'text-red-700 bg-red-50',
  APPROVE_BLOCKED: 'text-amber-700 bg-amber-50',
  REJECT_BLOCKED: 'text-amber-700 bg-amber-50',
  DEPLOYED: 'text-blue-700 bg-blue-50',
  DEPLOY_BLOCKED: 'text-red-700 bg-red-50',
  ROLLBACK_SUCCESS: 'text-purple-700 bg-purple-50',
  ROLLBACK_FAILED: 'text-red-700 bg-red-50',
  CONFLICT_RESOLVED: 'text-orange-700 bg-orange-50',
};

export function AuditLog() {
  const { audit } = usePatchwork();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const uniqueActions = [...new Set(audit.map((a) => a.action))];

  const filtered = audit
    .filter((a) => actionFilter === 'all' || a.action === actionFilter)
    .filter((a) => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        a.action.toLowerCase().includes(s) ||
        a.details.toLowerCase().includes(s) ||
        a.actor.toLowerCase().includes(s) ||
        (a.patchId?.toLowerCase().includes(s) ?? false)
      );
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <ScrollText className="w-5 h-5 text-cyan-600" />
          <h2 className="font-bold text-gray-900 text-lg">Audit Log</h2>
          <span className="text-sm text-gray-400">({audit.length} events)</span>
        </div>
        <p className="text-sm text-gray-500">
          Complete trail of all events: patch creation, verification, approval, rejection, deployment, conflict resolution, and rollback.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Filter className="w-3.5 h-3.5" /> Action:
          </div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs px-2.5 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="relative ml-auto">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit log..."
              className="pl-8 pr-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ScrollText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No audit events match your filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((event) => (
              <div key={event.id} className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3">
                {/* Timestamp */}
                <div className="text-[11px] text-gray-400 font-mono shrink-0 w-32 pt-0.5">
                  {new Date(event.timestamp).toLocaleString()}
                </div>

                {/* Action badge */}
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono shrink-0 ${
                  actionColors[event.action] ?? 'text-gray-600 bg-gray-100'
                }`}>
                  {event.action}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{event.details}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    <span>by <strong className="text-gray-600">{event.actor}</strong></span>
                    {event.patchId && <span className="font-mono">patch: {event.patchId}</span>}
                    {event.version !== undefined && <span>v{event.version}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
