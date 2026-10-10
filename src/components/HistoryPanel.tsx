import { usePatchwork } from '@/context/PatchworkContext';
import { History, RotateCcw, GitBranch, Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export function HistoryPanel() {
  const { versions, patches, currentVersion, rollbackToVersion, audit } = usePatchwork();
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [rollbackMsg, setRollbackMsg] = useState<{ success: boolean; message: string } | null>(null);

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version);

  function handleRollback(version: number) {
    setRollbackMsg(null);
    if (version >= currentVersion) {
      setRollbackMsg({ success: false, message: `Cannot rollback: v${version} is the current or a future version.` });
      return;
    }
    const undoneVersions = versions.filter((v) => v.version > version && v.version <= currentVersion);
    const confirmMsg = `Rollback from v${currentVersion} to v${version}?\n\nThis will undo ${undoneVersions.length} version(s) and mark their patches as rolled back.`;
    if (!confirm(confirmMsg)) return;
    const result = rollbackToVersion(version);
    setRollbackMsg(result);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-1">
          <History className="w-5 h-5 text-cyan-600" />
          <h2 className="font-bold text-gray-900 text-lg">Version History</h2>
        </div>
        <p className="text-sm text-gray-500">
          Every deployment creates a snapshot of the website state. Rollback restores a previous version from its snapshot.
        </p>
      </div>

      {rollbackMsg && (
        <div className={`px-4 py-3 rounded-lg text-sm border ${
          rollbackMsg.success
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {rollbackMsg.message}
        </div>
      )}

      <div className="space-y-3">
        {sortedVersions.map((v) => {
          const isCurrent = v.version === currentVersion;
          const isExpanded = expandedVersion === v.version;
          const versionPatches = patches.filter((p) => v.patchIds.includes(p.id));
          const canRollback = !isCurrent && v.version < currentVersion;

          return (
            <div key={v.version} className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all ${
              isCurrent ? 'border-cyan-400' : 'border-gray-200'
            }`}>
              <div
                className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedVersion(isExpanded ? null : v.version)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isCurrent ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      v{v.version}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                        {v.description}
                        {isCurrent && (
                          <span className="text-[10px] font-bold bg-cyan-500 text-white px-1.5 py-0.5 rounded-full">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(v.timestamp).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{v.patchIds.length} patch(es)</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canRollback && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRollback(v.version); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Rollback
                      </button>
                    )}
                    <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 space-y-3">
                  {/* Patches in this version */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Patches Deployed</h4>
                    {versionPatches.length === 0 ? (
                      <p className="text-sm text-gray-400">No patches — initial or restored state.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {versionPatches.map((p) => (
                          <div key={p.id} className="flex items-center gap-3 text-sm bg-white px-3 py-2 rounded-lg border border-gray-200">
                            <span className="font-mono text-xs font-bold text-gray-600">{p.id}</span>
                            <span className="text-gray-500">—</span>
                            <span className="text-gray-700">{p.target.label}</span>
                            <span className="font-mono text-xs text-gray-400">{p.property}</span>
                            <span className="font-mono text-xs text-gray-500 line-through">{truncate(p.oldValue, 20)}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-mono text-xs text-cyan-700">{truncate(p.newValue, 20)}</span>
                            <span className="text-[10px] text-gray-400 ml-auto">by {p.author}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* State snapshot */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">State Snapshot</h4>
                    <div className="bg-white rounded-lg border border-gray-200 p-3 text-xs font-mono text-gray-600 grid grid-cols-2 gap-1">
                      <span>heading: <strong className="text-gray-800">{truncate(v.state.productHeading, 25)}</strong></span>
                      <span>price: <strong className="text-gray-800">{v.state.productPrice}</strong></span>
                      <span>buyLabel: <strong className="text-gray-800">{v.state.buyButtonLabel}</strong></span>
                      <span>buyBg: <strong className="text-gray-800">{v.state.buyButtonBgColor}</strong></span>
                      <span>buyText: <strong className="text-gray-800">{v.state.buyButtonTextColor}</strong></span>
                      <span>banner: <strong className="text-gray-800">{truncate(v.state.bannerText, 25)}</strong></span>
                    </div>
                  </div>

                  {/* Related audit events */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Related Audit Events</h4>
                    <div className="space-y-1">
                      {audit.filter((a) => a.version === v.version).map((a) => (
                        <div key={a.id} className="text-[11px] text-gray-500 flex items-start gap-2">
                          <span className="font-mono text-gray-400 shrink-0">{new Date(a.timestamp).toLocaleTimeString()}</span>
                          <span className="font-semibold text-gray-600">{a.action}</span>
                          <span className="text-gray-400">{a.details}</span>
                        </div>
                      ))}
                      {audit.filter((a) => a.version === v.version).length === 0 && (
                        <p className="text-sm text-gray-400">No audit events for this version.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function truncate(s: string, len = 30): string {
  if (s.length <= len) return s;
  return s.slice(0, len) + '...';
}
