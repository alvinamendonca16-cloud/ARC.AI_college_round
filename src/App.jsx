import { useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, Code2, History, Image, LayoutDashboard,
  Monitor, PanelLeftClose, PanelLeftOpen, PanelsTopLeft, RotateCcw,
  Search, ShieldCheck, ShoppingBag, Tablet, Type, UsersRound, Smartphone, Navigation, CircleDollarSign, Tag, Palette,
} from 'lucide-react';
import { AuditTimeline } from './components/AuditTimeline.jsx';
import { ConflictWarning } from './components/ConflictWarning.jsx';
import { ExternalSitePreview } from './components/ExternalSitePreview.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { PatchGenerator } from './components/PatchGenerator.jsx';
import { PatchHistory } from './components/PatchHistory.jsx';
import { PatchPreview } from './components/PatchPreview.jsx';
import { ReleasePanel } from './components/ReleasePanel.jsx';
import { SampleWebsite } from './components/SampleWebsite.jsx';
import { TeamPanel } from './components/TeamPanel.jsx';
import { VerificationPanel } from './components/VerificationPanel.jsx';
import { VisualInspector } from './components/VisualInspector.jsx';
import { DEVELOPERS, usePatches } from './context/PatchContext.jsx';
import { COLOR_VALUES, formatStatus, getConflicts, getPatchRevision, resolveSmartTarget, TARGETS, validateProposal } from './utils/patchUtils.js';

const DEMO_URL = 'https://sonora.patchwork.local/';
const VIEWPORT_WIDTHS = { desktop: 1280, tablet: 768, mobile: 390 };
const navigation = [
  { id: 'workspace', label: 'Workspace', icon: LayoutDashboard },
  { id: 'history', label: 'Patches', icon: Code2 },
  { id: 'versions', label: 'History', icon: History },
  { id: 'audit', label: 'Audit Trail', icon: Activity },
  { id: 'team', label: 'Team', icon: UsersRound },
];
const elementIcons = {
  'page-background': Palette,
  'navigation-bar': Navigation,
  logo: PanelsTopLeft,
  'buy-now-button': ShoppingBag,
  'main-heading': Type,
  subheading: Type,
  'product-card': PanelsTopLeft,
  'product-image': Image,
  'product-title': Tag,
  'product-description': Type,
  'product-price': CircleDollarSign,
};

function cssValue(property, value) {
  const probe = document.createElement('div');
  const cssProperty = property === 'visibility' ? 'display' : property;
  probe.style[cssProperty] = property === 'visibility'
    ? value === 'hidden' ? 'none' : 'block'
    : COLOR_VALUES[value] ?? value;
  document.body.append(probe);
  const computed = window.getComputedStyle(probe)[cssProperty];
  probe.remove();
  return computed;
}

function readRenderedValue(element, patch) {
  if (!element) return undefined;
  if (patch.property === 'imageSource') return element.getAttribute('src');
  if (patch.property === 'textContent') {
    return patch.target === 'buy-now-button'
      ? element.querySelector('.button-copy')?.textContent?.trim()
      : element.textContent.trim();
  }
  if (patch.property === 'layout') return element.dataset.patchLayout;
  if (patch.property === 'behavior') return element.dataset.patchBehavior;
  const style = window.getComputedStyle(element);
  if (patch.property === 'visibility') return style.display === 'none' ? 'hidden' : 'visible';
  return style[patch.property];
}

export default function App() {
  const {
    workspace, websiteState, patches, auditEntries, verificationRuns, releases, layoutShifted,
    createWorkspace, createPatch, recordVerification, applyPatch, rejectPatch, rollbackPatch,
    simulateUpstreamChange, moveElement, addComment, updatePatch, revalidatePatches,
    resolveTargetReview, resolveConflict, resetPreview, simulateElementIdChange,
  } = usePatches();
  const [view, setView] = useState(workspace ? 'workspace' : 'landing');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [activeDeveloper, setActiveDeveloper] = useState(DEVELOPERS[0]);
  const [isChecking, setIsChecking] = useState(false);
  const [deployingId, setDeployingId] = useState(null);
  const deploymentLock = useRef(new Set());
  const [message, setMessage] = useState(null);
  const [previewMode, setPreviewMode] = useState('original');
  const [viewport, setViewport] = useState('desktop');
  const [elementSearch, setElementSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const viewportFrameRef = useRef(null);
  const viewportCanvasRef = useRef(null);
  const [canvasMetrics, setCanvasMetrics] = useState({ scale: 1, height: 400 });
  const selectedPatch = patches.find((patch) => patch.id === selectedId)
    ?? patches.find((patch) => patch.status === 'pending')
    ?? patches[0]
    ?? null;
  const latestRun = selectedPatch && verificationRuns.find((run) => run.patchId === selectedPatch.id);
  const verificationCurrent = Boolean(selectedPatch && latestRun?.passed && latestRun.patchRevision === getPatchRevision(selectedPatch));
  const hasConflict = Boolean(selectedPatch && getConflicts(patches).some(({ first, second }) => first.id === selectedPatch.id || second.id === selectedPatch.id));
  const conflictingTargets = new Set(getConflicts(patches).flatMap(({ first, second }) => [first.target, second.target]));
  const visibleElements = Object.entries(TARGETS).filter(([, definition]) =>
    `${definition.label} ${definition.semanticLabel}`.toLowerCase().includes(elementSearch.toLowerCase()),
  );
  const locatorState = selectedPatch && workspace?.isDemo ? resolveSmartTarget(selectedPatch, document) : null;

  useEffect(() => {
    const frame = viewportFrameRef.current;
    const canvas = viewportCanvasRef.current;
    if (!frame || !canvas) return undefined;

    const measure = () => {
      const availableWidth = Math.max(1, frame.clientWidth - 22);
      const scale = Math.min(1, availableWidth / VIEWPORT_WIDTHS[viewport]);
      const height = canvas.offsetHeight * scale;
      setCanvasMetrics((current) => Math.abs(current.scale - scale) < 0.001 && Math.abs(current.height - height) < 1
        ? current
        : { scale, height });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(canvas);
    measure();
    return () => observer.disconnect();
  }, [viewport, previewMode, layoutShifted, websiteState, selectedPatch]);

  function openWorkspace(url, isDemo) {
    const nextWorkspace = createWorkspace(url, isDemo);
    setSelectedId(null);
    setSelectedTarget(null);
    setPreviewMode('original');
    setView('workspace');
    setMessage({ type: 'success', text: isDemo ? 'Built-in demo workspace is ready for visual patching.' : `Workspace created for ${nextWorkspace.hostname}. External site controls are view-only.` });
  }

  function handlePatchCreated(id) {
    setSelectedId(id);
    setPreviewMode('patched');
  }

  function runAction(action, id, actor = activeDeveloper) {
    const result = action(id, actor);
    setMessage({ type: result.ok ? 'success' : 'error', text: result.message });
  }

  async function handleDeploy(id) {
    if (!id || deploymentLock.current.has(id)) return;
    deploymentLock.current.add(id);
    setDeployingId(id);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 40));
      const result = applyPatch(id, activeDeveloper);
      setMessage({ type: result.ok ? 'success' : 'error', text: result.message });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Deployment failed unexpectedly. The patch remains available for retry.' });
    } finally {
      setDeployingId(null);
      deploymentLock.current.delete(id);
    }
  }

  async function runBrowserChecks() {
    if (!selectedPatch || !workspace?.isDemo) return;
    setIsChecking(true);
    try {
      if (selectionMode) setSelectionMode(false);
      await new Promise((resolve) => window.setTimeout(resolve, 0));

    const located = resolveSmartTarget(selectedPatch, document);
    const currentValue = websiteState[selectedPatch.target]?.[selectedPatch.property];
    const actualElement = located.element;
    const renderedValue = readRenderedValue(actualElement, selectedPatch);
    const expectedRendered = selectedPatch.property === 'textContent' || selectedPatch.property === 'layout' || selectedPatch.property === 'behavior' || selectedPatch.property === 'visibility' || selectedPatch.property === 'imageSource'
      ? currentValue
      : cssValue(selectedPatch.property, currentValue);
    const proposedValidation = validateProposal(selectedPatch.target, selectedPatch.property, selectedPatch.newValue);
    const stale = currentValue !== selectedPatch.oldValue;
    const isExpectedVisible = websiteState[selectedPatch.target]?.visibility === 'hidden'
      || selectedPatch.property === 'visibility' && selectedPatch.newValue === 'hidden'
      || Boolean(actualElement && window.getComputedStyle(actualElement).display !== 'none');
    const detachedPreview = document.createElement(selectedPatch.target === 'buy-now-button' ? 'button' : selectedPatch.target === 'product-image' ? 'img' : 'div');
    if (selectedPatch.property === 'textContent') detachedPreview.textContent = selectedPatch.newValue;
    else if (selectedPatch.property === 'layout') detachedPreview.dataset.patchLayout = selectedPatch.newValue;
    else if (selectedPatch.property === 'behavior') detachedPreview.dataset.patchBehavior = selectedPatch.newValue;
    else if (selectedPatch.property === 'visibility') detachedPreview.style.display = selectedPatch.newValue === 'hidden' ? 'none' : 'block';
    else if (selectedPatch.property === 'imageSource') detachedPreview.setAttribute('src', selectedPatch.newValue);
    else detachedPreview.style[selectedPatch.property] = COLOR_VALUES[selectedPatch.newValue] ?? selectedPatch.newValue;
    const proposedPreviewMatches = !proposedValidation.error && (
      selectedPatch.property === 'textContent' ? detachedPreview.textContent === selectedPatch.newValue
        : selectedPatch.property === 'layout' ? detachedPreview.dataset.patchLayout === selectedPatch.newValue
          : selectedPatch.property === 'behavior' ? detachedPreview.dataset.patchBehavior === selectedPatch.newValue
            : selectedPatch.property === 'imageSource' ? detachedPreview.getAttribute('src') === selectedPatch.newValue
            : selectedPatch.property === 'visibility' ? detachedPreview.style.display === (selectedPatch.newValue === 'hidden' ? 'none' : 'block')
              : detachedPreview.style[selectedPatch.property] !== ''
    );
    const checks = [
      { name: 'Target exists in the demo document', passed: Boolean(actualElement) },
      { name: 'Property and proposed value are supported', passed: !proposedValidation.error },
      { name: 'Patch does not overwrite a newer value', passed: !stale },
      { name: 'No unresolved same-property conflicts', passed: !getConflicts(patches).some(({ first, second }) => first.id === selectedPatch.id || second.id === selectedPatch.id) },
      { name: 'Rendered baseline matches shared state', passed: Boolean(actualElement) && renderedValue === expectedRendered },
      { name: 'Visibility matches the requested state', passed: isExpectedVisible },
      { name: 'Proposed value renders in an isolated preview', passed: proposedPreviewMatches },
    ];
    const purchaseButton = document.querySelector('[data-patch-target="buy-now-button"]');
    const cart = document.querySelector('[data-cart-count]');
    if (purchaseButton && cart && websiteState['buy-now-button'].behavior === 'add-to-bag' && websiteState['buy-now-button'].visibility !== 'hidden') {
      const before = Number(cart.dataset.cartCount);
      purchaseButton.click();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const after = Number(document.querySelector('[data-cart-count]')?.dataset.cartCount);
      checks.push({ name: 'Purchase interaction responds to a browser click', passed: after === before + 1 });
    } else if (purchaseButton && websiteState['buy-now-button'].behavior === 'request-notification' && websiteState['buy-now-button'].visibility !== 'hidden') {
      purchaseButton.click();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      checks.push({ name: 'Purchase interaction responds to a browser click', passed: Boolean(document.querySelector('[data-purchase-feedback]')?.textContent.includes('notify')) });
    } else {
      checks.push({ name: 'Purchase interaction remains available when visible', passed: websiteState['buy-now-button'].visibility === 'hidden' || Boolean(purchaseButton) });
    }

    const run = recordVerification({ patchId: selectedPatch.id, actor: activeDeveloper, checks });
      if (!run) {
        setMessage({ type: 'error', text: 'The selected patch changed before verification could be recorded. Run checks again.' });
        return;
      }
    setMessage({
      type: run.passed ? 'success' : 'error',
      text: run.passed ? `${selectedPatch.id} passed ${checks.length} browser checks.` : `${selectedPatch.id} has failed checks and cannot be deployed.`,
    });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? `Verification failed: ${error.message}` : 'Verification failed unexpectedly. Check the patch and retry.' });
    } finally {
      setIsChecking(false);
    }
  }

  function handleSimulatedUpstreamChange() {
    const result = simulateUpstreamChange(
      activeDeveloper,
      selectedPatch?.target ?? 'main-heading',
      selectedPatch?.property ?? 'textContent',
    );
    setMessage({ type: 'success', text: result.message });
  }

  function handleRevalidate() {
    const result = revalidatePatches(activeDeveloper);
    setMessage({ type: 'success', text: `Revalidation complete: ${result.total} pending, ${result.needsReview} need review, ${result.missing} missing.` });
  }

  function handleResetPreview() {
    if (!window.confirm('Reset the demo website to its original state? Applied records will be marked rolled back; audit events will be kept.')) return;
    const result = resetPreview(activeDeveloper);
    setMessage({ type: 'success', text: result.message });
    setPreviewMode('original');
  }

  function handleElementSelected(target) {
    setSelectedTarget(target);
    setSelectionMode(false);
  }

  const proposedState = selectedPatch
    ? { ...websiteState, [selectedPatch.target]: { ...websiteState[selectedPatch.target], [selectedPatch.property]: selectedPatch.newValue } }
    : websiteState;

  if (view === 'landing') return <LandingPage onOpenWorkspace={openWorkspace} onNavigate={setView} />;

  const currentPage = view === 'workspace' ? 'Workspace'
    : view === 'history' ? 'Patches'
      : view === 'versions' ? 'History'
        : view === 'audit' ? 'Audit Trail' : 'Team';

  return (
    <main className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="side-nav">
        <div className="sidebar-brand-row"><button className="brand side-brand" onClick={() => setView('landing')} aria-label="Go to PATCHWORK home"><span className="brand-mark"><i /><i /><i /><i /></span><span><strong>PATCHWORK</strong><small>Hotfix the Internet.</small></span></button><button className="sidebar-collapse" title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setSidebarCollapsed((current) => !current)}>{sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}</button></div>
        <p className="sidebar-label">PROJECT</p>
        <div className="sidebar-nav">{navigation.map(({ id, label, icon: Icon }) => <button key={id} title={label} aria-current={view === id ? 'page' : undefined} className={view === id ? 'active' : ''} onClick={() => setView(id)}><Icon size={16} /><span>{label}</span>{id === 'history' && patches.length > 0 && <b>{patches.length}</b>}</button>)}</div>
        <div className="sidebar-workspace"><span className="workspace-dot" /><small>{workspace?.isDemo ? 'LOCAL DEMO' : 'EXTERNAL · READ ONLY'}</small><strong>{workspace?.hostname ?? 'No workspace'}</strong><span>{workspace?.url ?? 'Open a site to begin'}</span></div>
        <div className="sidebar-bottom"><span className="team-stack"><i>AM</i><i>PS</i><i>JL</i><i>SR</i></span><span>4 local contributors</span></div>
      </aside>
      <div className="dashboard-main">
        <header className="workspace-topbar">
          <div className="topbar-page"><button onClick={() => setView('landing')} aria-label="Back to Landing Page"><ArrowLeft size={16} /></button><span>PATCHWORK</span><i>/</i><strong>{currentPage}</strong><span className="topbar-site-name">{workspace?.hostname}</span></div>
          <div className="topbar-tools"><span className="topbar-connection"><i />{workspace?.isDemo ? 'DEMO CONNECTED' : 'EXTERNAL · READ ONLY'}</span><span className="preview-only"><i /> PREVIEW ONLY</span><label className="developer-picker"><span>WORKING AS</span><select value={activeDeveloper} onChange={(event) => setActiveDeveloper(event.target.value)}>{DEVELOPERS.map((developer) => <option key={developer}>{developer}</option>)}</select></label></div>
        </header>
        {message && <div className={`toast-message toast-${message.type}`} role="status"><span aria-hidden="true">{message.type === 'success' ? '✓' : '!'}</span>{message.text}<button aria-label="Dismiss message" onClick={() => setMessage(null)}>×</button></div>}
        <div key={view} className="dashboard-content view-transition">
          {view === 'workspace' && workspace?.isDemo && <>
            <section className="workspace-heading"><div><p className="eyebrow">EDITOR WORKSPACE <span>·</span> {workspace.hostname}</p><h1>Patch the parts. <span>Protect the whole.</span></h1><p>Preview the fix. Validate the change. Ship with confidence.</p></div><div className="workspace-actions"><button className="secondary-button" onClick={handleRevalidate}><Search size={14} /> Revalidate patches</button><button className="secondary-button" onClick={handleResetPreview}><RotateCcw size={14} /> Reset preview</button><button className="primary-button" onClick={() => { setSelectedId(selectedPatch?.id ?? null); runBrowserChecks(); }} disabled={!selectedPatch || isChecking}><ShieldCheck size={14} /> Run verification</button></div></section>
            <PatchGenerator activeDeveloper={activeDeveloper} onCreated={handlePatchCreated} onMessage={setMessage} />
            <ConflictWarning patches={patches} websiteState={websiteState} onResolve={(keepId, rejectId) => { const result = resolveConflict(keepId, rejectId, activeDeveloper); if (result.ok) setSelectedId(keepId); return result; }} onMessage={setMessage} />
            <div className="editor-grid">
              <aside className="editor-left">
                <section className="panel element-panel"><div className="panel-heading"><div><p className="eyebrow">DEMO STRUCTURE</p><h2>Page Elements</h2></div><Code2 size={16} /></div><div className="element-search"><Search size={14} /><input aria-label="Search page elements" placeholder="Search page elements..." value={elementSearch} onChange={(event) => setElementSearch(event.target.value)} /></div><p className="element-panel-hint">Select a real demo element to edit its supported properties.</p><div className="element-list">{visibleElements.map(([target, definition], index) => { const Icon = elementIcons[target] ?? Code2; const targetPatches = patches.filter((patch) => patch.target === target); const targetStatus = conflictingTargets.has(target) ? 'conflict' : targetPatches.some((patch) => patch.status === 'pending') ? 'pending' : targetPatches.some((patch) => patch.status === 'applied') ? 'applied' : null; return <button key={target} title={definition.label} className={selectedTarget === target ? 'selected' : ''} onClick={() => { setSelectedTarget(target); setSelectionMode(false); }}><span className="element-index">0{index + 1}</span><Icon size={15} /><span><strong>{definition.label}</strong><small>{definition.semanticLabel}</small></span>{targetStatus && <span className={`element-status status-${targetStatus}`}>{formatStatus(targetStatus)}</span>}</button>; })}{visibleElements.length === 0 && <p className="element-search-empty">No matching elements.</p>}</div></section>
                <VisualInspector activeDeveloper={activeDeveloper} createPatch={createPatch} onCreated={handlePatchCreated} onMessage={setMessage} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} selectionMode={selectionMode} setSelectionMode={setSelectionMode} websiteState={websiteState} />
              </aside>
              <section className="panel preview-stage"><div className="panel-heading"><div><p className="eyebrow">ISOLATED DEMO PREVIEW</p><h2>SONORA Storefront</h2></div><span className="live-indicator"><i /> LOCAL STATE</span></div>
                <div className="preview-toolbar"><div className="segmented-control" aria-label="Preview State">{[['original', 'Original'], ['patched', 'Proposed'], ['compare', 'Compare']].map(([id, label]) => <button key={id} type="button" aria-pressed={previewMode === id} className={previewMode === id ? 'selected' : ''} onClick={() => setPreviewMode(id)}>{label}</button>)}</div><div className="viewport-control" aria-label="Preview Viewport">{[["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]].map(([id, Icon]) => <button key={id} type="button" aria-pressed={viewport === id} className={viewport === id ? 'selected' : ''} title={`${id} preview`} aria-label={`${id} preview`} onClick={() => setViewport(id)}><Icon size={15} /></button>)}</div><button className={`inspect-toggle ${selectionMode ? 'is-on' : ''}`} onClick={() => setSelectionMode((current) => !current)}>{selectionMode ? 'Stop Selecting' : 'Select Element'}</button></div>
                {selectedTarget && <div className="selected-element-label"><i />Selected: {TARGETS[selectedTarget].label}</div>}
                <div className="viewport-frame" ref={viewportFrameRef} data-viewport={viewport}>
                  <div className="viewport-canvas-wrap" style={{ height: `${canvasMetrics.height}px` }}>
                    <div className={`viewport-canvas canvas-${viewport} ${previewMode === 'compare' ? 'compare-previews' : ''}`} ref={viewportCanvasRef} style={{ width: `${VIEWPORT_WIDTHS[viewport]}px`, transform: `translateX(-50%) scale(${canvasMetrics.scale})` }}>
                  {previewMode === 'compare' ? <><div className="compare-side"><span>ORIGINAL</span><SampleWebsite websiteState={websiteState} selectedTarget={selectedTarget} selectionMode={selectionMode} onSelectTarget={handleElementSelected} layoutShifted={layoutShifted} onToggleLayout={() => moveElement()} onSimulateUpstreamChange={handleSimulatedUpstreamChange} showControls={false} /></div><div className="compare-side"><span>PROPOSED {selectedPatch?.id ?? ''}</span><SampleWebsite websiteState={proposedState} selectedTarget={selectedTarget} selectionMode={false} onSelectTarget={handleElementSelected} layoutShifted={layoutShifted} onToggleLayout={() => moveElement()} onSimulateUpstreamChange={handleSimulatedUpstreamChange} showControls={false} /></div></> : <SampleWebsite websiteState={previewMode === 'patched' ? proposedState : websiteState} selectedTarget={selectedTarget} selectionMode={selectionMode} onSelectTarget={handleElementSelected} layoutShifted={layoutShifted} onToggleLayout={() => { moveElement(); setMessage({ type: 'success', text: 'The product moved in the DOM. Stable and semantic context can re-locate its patches.' }); }} onSimulateUpstreamChange={handleSimulatedUpstreamChange} onSimulateElementIdChange={() => { const result = simulateElementIdChange(selectedPatch?.target ?? selectedTarget ?? 'buy-now-button', activeDeveloper); setMessage({ type: result.ok ? 'success' : 'error', text: result.message }); }} showControls />}
                    </div>
                  </div>
                </div><p className="state-note"><span>i</span> {previewMode === 'patched' ? 'Proposed changes are rendered temporarily and are not deployed.' : 'Changes remain local to PATCHWORK. External production sites are never modified.'}</p>
              </section>
              <aside className="editor-right"><PatchPreview patch={selectedPatch} currentValue={selectedPatch ? websiteState[selectedPatch.target]?.[selectedPatch.property] : undefined} latestRun={latestRun} verificationCurrent={verificationCurrent} isDeploying={deployingId === selectedPatch?.id} hasConflict={hasConflict} activeDeveloper={activeDeveloper} locatorState={locatorState} onDeploy={() => handleDeploy(selectedPatch?.id)} onReject={() => runAction(rejectPatch, selectedPatch.id)} onUpdate={(value) => { const result = updatePatch(selectedPatch.id, value, activeDeveloper); setMessage({ type: result.ok ? 'success' : 'error', text: result.message }); return result; }} onAddComment={(text) => { const result = addComment(selectedPatch.id, text, activeDeveloper); setMessage({ type: result.ok ? 'success' : 'error', text: result.message }); return result; }} onResolveTargetReview={(accepted) => { const result = resolveTargetReview(selectedPatch.id, accepted, activeDeveloper); setMessage({ type: result.ok ? 'success' : 'error', text: result.message }); }} /><VerificationPanel patch={selectedPatch} latestRun={latestRun} isRunning={isChecking} onRun={runBrowserChecks} /></aside>
            </div>
            <footer className="app-footer"><span>PATCHWORK <i>×</i> SONORA DEMO</span><span>Simulated releases · local-only collaboration · data persists in this browser</span></footer>
          </>}
          {view === 'workspace' && workspace && !workspace.isDemo && <><section className="workspace-heading"><div><p className="eyebrow">EXTERNAL WORKSPACE · VIEW ONLY</p><h1>{workspace.hostname}</h1><p>External pages may prevent iframe embedding and cannot expose their DOM to PATCHWORK.</p></div><button className="primary-button" onClick={() => openWorkspace(DEMO_URL, true)}>Open working demo <ArrowRight size={15} /></button></section><ExternalSitePreview key={workspace.id} url={workspace.url} onTryDemo={() => openWorkspace(DEMO_URL, true)} /></>}
          {view === 'workspace' && !workspace && <section className="panel no-workspace"><h2>No Website Workspace Yet</h2><p>Open a URL or try the built-in demo to start.</p><button className="primary-button" onClick={() => setView('landing')}>Connect Website</button></section>}
          {view === 'history' && <><section className="page-title"><p className="eyebrow">CHANGE RECORDS</p><h1>Patches</h1><p>Search staged changes, deployments, and reversions for this browser workspace.</p></section><PatchHistory patches={patches} activeDeveloper={activeDeveloper} onSelect={(id) => { setSelectedId(id); setView('workspace'); }} onRollback={rollbackPatch} onMessage={setMessage} /></>}
          {view === 'versions' && <><section className="page-title"><p className="eyebrow">SIMULATED RELEASES</p><h1>History</h1><p>Local version records only. No external production deployment is configured.</p></section><ReleasePanel releases={releases} patches={patches} full activeDeveloper={activeDeveloper} onRollback={rollbackPatch} onMessage={setMessage} /></>}
          {view === 'audit' && <><section className="page-title"><p className="eyebrow">APPEND-ONLY ACTIVITY</p><h1>Audit Trail</h1><p>Filter local workspace events by contributor, type, summary, or patch ID.</p></section><AuditTimeline entries={auditEntries} /></>}
          {view === 'team' && <TeamPanel patches={patches} auditEntries={auditEntries} />}
        </div>
      </div>
    </main>
  );
}