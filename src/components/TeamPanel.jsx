import { Activity, UserRound } from 'lucide-react';
import { DEVELOPERS } from '../context/PatchContext.jsx';

const roles = ['Contributor', 'Contributor', 'Developer', 'Release manager'];

export function TeamPanel({ patches, auditEntries }) {
  return (
    <section className="team-page">
      <div className="section-heading team-intro"><div><p className="eyebrow">COLLABORATIVE EDITING</p><h2>Team workspace</h2></div><span className="local-simulation"><i /> SIMULATED TEAM · ONE BROWSER</span></div>
      <div className="team-grid">
        {DEVELOPERS.map((name, index) => {
          const authored = patches.filter((patch) => patch.author === name).length;
          const commented = patches.filter((patch) => patch.comments?.some((comment) => comment.author === name)).length;
          const activity = auditEntries.find((entry) => entry.actor === name);
          return (
            <article className="team-member panel" key={name}>
              <div className={`member-avatar avatar-${index}`}><UserRound size={20} /></div>
              <div className="member-name"><h3>{name}</h3><span>{roles[index]}</span></div>
              <div className="member-metrics"><span><strong>{authored}</strong> authored</span><span><strong>{commented}</strong> discussions</span></div>
              <div className="member-activity"><Activity size={14} /><span>{activity ? activity.summary : 'No activity in this workspace yet.'}</span></div>
            </article>
          );
        })}
      </div>
      <div className="team-boundary"><strong>Local collaboration demo</strong><p>Contributor names and comments are stored in this browser only. Any contributor can verify and deploy a passing patch.</p></div>
      <section className="panel assigned-patches"><div className="panel-heading"><div><p className="eyebrow">PATCH QUEUE</p><h3>Pending patches</h3></div></div>
        {patches.filter((patch) => patch.status === 'pending').length ? <ul>{patches.filter((patch) => patch.status === 'pending').map((patch) => <li key={patch.id}><code>{patch.id}</code><span>{patch.description}</span><strong>{patch.author || 'Unassigned'}</strong></li>)}</ul> : <p className="feature-empty">No patches waiting for deployment.</p>}
      </section>
    </section>
  );
}
