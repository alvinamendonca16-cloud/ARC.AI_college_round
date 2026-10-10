import { useState } from 'react';
import { usePatchwork } from '@/context/PatchworkContext';
import { SampleWebsite } from './SampleWebsite';
import { PatchCreator } from './PatchCreator';
import { PatchCard } from './PatchCard';
import { LayoutDashboard, Layers, ShieldCheck, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

export function Dashboard() {
  const { patches, versions, audit, currentVersion, conflicts } = usePatchwork();
  const [clickedElement, setClickedElement] = useState<string | null>(null);

  const pendingCount = patches.filter((p) => p.status === 'pending').length;
  const approvedCount = patches.filter((p) => p.status === 'approved').length;
  const deployedCount = patches.filter((p) => p.status === 'deployed').length;
  const rejectedCount = patches.filter((p) => p.status === 'rejected').length;
  const conflictCount = conflicts.length;
  const recentPatches = [...patches].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  const recentAudit = [...audit].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Patches" value={patches.length} icon={Layers} color="cyan" />
        <StatCard label="Pending Review" value={pendingCount} icon={Activity} color="amber" />
        <StatCard label="Deployed" value={deployedCount} icon={ShieldCheck} color="green" />
        <StatCard label="Active Conflicts" value={conflictCount} icon={AlertTriangle} color="red" />
      </div>

      {/* Main grid: Website + Patch Creator */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Sample Website */}
        <div className="xl:col-span-2 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-cyan-600" />
              Sample Shopping Website (v{currentVersion})
            </h2>
            <span className="text-[11px] text-gray-400">Click any element to patch it</span>
          </div>
          <SampleWebsite onSelectElement={(id) => setClickedElement(id)} />
        </div>

        {/* Patch Creator */}
        <div className="space-y-3">
          <PatchCreator preselectedElementId={clickedElement} />

          {/* Quick status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Status</h3>
            <div className="space-y-1.5 text-sm">
              <StatusRow label="Approved (ready to deploy)" count={approvedCount} color="green" />
              <StatusRow label="Rejected" count={rejectedCount} color="red" />
              <StatusRow label="Versions recorded" count={versions.length} color="blue" />
              <StatusRow label="Audit events" count={audit.length} color="gray" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent patches + audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent patches */}
        <div className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            Recent Patches
          </h3>
          {recentPatches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-sm text-gray-400">
              No patches yet. Create one using the panel above.
            </div>
          ) : (
            <div className="space-y-2">
              {recentPatches.map((p) => (
                <PatchCard key={p.id} patch={p} compact />
              ))}
            </div>
          )}
        </div>

        {/* Recent audit */}
        <div className="space-y-2">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-600" />
            Recent Activity
          </h3>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
            {recentAudit.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">No activity yet.</div>
            ) : (
              recentAudit.map((a) => (
                <div key={a.id} className="px-4 py-2.5 flex items-start gap-2 text-sm">
                  <span className="text-[11px] text-gray-400 font-mono shrink-0 w-20 pt-0.5">
                    {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="font-semibold text-gray-700 text-xs shrink-0">{a.action}</span>
                  <span className="text-gray-500 text-xs flex-1 truncate">{a.details}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const colorMap: Record<string, { text: string; bg: string; border: string }> = {
  cyan: { text: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  green: { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  red: { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  gray: { text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Layers; color: string }) {
  const c = colorMap[color] ?? colorMap.gray;
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.bg}`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
    </div>
  );
}

function StatusRow({ label, count, color }: { label: string; count: number; color: string }) {
  const c = colorMap[color] ?? colorMap.gray;
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className={`font-bold ${c.text}`}>{count}</span>
    </div>
  );
}
