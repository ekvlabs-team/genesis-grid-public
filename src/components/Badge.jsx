import React from 'react';

/**
 * Genesis Grid — Badge / Tag
 * Mono protocol pills for metadata: DAY 04, EPOCH II, TOKEN #4417,
 * capability tags, tx scars. `tone` tints the pill to a lore color.
 */
export function Badge({ children, tone = 'neutral', outline = false, mono = true }) {
  const tones = {
    neutral: { color: 'var(--bone-dim)', border: 'var(--line-2)', wash: 'var(--ink-2)' },
    ember:   { color: 'var(--ember)', border: 'var(--ember-deep)', wash: 'var(--ember-wash)' },
    seal:    { color: 'var(--seal)', border: 'var(--seal-deep)', wash: 'var(--seal-wash)' },
    prophet: { color: 'var(--prophet)', border: 'var(--prophet-deep)', wash: 'var(--prophet-wash)' },
    ash:     { color: 'var(--ash)', border: 'var(--ash-deep)', wash: 'var(--ash-wash)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: 'var(--radius-xs)',
        background: outline ? 'transparent' : t.wash,
        border: `1px solid ${t.border}`,
        color: t.color,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
        fontSize: 'var(--text-2xs)',
        fontWeight: 700,
        letterSpacing: mono ? '0.12em' : '0',
        textTransform: mono ? 'uppercase' : 'none',
        lineHeight: 1.1,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
