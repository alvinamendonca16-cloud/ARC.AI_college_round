import { usePatchwork } from '@/context/PatchworkContext';
import { applyPatchToState } from '@/lib/verification';
import { SampleWebsite } from './SampleWebsite';
import type { WebsiteState } from '@/types';
import { Eye, ArrowLeftRight, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export function PreviewPanel() {
  const { patches, selectedPatchId, websiteState, versions, currentVersion, rollbackToVersion, selectPatch } = usePatchwork();
  const [showDiff, setShowDiff] = useState(true);

  const patch = patches.find((p) => p.id === selectedPatchId);

  // If no patch selected, show version comparison
  const previewState: WebsiteState = patch ? applyPatchToState(websiteState, patch) : websiteState;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-5 h-5 text-cyan-600" />
          <h2 className="font-bold text-gray-900 text-lg">Isolated Preview</h2>
        </div>
        <p className="text-sm text-gray-500">
          Preview shows what the website would look like if the patch were deployed. The active website is not affected.
        </p>
      </div>

      {/* Patch selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
          Select Patch to Preview
        </label>
        <select
          value={selectedPatchId ?? ''}
          onChange={(e) => selectPatch(e.target.value || null)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        >
          <option value="">— Select a patch —</option>
          {patches.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} — {p.target.label} {p.property} → {truncate(p.newValue)} ({p.status})
            </option>
          ))}
        </select>
      </div>

      {patch ? (
        <>
          {/* Diff toggle */}
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="flex items-center gap-1.5 text-sm font-medium text-cyan-600 hover:text-cyan-700"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {showDiff ? 'Showing: Active vs Proposed' : 'Showing: Proposed only'}
            </button>
            <div className="ml-auto flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gray-200 border border-gray-300" />
                Active (v{currentVersion})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-cyan-200 border border-cyan-300" />
                Proposed
              </span>
            </div>
          </div>

          {/* Side-by-side preview */}
          {showDiff ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Active Version (v{currentVersion})
                </div>
                <div className="opacity-90">
                  <SampleWebsite />
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  Proposed (Draft)
                </div>
                <div className="ring-2 ring-cyan-300 rounded-xl overflow-hidden">
                  <PreviewWebsite state={previewState} />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold text-cyan-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Proposed (Draft)
              </div>
              <div className="ring-2 ring-cyan-300 rounded-xl overflow-hidden">
                <PreviewWebsite state={previewState} />
              </div>
            </div>
          )}

          {/* Patch details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Patch Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <Detail label="Patch ID" value={patch.id} mono />
              <Detail label="Author" value={patch.author} />
              <Detail label="Status" value={patch.status} />
              <Detail label="Target" value={patch.target.label} />
              <Detail label="Property" value={patch.property} />
              <Detail label="Base Version" value={`v${patch.baseVersion}`} />
              <Detail label="Old Value" value={truncate(patch.oldValue, 50)} mono />
              <Detail label="New Value" value={truncate(patch.newValue, 50)} mono />
              <Detail label="Created" value={new Date(patch.createdAt).toLocaleString()} />
            </div>
          </div>
        </>
      ) : (
        // No patch selected — show version rollback preview
        <VersionRollbackPreview
          versions={versions}
          currentVersion={currentVersion}
          websiteState={websiteState}
          onRollback={rollbackToVersion}
        />
      )}
    </div>
  );
}

function VersionRollbackPreview({
  versions,
  currentVersion,
  websiteState,
  onRollback,
}: {
  versions: import('@/types').Version[];
  currentVersion: number;
  websiteState: WebsiteState;
  onRollback: (v: number) => { success: boolean; message: string };
}) {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const targetVersion = selectedVersion ? versions.find((v) => v.version === selectedVersion) : null;
  const isCurrent = selectedVersion === currentVersion;
  const isRollback = selectedVersion !== null && selectedVersion < currentVersion;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
          Preview a Previous Version
        </label>
        <select
          value={selectedVersion ?? ''}
          onChange={(e) => setSelectedVersion(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
        >
          <option value="">— Select a version —</option>
          {versions.slice().reverse().map((v) => (
            <option key={v.version} value={v.version}>
              v{v.version} — {v.description} ({new Date(v.timestamp).toLocaleString()})
            </option>
          ))}
        </select>
      </div>

      {targetVersion && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400" />
                Current (v{currentVersion})
              </div>
              <div className="opacity-90">
                <PreviewWebsite state={websiteState} />
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Version v{targetVersion.version}
              </div>
              <div className="ring-2 ring-purple-300 rounded-xl overflow-hidden">
                <PreviewWebsite state={targetVersion.state} />
              </div>
            </div>
          </div>

          {isRollback && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-amber-800 text-sm mb-1">Rollback Warning</h4>
                  <p className="text-sm text-amber-700 mb-3">
                    Rolling back to v{targetVersion.version} will undo {currentVersion - targetVersion.version} version(s).
                    This affects patches deployed after v{targetVersion.version}. Those patches will be marked as rolled back.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to rollback from v${currentVersion} to v${targetVersion.version}? This will undo all changes made after v${targetVersion.version}.`)) {
                        const result = onRollback(targetVersion.version);
                        alert(result.message);
                        setSelectedVersion(null);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Rollback to v{targetVersion.version}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCurrent && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              This is the current active version.
            </div>
          )}
        </>
      )}
    </div>
  );
}

// A non-interactive preview version of the sample website
import { readableTextColor } from '@/lib/colors';
import { ShoppingCart, Search, Star, Truck, Shield, Headphones, Bell, Menu } from 'lucide-react';

function PreviewWebsite({ state }: { state: WebsiteState }) {
  const buyText = state.buyButtonTextColor || readableTextColor(state.buyButtonBgColor);

  return (
    <div className="bg-white overflow-hidden pointer-events-none">
      <div
        className="px-4 py-2 text-center text-sm font-medium"
        style={{ backgroundColor: state.bannerBgColor, color: readableTextColor(state.bannerBgColor) }}
      >
        {state.bannerText}
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900 text-lg">ShopDemo</span>
        </div>
        <div className="hidden md:flex gap-5 text-sm text-gray-600">
          {state.navLinks.map((l) => <span key={l}>{l}</span>)}
        </div>
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-500" />
          <Bell className="w-4 h-4 text-gray-500" />
          <Menu className="w-5 h-5 text-gray-500 md:hidden" />
        </div>
      </div>
      <div className="px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
          <div className="md:w-1/2">
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <Headphones className="w-24 h-24 text-gray-400" strokeWidth={1.2} />
            </div>
          </div>
          <div className="md:w-1/2 space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">{state.productHeading}</h1>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
              ))}
              <span className="text-sm text-gray-500 ml-1">(124 reviews)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{state.productPrice}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{state.productDescription}</p>
            <div className="flex items-center gap-3 pt-2">
              <button
                className="px-8 py-3 rounded-lg font-bold text-sm shadow-md"
                style={{ backgroundColor: state.buyButtonBgColor, color: buyText }}
              >
                {state.buyButtonLabel}
              </button>
              <button className="px-6 py-3 rounded-lg font-bold text-sm text-gray-700 border-2 border-gray-300">
                Save for Later
              </button>
            </div>
            <div className="flex items-center gap-4 pt-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Free Shipping</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" /> 2-Year Warranty</span>
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">{state.footerText}</p>
      </div>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">{label}</div>
      <div className={`text-sm text-gray-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
    </div>
  );
}

function truncate(s: string, len = 30): string {
  if (s.length <= len) return s;
  return s.slice(0, len) + '...';
}
