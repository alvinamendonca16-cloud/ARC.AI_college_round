import { LoaderCircle } from 'lucide-react';
import { formatStatus } from '../utils/patchUtils.js';

export function VerificationPanel({ patch, latestRun, isRunning, onRun }) {
  return (
    <section className="panel feature-panel verification-panel">
      <div className="feature-heading"><span className="feature-index">03</span><div><p className="eyebrow">AUTOMATED VERIFICATION</p><h3>Browser Checks</h3></div></div>
      <p className="feature-copy">Check the live target, isolated proposed value, rendered baseline, and purchase interaction before deployment.</p>
      {patch?.status === 'pending' ? (
        <button className="feature-action" onClick={onRun} disabled={isRunning}>{isRunning ? <><LoaderCircle className="verification-spinner" size={14} /> Verifying…</> : latestRun?.passed ? 'Run Verification Again' : 'Run Verification'}{!isRunning && <span aria-hidden="true">↗</span>}</button>
      ) : <p className="feature-empty">Select a pending patch to verify it.</p>}
      {latestRun && (
        <div className="check-result">
          <div className={`check-summary ${latestRun.passed ? 'checks-pass' : 'checks-fail'}`}><strong>{latestRun.passed ? 'All Checks Passed' : 'Checks Need Attention'}</strong><span>{latestRun.checks.filter((check) => check.passed).length}/{latestRun.checks.length}</span></div>
          <ul>{latestRun.checks.map((check) => <li key={check.name} className={check.passed ? 'check-pass' : 'check-fail'}><i>{check.passed ? '✓' : '!'}</i><span>{check.name}</span></li>)}</ul>
          <time dateTime={latestRun.createdAt}>Run by {latestRun.actor} · {new Date(latestRun.createdAt).toLocaleTimeString()}</time>
        </div>
      )}
    </section>
  );
}