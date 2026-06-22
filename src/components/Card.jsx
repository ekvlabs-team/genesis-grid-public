import React from 'react';

/**
 * Genesis Grid — Card
 * A panel of the archive: lifted ink surface, hairline border, sharp corners.
 * Defined by its border, not a drop shadow. `interactive` warms the border and
 * lifts the surface on hover. `glow` brands it with ember or seal firelight.
 */
export function Card({ children, interactive = false, glow = null, padded = true, style = {}, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const glowShadow = glow === 'ember' ? 'var(--glow-ember)' : glow === 'seal' ? 'var(--glow-seal)' : 'var(--shadow-panel)';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: interactive && hover ? 'var(--ink-2)' : 'var(--surface-card)',
        border: `1px solid ${interactive && hover ? 'var(--line-3)' : 'var(--line-2)'}`,
        borderRadius: 'var(--radius-md)',
        padding: padded ? 'var(--space-5)' : 0,
        boxShadow: glowShadow,
        transition: 'background var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out)',
        cursor: interactive ? 'pointer' : 'default',
        position: 'relative',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Mono eyebrow / kicker label for card headers. */
export function CardKicker({ children, tone = 'muted' }) {
  const colors = { muted: 'var(--bone-faint)', ember: 'var(--ember)', seal: 'var(--seal)', prophet: 'var(--prophet)' };
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: colors[tone] || colors.muted }}>
      {children}
    </div>
  );
}
