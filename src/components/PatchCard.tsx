import { usePatchwork } from '@/context/PatchworkContext';
import type { Patch } from '@/types';
import { CheckCircle2, XCircle, Clock, ArrowRight, AlertTriangle, RotateCcw, Eye, Play, ShieldCheck, ThumbsUp, ThumbsDown } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-50 border-green-200', icon: ThumbsUp },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: ThumbsDown },
  deployed: { label: 'Deployed', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  rolled_back: { label: 'Rolled Back', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: RotateCcw },
};

export function PatchCard({ patch, compact = false }: { patch: Patch; compact?: boolean }) {
  const { selectPatch, selectedPatchId, runVerification, approvePatch, rejectPatch, deployPatch, conflicts, activeDeveloper, setView } = usePatchwork();
  const isSelected = selectedPatchId === patch.id;
  const status = statusConfig[patch.status] ?? statusConfig.draft;
  const StatusIcon = status.icon;

  const patchConflicts = conflicts.filter((c) => c.patchId === patch.id);
  const hasConflicts = patchConflicts.length > 0;
  const isStale = patch.verification?.checks.some((c) => c.name === 'Base Version Current' && !c.passed);
  const canApprove = activeDeveloper.role === 'reviewer' || activeDeveloper.role === 'admin';
  const canDeploy = patch.status === 'approved' && patch.verification?.passed && !hasConflicts && !isStale;

  function handleDeploy() {
    const result = deployPatch(patch.id);
    if (!result.success) {
      alert(result.message);
    } else {
      setView('history');
    }
  }

  return (
    <div
      onClick={() => selectPatch(patch.id)}
      className={`rounded-lg border-2 cursor-pointer transition-all duration-150 ${
        isSelected ? 'border-cyan-500 shadow-md' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } bg-white`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${status.bg} ${status.color} border`}>
            {patch.id}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${status.bg} ${status.color} border`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">{formatTime(patch.createdAt)}</span>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        <div className="text-sm">
          <div className="flex items-center gap-1.5 text-gray-600 mb-1">
            <span className="font-semibold text-gray-700">{patch.target.label}</span>
            <ArrowRight className="w-3 h-3 text-gray-400" />
            <span className="font-mono text-xs text-gray-500">{patch.property}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">
              {truncate(patch.oldValue)}
            </span>
            <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="px-1.5 py-0.5 bg-cyan-50 rounded text-cyan-700 font-mono border border-cyan-100">
              {truncate(patch.newValue)}
            </span>
          </div>
        </div>

        {/* Author + base version */}
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>by <strong className="text-gray-600">{patch.author}</strong></span>
          <span>base v{patch.baseVersion}</span>
        </div>

        {/* Conflict warning */}
        {hasConflicts && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-[11px] text-red-700">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Conflicts with: {patchConflicts.flatMap((c) => c.conflictsWith).join(', ')}
            </span>
          </div>
        )}

        {/* Stale warning */}
        {isStale && (
          <div className="flex items-start gap-1.5 px-2 py-1.5 bg-orange-50 border border-orange-200 rounded text-[11px] text-orange-700">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Stale patch — website has changed since creation. Re-verify before deploying.</span>
          </div>
        )}

        {/* Verification summary */}
        {patch.verification && (
          <div className={`flex items-center gap-1.5 text-[11px] font-medium ${patch.verification.passed ? 'text-green-600' : 'text-red-600'}`}>
            {patch.verification.passed ? (
              <><ShieldCheck className="w-3.5 h-3.5" /> Verification: {patch.verification.checks.filter(c => c.passed).length}/{patch.verification.checks.length} passed</>
            ) : (
              <><XCircle className="w-3.5 h-3.5" /> Verification: {patch.verification.checks.filter(c => c.passed).length}/{patch.verification.checks.length} passed</>
            )}
          </div>
        )}

        {/* Actions */}
        {!compact && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
            <button
              onClick={(e) => { e.stopPropagation(); runVerification(patch.id); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              <Play className="w-3 h-3" /> Verify
            </button>

            {patch.status === 'pending' && patch.verification?.passed && canApprove && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); approvePatch(patch.id); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors"
                >
                  <ThumbsUp className="w-3 h-3" /> Approve
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); rejectPatch(patch.id); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
                >
                  <ThumbsDown className="w-3 h-3" /> Reject
                </button>
              </>
            )}

            {canDeploy && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeploy(); }}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors ml-auto"
              >
                <CheckCircle2 className="w-3 h-3" /> Deploy
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); selectPatch(patch.id); setView('preview'); }}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-md transition-colors"
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function truncate(s: string, len = 30): string {
  if (s.length <= len) return s;
  return s.slice(0, len) + '...';
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
