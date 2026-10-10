import { usePatchwork } from '@/context/PatchworkContext';
import { developers } from '@/lib/sampleData';
import { GitBranch, Shield, Layers, Eye, History, ScrollText, LayoutDashboard, Zap, RotateCcw } from 'lucide-react';
import type { ViewName } from '@/types';

const navItems: { id: ViewName; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patches', label: 'Patches', icon: Layers },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'history', label: 'History', icon: History },
  { id: 'audit', label: 'Audit Log', icon: ScrollText },
];

export function Sidebar() {
  const { view, setView, activeDeveloper, setActiveDeveloper, currentVersion, patches, resetAll } = usePatchwork();

  const pendingCount = patches.filter((p) => p.status === 'pending').length;
  const deployedCount = patches.filter((p) => p.status === 'deployed').length;

  return (
    <aside className="w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800">
      {/* Branding */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight tracking-tight">PATCHWORK</h1>
            <p className="text-[11px] text-cyan-400 font-medium tracking-wide">Hotfix the Internet</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.id;
          const badge =
            item.id === 'patches' && pendingCount > 0 ? pendingCount : null;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-left">{item.label}</span>
              {badge !== null && (
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Version + Stats */}
      <div className="px-4 py-3 border-t border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <GitBranch className="w-3.5 h-3.5" />
            Version
          </span>
          <span className="font-bold text-cyan-400">v{currentVersion}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Shield className="w-3.5 h-3.5" />
            Deployed
          </span>
          <span className="font-bold text-green-400">{deployedCount}</span>
        </div>
      </div>

      {/* Developer Selector */}
      <div className="px-4 py-3 border-t border-slate-800">
        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1.5 block">
          Active Developer
        </label>
        <select
          value={activeDeveloper.id}
          onChange={(e) => {
            const dev = developers.find((d) => d.id === e.target.value);
            if (dev) setActiveDeveloper(dev);
          }}
          className="w-full bg-slate-800 text-slate-200 text-sm rounded-md px-2.5 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        >
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.role})
            </option>
          ))}
        </select>
      </div>

      {/* Reset */}
      <div className="px-4 py-3 border-t border-slate-800">
        <button
          onClick={() => {
            if (confirm('Reset all patches, versions, and audit history? This cannot be undone.')) {
              resetAll();
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All Data
        </button>
      </div>
    </aside>
  );
}
