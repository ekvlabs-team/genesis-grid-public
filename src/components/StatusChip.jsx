import React from 'react';

const STATUS = {
  Summoned: { color: 'var(--status-summoned)', wash: 'var(--status-summoned-wash)', border: 'var(--status-summoned)' },
  Marked:   { color: 'var(--status-marked)',   wash: 'var(--status-marked-wash)',   border: 'var(--status-marked)' },
  Awakened: { color: 'var(--status-awakened)', wash: 'var(--status-awakened-wash)', border: 'var(--status-awakened)' },
  Ash:      { color: 'var(--status-ash)',      wash: 'var(--status-ash-wash)',      border: 'var(--status-ash)' },
  Hidden:   { color: 'var(--status-hidden)',   wash: 'transparent',                 border: 'var(--line-3)' },
};

/**
 * Genesis Grid — StatusChip
 * The five trial states, readable in one second. A small glyph + the word.
 * Ash dissolves; Awakened is filled brass; Marked carries the ember brand.
 */
export function StatusChip({ status = 'Summoned', size = 'md' }) {
  const s = STATUS[status] || STATUS.Summoned;
  const sm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: sm ? '6px' : '7px',
        padding: sm ? '3px 8px' : '5px 10px',
        borderRadius: 'var(--radius-xs)',
        background: s.wash,
        border: `1px solid ${s.border}`,
        color: s.color,
        fontFamily: 'var(--font-mono)',
        fontSize: sm ? '10px' : 'var(--text-2xs)',
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <StatusGlyph status={status} />
      {status}
    </span>
  );
}

/** Geometric status sigil — no icon font needed. */
export function StatusGlyph({ status = 'Summoned', sizePx = 8 }) {
  const s = STATUS[status] || STATUS.Summoned;
  const box = { width: sizePx, height: sizePx, flexShrink: 0, display: 'inline-block' };
  if (status === 'Awakened') {
    return <span style={{ ...box, background: s.color, borderRadius: '50%' }} />;
  }
  if (status === 'Summoned') {
    return <span style={{ ...box, border: `1.5px solid ${s.color}`, borderRadius: '50%' }} />;
  }
  if (status === 'Marked') {
    return <span style={{ ...box, background: s.color, transform: 'skewX(-18deg)' }} />;
  }
  if (status === 'Ash') {
    return (
      <span style={{ ...box, position: 'relative' }}>
        <span style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 30%, ${s.color} 0 1px, transparent 1.5px), radial-gradient(circle at 70% 60%, ${s.color} 0 1px, transparent 1.5px), radial-gradient(circle at 45% 80%, ${s.color} 0 1px, transparent 1.5px)` }} />
      </span>
    );
  }
  return <span style={{ ...box, border: `1.5px solid ${s.color}`, opacity: 0.6 }} />;
}
