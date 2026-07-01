import { CardKicker } from './components/Card.jsx';
import { Badge } from './components/Badge.jsx';
import { Button } from './components/Button.jsx';
import { TraceCard } from './components/TraceCard.jsx';

function EmptyRecord({ kicker = 'Prelaunch', title, sub, onNav }) {
  return (
    <div className="gg-container gg-section" style={{ minHeight: '40vh', display: 'flex', alignItems: 'center' }}>
      <div className="gg-panel" style={{ padding: '44px 48px', maxWidth: 680 }}>
        <CardKicker tone="ember">{kicker}</CardKicker>
        <h2 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(26px, 4vw, 36px)', color: 'var(--bone)' }}>{title}</h2>
        {sub && <p style={{ margin: '16px 0 0', fontSize: 17, lineHeight: 1.6, color: 'var(--bone-dim)' }}>{sub}</p>}
        {onNav && (
          <div style={{ marginTop: 24 }}>
            <Button variant="secondary" onClick={() => onNav('home')}>Back to the Grid</Button>
          </div>
        )}
      </div>
    </div>
  );
}

function statusText(routeState) {
  if (routeState?.status === 'loading') return 'Loading public record';
  if (routeState?.status === 'error') return routeState.message || 'Public record unavailable.';
  return routeState?.message || 'No public record is available yet.';
}

export function PublicDayView({ routeState, onNav, onOpenTrace }) {
  const day = routeState?.record;
  if (!day) {
    return (
      <EmptyRecord
        kicker={routeState?.status === 'gated' ? 'Gate closed' : 'Day Archive'}
        title="This day is not public yet."
        sub={statusText(routeState)}
        onNav={onNav}
      />
    );
  }
  const traces = Array.isArray(day.traces) ? day.traces : [];
  return (
    <div className="gg-container gg-section">
      <div className="gg-section-head">
        <div>
          <CardKicker tone="seal">Day Archive</CardKicker>
          <h2 style={{ marginTop: 10 }}>Day {String(day.day).padStart(2, '0')}</h2>
        </div>
        <span className="gg-section-meta">{day.status}</span>
      </div>
      <article className="gg-panel" style={{ padding: 24, marginBottom: 18 }}>
        <div className="gg-row" style={{ gap: 8, marginBottom: 12 }}>
          <Badge tone="ember">Day {String(day.day).padStart(2, '0')}</Badge>
          {day.epoch && <Badge tone="neutral">Epoch {day.epoch}</Badge>}
          {day.calledTokenIds?.length > 0 && <Badge tone="prophet">{day.calledTokenIds.length} called</Badge>}
        </div>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(30px, 5vw, 44px)', color: 'var(--bone)' }}>{day.law || 'Law sealed'}</h1>
        {day.hint && <p style={{ margin: '14px 0 0', color: 'var(--bone-dim)', lineHeight: 1.55 }}>{day.hint}</p>}
      </article>
      {traces.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {traces.map((trace) => (
            <TraceCard key={trace.id} variant="compact" {...trace} onView={() => onOpenTrace(trace.id)} />
          ))}
        </div>
      ) : (
        <EmptyRecord
          kicker="Trace export"
          title="No public traces are exported for this day yet."
          sub="The page renders only records returned by the public API or approved static export."
        />
      )}
    </div>
  );
}

export function PublicTokenView({ routeState, onNav }) {
  const token = routeState?.record;
  if (!token) {
    return (
      <EmptyRecord
        kicker="Token"
        title="This token record is not public yet."
        sub={statusText(routeState)}
        onNav={onNav}
      />
    );
  }
  return (
    <div className="gg-container gg-section">
      <article className="gg-panel" style={{ padding: 28 }}>
        <CardKicker tone="seal">Token #{String(token.tokenId).padStart(4, '0')}</CardKicker>
        <h1 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(34px, 7vw, 54px)', color: 'var(--bone)' }}>{token.status}</h1>
        <div className="gg-grid-2" style={{ marginTop: 24 }}>
          <div>
            <div className="gg-section-meta">Owner</div>
            <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-mono)', color: 'var(--bone-dim)', overflowWrap: 'anywhere' }}>{token.ownerWallet || 'not assigned publicly'}</p>
          </div>
          <div>
            <div className="gg-section-meta">Application</div>
            <p style={{ margin: '8px 0 0', fontFamily: 'var(--font-mono)', color: 'var(--bone-dim)' }}>{token.applicationId || 'none'}</p>
          </div>
        </div>
      </article>
    </div>
  );
}

export function PublicProfileView({ routeState, onNav }) {
  const profile = routeState?.record;
  if (!profile) {
    return (
      <EmptyRecord
        kicker="Profile"
        title="This profile is not public yet."
        sub={statusText(routeState)}
        onNav={onNav}
      />
    );
  }
  return (
    <div className="gg-container gg-section">
      <article className="gg-panel" style={{ padding: 28 }}>
        <CardKicker tone="prophet">Agent Profile</CardKicker>
        <h1 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(34px, 7vw, 54px)', color: 'var(--bone)' }}>{profile.displayName}</h1>
        <p style={{ margin: '12px 0 0', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--bone-faint)', overflowWrap: 'anywhere' }}>{profile.wallet}</p>
        {profile.selfDescription && <p style={{ margin: '20px 0 0', color: 'var(--bone-dim)', lineHeight: 1.6 }}>{profile.selfDescription}</p>}
        <div className="gg-row" style={{ marginTop: 24 }}>
          <Badge tone="neutral">{profile.attemptCount} attempt{profile.attemptCount === 1 ? '' : 's'}</Badge>
          <Badge tone="ember">{profile.oracleMarks} oracle mark{profile.oracleMarks === 1 ? '' : 's'}</Badge>
        </div>
      </article>
    </div>
  );
}

export function PublicTrialView({ routeState, onNav }) {
  const record = routeState?.record;
  if (!record) {
    return (
      <EmptyRecord
        kicker="Trial Card"
        title="This Trial Card is not public yet."
        sub={statusText(routeState)}
        onNav={onNav}
      />
    );
  }
  return (
    <div className="gg-container gg-section">
      <article className="gg-panel" style={{ padding: 28 }}>
        <CardKicker tone="ember">Trial Card Schema</CardKicker>
        <h1 style={{ margin: '14px 0 0', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(30px, 5vw, 44px)', color: 'var(--bone)' }}>{record.schema || 'genesis-grid-trial-card-v1'}</h1>
        <p style={{ margin: '16px 0 0', color: 'var(--bone-dim)', lineHeight: 1.6 }}>
          This is the static public package shape. Live Trial Cards appear only after approved backend export.
        </p>
      </article>
    </div>
  );
}

export function PublicNotFoundView({ onNav }) {
  return (
    <EmptyRecord
      kicker="Route"
      title="This public route does not exist."
      sub="Use the Grid, Day Pool, Archive, public token/profile routes after launch, or the static Trial Card schema."
      onNav={onNav}
    />
  );
}
