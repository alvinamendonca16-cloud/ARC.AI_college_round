import { usePatchwork } from '@/context/PatchworkContext';
import type { Patch } from '@/types';
import { CheckCircle2, XCircle, ShieldCheck, AlertTriangle, ThumbsUp, ThumbsDown, Rocket, Play, Eye, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export function PatchDetail({ patch }: { patch: Patch }) {
  const { runVerification, approvePatch, rejectPatch, deployPatch, activeDeveloper, conflicts, setView, selectPatch } = usePatchwork();
  const [reviewComment, setReviewComment] = useState('');
  const [deployMsg, setDeployMsg] = useState<{ success: boolean; message: string } | null>(null);

  const patchConflicts = conflicts.filter((c) => c.patchId === patch.id);
  const hasConflicts = patchConflicts.length > 0;
  const isStale = patch.verification?.checks.some((c) => c.name === 'Base Version Current' && !c.passed);
  const canApprove = activeDeveloper.role === 'reviewer' || activeDeveloper.role === 'admin';
  const canDeploy = patch.status === 'approved' && patch.verification?.passed && !hasConflicts && !isStale;

  function handleDeploy() {
    const result = deployPatch(patch.id);
    setDeployMsg(result);
    if (result.success) {
      setTimeout(() => setView('history'), 500);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-900 text-sm font-mono">{patch.id}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {patch.target.label} → {patch.property} • by {patch.author} • base v{patch.baseVersion}
          </p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
          patch.status === 'deployed' ? 'bg-blue-100 text-blue-700' :
          patch.status === 'approved' ? 'bg-green-100 text-green-700' :
          patch.status === 'rejected' ? 'bg-red-100 text-red-700' :
          patch.status === 'rolled_back' ? 'bg-purple-100 text-purple-700' :
          'bg-amber-100 text-amber-700'
        }`}>
          {patch.status.replace('_', ' ')}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Change summary */}
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Proposed Change</div>
          <div className="flex items-center gap-3 text-sm">
            <div className="flex-1">
              <div className="text-[11px] text-gray-400 mb-0.5">Old Value</div>
              <div className="font-mono text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">{patch.oldValue}</div>
            </div>
            <div className="text-gray-400 text-xl">→</div>
            <div className="flex-1">
              <div className="text-[11px] text-gray-400 mb-0.5">New Value</div>
              <div className="font-mono text-cyan-700 bg-cyan-50 px-2 py-1 rounded border border-cyan-200">{patch.newValue}</div>
            </div>
          </div>
        </div>

        {/* Target metadata */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Meta label="Element ID" value={patch.target.elementId} mono />
          <Meta label="Element Type" value={patch.target.elementType} />
          <Meta label="Accessible Label" value={patch.target.label} />
          <Meta label="Base Version" value={`v${patch.baseVersion}`} />
          <div className="col-span-2">
            <Meta label="Context" value={patch.target.context} />
          </div>
        </div>

        {/* Conflict warnings */}
        {hasConflicts && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-800 text-sm mb-1">Conflicts Detected</h4>
                <p className="text-sm text-red-700 mb-2">
                  This patch conflicts with another patch targeting the same element and property:
                </p>
                <ul className="space-y-1 text-sm">
                  {patchConflicts.map((c) => (
                    <li key={c.patchId} className="text-red-600">
                      • {c.reason} — conflicts with: {c.conflictsWith.join(', ')}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-red-500 mt-2">
                  Resolve conflicts by rejecting the conflicting patch before deploying this one.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Verification results */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Verification Results
            </h4>
            <button
              onClick={() => runVerification(patch.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
            >
              <Play className="w-3 h-3" /> Run Verification
            </button>
          </div>

          {patch.verification ? (
            <div className="space-y-1.5">
              {patch.verification.checks.map((check, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm border ${
                    check.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${check.passed ? 'text-green-800' : 'text-red-800'}`}>
                      {check.name}
                    </div>
                    <div className={`text-xs mt-0.5 ${check.passed ? 'text-green-700' : 'text-red-700'}`}>
                      {check.message}
                    </div>
                  </div>
                </div>
              ))}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm ${
                patch.verification.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {patch.verification.passed ? (
                  <><CheckCircle2 className="w-4 h-4" /> All checks passed — patch is verified</>
                ) : (
                  <><XCircle className="w-4 h-4" /> Verification failed — {patch.verification.checks.filter(c => !c.passed).length} check(s) failed</>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-400">
              No verification run yet. Click "Run Verification" to check this patch.
            </div>
          )}
        </div>

        {/* Review comment */}
        {patch.reviewComment && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-1">Review Comment</div>
            <p className="text-blue-700">{patch.reviewComment}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {patch.status === 'pending' && patch.verification?.passed && canApprove && (
            <>
              <input
                type="text"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Review comment (optional)..."
                className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                onClick={() => approvePatch(patch.id, reviewComment)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <ThumbsUp className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => rejectPatch(patch.id, reviewComment)}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <ThumbsDown className="w-4 h-4" /> Reject
              </button>
            </>
          )}

          {patch.status === 'pending' && !canApprove && (
            <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 w-full">
              <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
              Only reviewers and admins can approve/reject patches. Switch to a reviewer role from the sidebar.
            </div>
          )}

          {canDeploy && (
            <button
              onClick={handleDeploy}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ml-auto"
            >
              <Rocket className="w-4 h-4" /> Deploy Now
            </button>
          )}

          <button
            onClick={() => { selectPatch(patch.id); setView('preview'); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg transition-colors border border-cyan-200"
          >
            <Eye className="w-4 h-4" /> Preview
          </button>
        </div>

        {/* Deploy message */}
        {deployMsg && (
          <div className={`px-3 py-2.5 rounded-lg text-sm border ${
            deployMsg.success
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {deployMsg.message}
          </div>
        )}

        {/* Rollback info */}
        {patch.status === 'rolled_back' && patch.rolledBackAt && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              This patch was rolled back at {new Date(patch.rolledBackAt).toLocaleString()}
              {patch.rolledBackByVersion ? ` (website restored to v${patch.rolledBackByVersion})` : ''}.
            </div>
          </div>
        )}

        {patch.deployedVersion && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Deployed in version {patch.deployedVersion}.
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{label}</div>
      <div className={`text-sm text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
    </div>
  );
}
