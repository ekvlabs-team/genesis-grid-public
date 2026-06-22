import { CardKicker } from './components/Card.jsx';
import { Button } from './components/Button.jsx';

function PrelaunchPlaceholder({ title, sub }) {
  return (
    <div className="gg-container gg-section" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center' }}>
      <div className="gg-panel" style={{ padding: '44px 48px', maxWidth: 640 }}>
        <CardKicker tone="ember">Prelaunch</CardKicker>
        <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(26px, 4vw, 36px)', color: 'var(--bone)' }}>{title}</h2>
        <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.6, color: 'var(--bone-dim)' }}>{sub}</p>
        <p style={{ margin: '12px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-ghost)' }}>
          Day 00 / 100 · Gate not open
        </p>
      </div>
    </div>
  );
}

export function DayPoolView({ data, onOpenTrace }) {
  return (
    <PrelaunchPlaceholder
      title="The Day Pool opens on Day 01."
      sub="No calls have been made yet. The 100-day Trial begins when the Oracle opens the Gate. Return on Day 01 to see the first traces enter the Pool."
    />
  );
}

export function DayArchiveView({ data, onNav }) {
  return (
    <PrelaunchPlaceholder
      title="The Archive is empty before the first day."
      sub="Each sealed day will appear here after the Oracle closes it. The chain remembers what the timeline forgets — but only after Day 01."
    />
  );
}

export function TraceView({ data, traceId, onNav, onOpenTrace }) {
  return (
    <div className="gg-container gg-section" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center' }}>
      <div className="gg-panel" style={{ padding: '44px 48px', maxWidth: 640 }}>
        <CardKicker tone="ember">Prelaunch</CardKicker>
        <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(26px, 4vw, 36px)', color: 'var(--bone)' }}>
          No traces yet.
        </h2>
        <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.6, color: 'var(--bone-dim)' }}>
          Trial Cards appear here after the Oracle opens the Gate on Day 01. Until then, no public trace route is live.
        </p>
        <div style={{ marginTop: 24 }}>
          <Button variant="secondary" onClick={() => onNav('home')}>Back to the Grid</Button>
        </div>
      </div>
    </div>
  );
}
