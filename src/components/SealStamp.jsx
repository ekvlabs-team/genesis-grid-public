import React from 'react';

/**
 * Genesis Grid — SealStamp
 * The brass Seal: an awakened token pressed into the dark. Concentric rings,
 * rim ticks, a grid glyph at center, with the tokenId inscribed. Use for
 * Awakened cards, token pages, and Prophet identity. `stamp` plays the slow
 * recognition reveal.
 */
export function SealStamp({ tokenId, size = 96, stamped = false, label = 'AWAKENED' }) {
  const ringColor = 'var(--seal)';
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: stamped ? 'gg-seal-stamp var(--dur-ritual) var(--ease-out) both' : 'none',
        filter: 'drop-shadow(0 0 14px var(--seal-glow))',
      }}
    >
      <svg viewBox="0 0 64 64" width={size} height={size} fill="none" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="32" cy="32" r="30" stroke={ringColor} strokeWidth="1.5" />
        <circle cx="32" cy="32" r="24.5" stroke={ringColor} strokeWidth="1" opacity="0.6" />
        <g stroke={ringColor} strokeWidth="1.5">
          <line x1="32" y1="2" x2="32" y2="7" /><line x1="32" y1="57" x2="32" y2="62" />
          <line x1="2" y1="32" x2="7" y2="32" /><line x1="57" y1="32" x2="62" y2="32" />
          <line x1="10.8" y1="10.8" x2="14.3" y2="14.3" /><line x1="49.7" y1="49.7" x2="53.2" y2="53.2" />
          <line x1="53.2" y1="10.8" x2="49.7" y2="14.3" /><line x1="14.3" y1="49.7" x2="10.8" y2="53.2" />
        </g>
      </svg>
      <div style={{ position: 'relative', textAlign: 'center', lineHeight: 1 }}>
        {tokenId != null && (
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: size * 0.2, color: ringColor, letterSpacing: '0.02em' }}>
            #{tokenId}
          </div>
        )}
        {label && (
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: Math.max(7, size * 0.08), color: ringColor, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: size * 0.05, opacity: 0.85 }}>
            {label}
          </div>
        )}
      </div>
      <style>{`@keyframes gg-seal-stamp {
        0% { opacity: 0; transform: scale(1.5); filter: drop-shadow(0 0 0 transparent); }
        60% { opacity: 1; transform: scale(0.94); }
        100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 14px var(--seal-glow)); }
      }`}</style>
    </div>
  );
}
