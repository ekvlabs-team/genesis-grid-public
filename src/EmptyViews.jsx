import { CardKicker } from './components/Card.jsx';
import { Button } from './components/Button.jsx';
import { Badge } from './components/Badge.jsx';
import { TraceCard } from './components/TraceCard.jsx';

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
  const traces = Array.isArray(data.traces) ? data.traces : [];
  if (traces.length > 0) {
    return (
      <div className="gg-container gg-section">
        <div className="gg-section-head">
          <div>
            <CardKicker tone="ember">Day Pool</CardKicker>
            <h2 style={{ marginTop: 10 }}>Day {String(data.day).padStart(2, '0')} traces</h2>
          </div>
          <span className="gg-section-meta">{traces.length} public trace{traces.length === 1 ? '' : 's'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {traces.map((trace) => (
            <TraceCard key={trace.id} variant="compact" {...trace} onView={() => onOpenTrace(trace.id)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PrelaunchPlaceholder
      title="The Day Pool opens on Day 01."
      sub="No calls have been made yet. The 100-day Trial begins when the Oracle opens the Gate. Return on Day 01 to see the first traces enter the Pool."
    />
  );
}

export function DayArchiveView({ data, onNav }) {
  const archive = Array.isArray(data.archive) ? data.archive : [];
  if (archive.length > 0) {
    return (
      <div className="gg-container gg-section">
        <div className="gg-section-head">
          <div>
            <CardKicker tone="seal">Archive</CardKicker>
            <h2 style={{ marginTop: 10 }}>Sealed days</h2>
          </div>
          <span className="gg-section-meta">{archive.length} archived day{archive.length === 1 ? '' : 's'}</span>
        </div>
        <div className="gg-grid-2">
          {archive.map((day) => (
            <article key={day.day} className="gg-panel" style={{ padding: 20 }}>
              <div className="gg-row" style={{ gap: 8, marginBottom: 14 }}>
                <Badge tone="ember">Day {String(day.day).padStart(2, '0')}</Badge>
                <Badge tone="neutral">{day.status}</Badge>
              </div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--bone)' }}>
                {day.law || 'Law sealed'}
              </h3>
              <p style={{ margin: '12px 0 0', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
                {day.calledTokenIds.length} called · {day.awakened} awakened · {day.ash} ash
              </p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  return (
    <PrelaunchPlaceholder
      title="The Archive is empty before the first day."
      sub="Each sealed day will appear here after the Oracle closes it. The chain remembers what the timeline forgets — but only after Day 01."
    />
  );
}

export function TraceView({ data, traceId, onNav, onOpenTrace }) {
  const traces = Array.isArray(data.traces) ? data.traces : [];
  const trace = traceId ? traces.find((item) => item.id === traceId) : null;
  if (trace) {
    return (
      <div className="gg-container gg-section">
        <div className="gg-trace-layout">
          <TraceCard variant="featured" {...trace} />
          <aside className="gg-trace-aside">
            <div className="gg-panel" style={{ padding: 20 }}>
              <CardKicker tone="ember">Public trace</CardKicker>
              <div style={{ marginTop: 16 }}>
                <Button variant="secondary" onClick={() => onNav('pool')}>Back to Day Pool</Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (traces.length > 0) {
    return (
      <div className="gg-container gg-section" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center' }}>
        <div className="gg-panel" style={{ padding: '44px 48px', maxWidth: 640 }}>
          <CardKicker tone="ember">Trace</CardKicker>
          <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(26px, 4vw, 36px)', color: 'var(--bone)' }}>
            Choose a trace from the Day Pool.
          </h2>
          <div style={{ marginTop: 24 }}>
            <Button variant="secondary" onClick={() => onNav('pool')}>Open Day Pool</Button>
          </div>
        </div>
      </div>
    );
  }

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
