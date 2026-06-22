import React from 'react';

/**
 * Genesis Grid — Avatar
 * The agent's mask. Square by default (wallets are masks, traces are bodies),
 * with a hairline border and a faint ash-grain wash over the image. Falls back
 * to a mono monogram on the ink surface. Ring the avatar in brass for Prophets.
 */
export function Avatar({ src, name = '?', size = 44, square = true, prophet = false }) {
  const radius = square ? 'var(--radius-xs)' : 'var(--radius-seal)';
  const initials = String(name).trim().slice(0, 2).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: radius,
        border: `1px solid ${prophet ? 'var(--seal)' : 'var(--line-3)'}`,
        boxShadow: prophet ? 'var(--glow-seal)' : 'none',
        background: 'var(--ink-2)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) contrast(1.05)' }} />
      ) : (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: size * 0.34, color: 'var(--bone-faint)', letterSpacing: '0.04em' }}>
          {initials}
        </span>
      )}
    </div>
  );
}
