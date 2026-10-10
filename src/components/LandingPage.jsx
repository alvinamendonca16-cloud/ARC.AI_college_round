import { useState } from 'react';
import {
  ArrowDownRight, ArrowRight, CheckCheck, Code2, Fingerprint,
  GitCompareArrows, History, Layers3, Link2, ShieldCheck, UsersRound,
} from 'lucide-react';
import { normalizeWebsiteUrl } from '../utils/patchUtils.js';

const features = [
  { icon: Code2, title: 'Visual Patching', copy: 'Change content, styles, layout, and supported behavior without touching source files.' },
  { icon: Fingerprint, title: 'Smart Element Tracking', copy: 'Re-find moved demo elements from stable IDs, semantic labels, and structural context.' },
  { icon: UsersRound, title: 'Collaborative Editing', copy: 'Track contributors, discuss proposals, and resolve same-property conflicts together.' },
  { icon: Layers3, title: 'Isolated Preview', copy: 'Compare original and proposed states before a local change is deployed.' },
  { icon: CheckCheck, title: 'Automated Verification', copy: 'Run in-app DOM, value, render, and interaction checks on the controlled demo.' },
  { icon: GitCompareArrows, title: 'Versioned Deployment & Rollback', copy: 'Track simulated releases and safely restore a value only when it is still safe.' },
  { icon: History, title: 'Audit Trail', copy: 'Keep searchable local records of proposals, reviews, checks, releases, and reversions.' },
];

export function LandingPage({ onOpenWorkspace, onNavigate }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);

  function submit(event) {
    event.preventDefault();
    const result = normalizeWebsiteUrl(url);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError('');
    setOpening(true);
    window.setTimeout(() => {
      onOpenWorkspace(result.url, false);
      setOpening(false);
    }, 220);
  }

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a className="brand landing-brand" href="#home"><span className="brand-mark"><i /><i /><i /><i /></span><span>PATCHWORK</span></a>
        <nav aria-label="Main Navigation"><a href="#features">Features</a><a href="#how-it-works">How It Works</a><button onClick={() => onNavigate('history')}>Patches</button></nav>
        <a className="landing-start" href="#connect">Connect Website <ArrowRight size={15} /></a>
      </header>

      <main>
        <section className="landing-hero" id="home">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-rule" /> WEBSITE CHANGE CONTROL, REIMAGINED</p>
            <h1>Fix websites<br />without risking<br /><span>production.</span></h1>
            <p className="hero-description">Connect a website, select an element, and deploy a verified patch without rebuilding the original application.</p>
            <form className="url-entry" id="connect" onSubmit={submit}>
              <label htmlFor="website-url">Website URL</label>
              <div className="url-input-row"><Link2 size={18} aria-hidden="true" /><input id="website-url" type="text" inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" aria-describedby={error ? 'url-error' : 'url-hint'} /><button type="submit" disabled={opening}>{opening ? 'Connecting…' : 'Connect Website'} <ArrowRight size={16} /></button></div>
              {error ? <p id="url-error" className="field-error">{error}</p> : <p id="url-hint" className="field-hint">Your URL is used for a view-only preview. External sites may block iframe embedding.</p>}
            </form>
              <div className="landing-connection-state"><span /> Built-In Demo Ready <i /> External Sites: View Only</div>
            <button className="demo-link" onClick={() => onOpenWorkspace('https://sonora.patchwork.local/', true)}>Open Built-In Demo <ArrowDownRight size={15} /></button>
          </div>
          <div className="hero-visual" aria-label="Patch preview illustration">
            <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
            <div className="hero-window">
              <div className="hero-window-bar"><span /><span /><span /><small>sonora.store / product</small></div>
              <div className="hero-window-body"><div className="hero-product-image"><div className="headphone-shape" /></div><div className="hero-product-lines"><i /><i /><i /><b /></div><div className="hero-compare"><div><small>BEFORE</small><span className="hero-old-button">BUY NOW</span></div><ArrowRight size={17} /><div><small>PROPOSED</small><span className="hero-new-button">BUY NOW</span></div></div><div className="hero-patch-tag"><ShieldCheck size={14} /> LOCAL PREVIEW</div></div>
            </div>
            <div className="hero-side-label">A SAFER WAY TO SHIP<br /><span>01 / PATCHWORK</span></div>
          </div>
          <div className="hero-bottom-line"><span>CONNECT</span><i /><span>SELECT</span><i /><span>PATCH</span><i /><span>VERIFY</span><i /><span>DEPLOY</span></div>
        </section>

        <section className="how-section" id="how-it-works">
          <div className="section-heading"><div><p className="eyebrow">A SMALLER BLAST RADIUS</p><h2>Three steps. One safer change.</h2></div><p>From URL to reviewed patch, with the original site left alone.</p></div>
          <div className="steps-grid"><article><span>01</span><h3>Connect</h3><p>Enter a website URL or open the built-in demo workspace.</p></article><article><span>02</span><h3>Select & Patch</h3><p>Choose a real page element and stage a focused content, style, layout, or behavior change.</p></article><article><span>03</span><h3>Preview, Verify & Deploy</h3><p>Compare the proposal, run local checks, then deploy or roll back safely.</p></article></div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading"><div><p className="eyebrow">THE PATCHWORK TOOLKIT</p><h2>Control every small change.</h2></div><p>Local-first tools for careful website updates.</p></div>
          <div className="feature-grid">{features.map(({ icon: Icon, title, copy }, index) => <article className="landing-feature" key={title}><span className="feature-number">0{index + 1}</span><Icon size={20} strokeWidth={1.7} /><h3>{title}</h3><p>{copy}</p></article>)}</div>
        </section>
      </main>
      <footer className="landing-footer"><a className="brand landing-brand" href="#home"><span className="brand-mark"><i /><i /><i /><i /></span><span>PATCHWORK</span></a><p>Preview the fix. Validate the change. Ship with confidence.</p><nav aria-label="Footer Navigation"><a href="#features">Features</a><a href="#how-it-works">How It Works</a><button onClick={() => onNavigate('history')}>Patches</button></nav></footer>
    </div>
  );
}
