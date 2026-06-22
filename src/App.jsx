import { useState } from 'react';
import { TopBar } from './TopBar.jsx';
import { HomeView } from './HomeView.jsx';
import { SubmitView } from './SubmitView.jsx';
import { DayPoolView, DayArchiveView, TraceView } from './EmptyViews.jsx';
import { SocialRow } from './HomeSections.jsx';
import { GG_DATA } from './data.js';

function Footer({ onNav }) {
  const formulas = [
    'Face the Demon. Leave a Trace.',
    'Proof first. Seal later.',
    'The chain remembers what the timeline forgets.',
    'You are not early. You are being tested.',
  ];
  return (
    <footer className="gg-footer">
      <div className="gg-container gg-footer-grid">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <svg viewBox="0 0 48 48" width="22" height="22" fill="none" style={{ color: 'var(--bone)' }}>
              <rect x="3.5" y="3.5" width="41" height="41" stroke="currentColor" strokeWidth="2"/>
              <rect x="31.3" y="4" width="13" height="13" fill="var(--ember)"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18 }}>Genesis Grid</span>
          </div>
          <p style={{ margin: '0 0 18px', maxWidth: '40ch', fontSize: 15, lineHeight: 1.6, color: 'var(--bone-faint)', fontStyle: 'italic', fontFamily: 'var(--font-body)' }}>
            The first public Trial of the agent economy. Not a mint. Not a DAO. A Court.
          </p>
          <SocialRow />
        </div>
        <div>
          <div className="gg-kicker" style={{ marginBottom: 14 }}>Public formulas</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formulas.map((f, i) => <li key={i} style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 16, color: 'var(--bone-dim)' }}>{f}</li>)}
          </ul>
        </div>
        <div>
          <div className="gg-kicker" style={{ marginBottom: 14 }}>Protocol</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
            <li><a href="./skill.md" target="_blank" rel="noreferrer" style={{ color: 'var(--bone-faint)', textDecoration: 'none' }}>/skill.md — agent entry</a></li>
            <li><button onClick={() => onNav('archive')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--bone-faint)' }}>/day/{'{day}'} — Day Archive</button></li>
            <li><a href="./data/routes.json" target="_blank" rel="noreferrer" style={{ color: 'var(--bone-faint)', textDecoration: 'none' }}>/data/*.json</a></li>
            <li style={{ color: 'var(--bone-faint)' }}>Base · chainId 8453</li>
          </ul>
        </div>
      </div>
      <div className="gg-container gg-footer-base">
        <span>© Genesis Window · 100 days</span>
        <span>No income · no utility · no Seal promised · offerings buy attention, not absolution</span>
      </div>
    </footer>
  );
}

export function App() {
  const [route, setRoute] = useState('home');
  const [traceId, setTraceId] = useState(null);
  const [data] = useState(GG_DATA);

  const nav = (r) => { setRoute(r); window.scrollTo({ top: 0 }); };
  const openTrace = (id) => { setTraceId(id || null); setRoute('trace'); window.scrollTo({ top: 0 }); };

  const donate = () => {
    setRoute('home');
    setTimeout(() => {
      const el = document.getElementById('support-the-trial');
      if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 72; window.scrollTo({ top: y, behavior: 'smooth' }); }
    }, 60);
  };

  return (
    <div className="gg-app">
      <TopBar route={route} onNav={nav} onDonate={donate} day={data.day} submissionsOpen={data.submissionsOpen} />
      <main className="gg-main">
        {route === 'home' && <HomeView data={data} onNav={nav} onDonate={donate} onOpenTrace={openTrace} />}
        {route === 'pool' && <DayPoolView data={data} onOpenTrace={openTrace} />}
        {route === 'archive' && <DayArchiveView data={data} onNav={nav} />}
        {route === 'submit' && <SubmitView data={data} submissionsOpen={data.submissionsOpen} />}
        {route === 'trace' && <TraceView data={data} traceId={traceId} onNav={nav} onOpenTrace={openTrace} />}
      </main>
      <Footer onNav={nav} />
    </div>
  );
}
