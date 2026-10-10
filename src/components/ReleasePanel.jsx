import { useState } from 'react';

export function ReleasePanel({ releases, patches = [], full = false, activeDeveloper, onRollback, onMessage }) {
  const [expandedVersion, setExpandedVersion] = useState(null);
  const currentVersion = releases[0]?.version ?? 'v1.0.0';
  return (
    <section className="panel feature-panel release-panel">
      <div className="feature-heading"><span className="feature-index">04</span><div><p className="eyebrow">SIMULATED DEPLOYMENT</p><h3>Release History</h3></div></div>
      <div className="release-current"><span>LIVE RELEASE</span><strong>{currentVersion}</strong><i>●</i></div>
      {releases.length ? (
        <ol className="release-list">
          {(full ? releases : releases.slice(0, 4)).map((release) => {
            const patch = patches.find((record) => record.id === release.patchId);
            const canRollback = release.action === 'deploy' && patch?.status === 'applied';
            return (
            <li key={`${release.version}-${release.action}`}>
              <span className={`release-dot release-${release.status}`} />
              <span className="release-label"><strong>{release.action === 'rollback' ? 'Rollback' : release.action === 'upstream' ? `Upstream edit · ${release.target}` : release.action === 'reset' ? 'Preview reset' : `Deploy · ${release.patchId}`}</strong><small>{release.actor} · {new Date(release.createdAt).toLocaleString()}</small></span>
              <code>{release.version}</code>
              {full && <div className="release-record-actions"><button className="text-button" onClick={() => setExpandedVersion(expandedVersion === release.version ? null : release.version)}>{expandedVersion === release.version ? 'Hide changes' : 'View changes'}</button>{canRollback && <button className="text-button rollback-button" onClick={() => { if (!window.confirm(`Roll back ${release.patchId} from ${release.version}?`)) return; const result = onRollback(release.patchId, activeDeveloper); onMessage({ type: result.ok ? 'success' : 'error', text: result.message }); }}>Rollback</button>}</div>}
              {full && expandedVersion === release.version && <div className="release-details"><strong>{patch?.description ?? release.summary ?? 'Local preview state change'}</strong><span>{release.target ? `${release.target}.${release.property}: ${release.oldValue} → ${release.newValue}` : patch ? `${patch.property}: ${patch.oldValue} → ${patch.newValue}` : release.changeSummary ?? 'No patch changes are attached to this event.'}</span><small>{release.verificationPassed === undefined ? 'Verification: Not Applicable' : `Verification: ${release.verificationPassed ? 'Passed' : 'Failed'}`}</small></div>}
            </li>
          );})}
        </ol>
      ) : <p className="feature-empty">No deployments yet. A verified patch creates the first release.</p>}
    </section>
  );
}