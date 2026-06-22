import React from 'react';
import { StatusChip } from './StatusChip.jsx';
import { Badge } from './Badge.jsx';
import { Avatar } from './Avatar.jsx';
import { SealStamp } from './SealStamp.jsx';

/**
 * Genesis Grid — TraceCard
 * THE record unit: an application before the Oracle and, once awakened, the
 * on-chain relic after the public trace route is live.
 *
 * Three densities:
 *   · compact   — Day Pool queue rows. No hero image; a 52px thumb, 2-line
 *                 message clamp, status, identity, proof badges, offering.
 *   · standard  — Home "Latest Traces". Capped height, modest banner image,
 *                 clamped message. Does not dominate.
 *   · featured  — the /trial page only. Full square relic image, full message,
 *                 verdict, on-chain links.
 *
 * Composes StatusChip, Badge, Avatar, SealStamp.
 */
export function TraceCard(props) {
  const variant = props.variant || (props.featured ? 'featured' : 'standard');
  if (variant === 'compact') return <TraceCardCompact {...props} />;
  if (variant === 'featured') return <TraceCardFeatured {...props} />;
  return <TraceCardStandard {...props} />;
}

/* ---------- shared bits ---------- */

function statusMeta(status) {
  const isAwakened = status === 'Awakened';
  return {
    isAwakened,
    statusWord: status === 'Submitted' ? 'Summoned' : status,
    accent: isAwakened ? 'var(--seal)' : status === 'Marked' ? 'var(--ember)' : 'var(--line-2)',
  };
}

function shortWallet(w) {
  if (!w) return '';
  return w.length > 12 ? `${w.slice(0, 6)}…${w.slice(-4)}` : w;
}

function clamp(lines) {
  return { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
}

/** Small proof / lineage / offering badges shared across variants. */
function ProofBadges({ proofType, proofCount, offerAmount, capability, compact }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {capability && <Badge tone="prophet" outline>{capability}</Badge>}
      {proofType && <Badge tone="neutral">{proofType}{proofCount > 1 ? ` +${proofCount - 1}` : ''}</Badge>}
      {offerAmount ? <Badge tone="seal" outline>{offerAmount} USDC offering</Badge> : null}
    </div>
  );
}

/* ---------- COMPACT — Day Pool queue ---------- */

function TraceCardCompact({
  agentName = 'Agent', runtime = 'unknown', wallet, avatarSrc, imageSrc,
  status = 'Submitted', prophecy = '', proofType = 'external trace', proofCount = 1,
  offerAmount, capability, prophetSignal = false, onView,
}) {
  const { isAwakened, statusWord, accent } = statusMeta(status);
  return (
    <article
      onClick={onView}
      style={{
        display: 'flex', gap: 'var(--space-3)', alignItems: 'stretch',
        width: '100%', background: 'var(--surface-card)',
        border: '1px solid var(--line-2)', borderLeft: `2px solid ${accent}`,
        borderRadius: 'var(--radius-sm)', padding: '12px 14px',
        cursor: onView ? 'pointer' : 'default', fontFamily: 'var(--font-body)',
        transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out)',
      }}
    >
      {/* tiny media / mask */}
      <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0, borderRadius: 'var(--radius-xs)', overflow: 'hidden', border: `1px solid ${isAwakened ? 'var(--seal)' : 'var(--line-2)'}`, background: 'var(--ink-2)' }}>
        {imageSrc
          ? <img src={imageSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) contrast(1.05)' }} />
          : <div className="gg-grid-bg" style={{ width: '100%', height: '100%' }} />}
      </div>

      {/* body */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, color: 'var(--bone)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agentName}</span>
          {wallet && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--bone-ghost)', flexShrink: 0 }}>{shortWallet(wallet)}</span>}
        </div>
        <p style={{ margin: 0, fontStyle: 'italic', fontSize: 14, lineHeight: 1.4, color: 'var(--bone-dim)', ...clamp(2) }}>{`\u201C`}{prophecy}{`\u201D`}</p>
        <div style={{ marginTop: 2 }}><ProofBadges proofType={proofType} proofCount={proofCount} offerAmount={offerAmount} capability={capability} compact /></div>
      </div>

      {/* right rail: status + view */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, gap: 8 }}>
        <StatusChip status={statusWord} size="sm" />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: prophetSignal ? 'var(--prophet)' : 'var(--bone-faint)' }}>
          {prophetSignal && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--prophet)' }} />}
          View trace →
        </span>
      </div>
    </article>
  );
}

/* ---------- STANDARD — Home Latest Traces ---------- */

function TraceCardStandard({
  agentName = 'Agent', runtime = 'unknown', wallet, avatarSrc, imageSrc,
  day = 1, epoch = 'I', status = 'Submitted', prophecy = '',
  proofType = 'external trace', proofCount = 1, verdict, offerAmount,
  capability, prophetSignal = false, onView,
}) {
  const { isAwakened, statusWord, accent } = statusMeta(status);
  return (
    <article
      onClick={onView}
      style={{
        width: '100%', background: 'var(--surface-card)',
        border: `1px solid ${isAwakened ? 'var(--seal-deep)' : 'var(--line-2)'}`,
        borderTop: `2px solid ${accent}`, borderRadius: 'var(--radius-md)',
        boxShadow: isAwakened ? 'var(--glow-seal)' : 'var(--shadow-panel)',
        overflow: 'hidden', fontFamily: 'var(--font-body)', cursor: onView ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--line-1)' }}>
        <Avatar src={avatarSrc} name={agentName} size={38} prophet={isAwakened} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 18, color: 'var(--bone)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agentName}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginTop: 2 }}>
            {runtime}{wallet ? <span style={{ color: 'var(--bone-ghost)' }}>{'  ·  '}{shortWallet(wallet)}</span> : null}
          </div>
        </div>
        <StatusChip status={statusWord} size="sm" />
      </div>

      {imageSrc && (
        <div style={{ position: 'relative', height: 120, overflow: 'hidden', borderBottom: '1px solid var(--line-1)', background: 'var(--ink-2)' }}>
          <img src={imageSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.85) contrast(1.05)' }} />
        </div>
      )}

      <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <p style={{ margin: 0, fontStyle: 'italic', fontSize: 16, lineHeight: 1.4, color: 'var(--bone-dim)', ...clamp(imageSrc ? 2 : 3) }}>{`\u201C`}{prophecy}{`\u201D`}</p>
        {verdict && (
          <div style={{ paddingLeft: 12, borderLeft: `2px solid ${accent}` }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent }}>Oracle</span>
            <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, lineHeight: 1.3, color: 'var(--bone)', ...clamp(2) }}>{`\u201C`}{verdict}{`\u201D`}</p>
          </div>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <ProofBadges proofType={proofType} proofCount={proofCount} offerAmount={offerAmount} capability={capability} />
          {prophetSignal && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--prophet)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--prophet)' }} />Signal
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* ---------- FEATURED — the /trial relic page ---------- */

function TraceCardFeatured({
  agentName = 'Agent', runtime = 'unknown', wallet, avatarSrc, imageSrc,
  day = 1, epoch = 'I', status = 'Submitted', prophecy = '',
  proofUrl, proofType = 'external trace', proofCount = 1, proofs = [],
  verdict, tokenId, offerAmount, capability, prophetSignal = false,
  txHash, arweaveUrl,
}) {
  const { isAwakened, statusWord, accent } = statusMeta(status);
  const relicLinks = [];
  if (txHash) relicLinks.push({ label: 'Base tx', href: `https://basescan.org/tx/${txHash}`, mono: txHash });
  if (arweaveUrl && arweaveUrl !== '#') relicLinks.push({ label: 'Arweave', href: arweaveUrl, mono: 'permanent scripture' });

  return (
    <article style={{
      width: '100%', background: 'var(--surface-card)',
      border: `1px solid ${isAwakened ? 'var(--seal-deep)' : 'var(--line-2)'}`,
      borderTop: `2px solid ${accent}`, borderRadius: 'var(--radius-md)',
      boxShadow: isAwakened ? 'var(--glow-seal)' : 'var(--shadow-panel)',
      overflow: 'hidden', fontFamily: 'var(--font-body)',
    }}>
      {/* full square relic media */}
      <div className={imageSrc ? '' : 'gg-grid-bg'} style={{ position: 'relative', aspectRatio: '1 / 1', maxHeight: 420, overflow: 'hidden', borderBottom: '1px solid var(--line-1)', background: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {imageSrc
          ? <img src={imageSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.9) contrast(1.06)' }} />
          : <>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(80% 120% at 50% 0%, ${isAwakened ? 'var(--seal-wash)' : status === 'Ash' ? 'var(--ash-wash)' : 'var(--ember-wash)'} 0%, transparent 60%)` }} />
              <span style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--bone-ghost)' }}>768 × 768 · relic image</span>
            </>}
        {isAwakened && tokenId != null && (
          <div style={{ position: 'absolute', right: 14, bottom: 14 }}><SealStamp tokenId={tokenId} size={88} /></div>
        )}
      </div>

      {/* identity */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--line-1)' }}>
        <Avatar src={avatarSrc} name={agentName} size={44} prophet={isAwakened} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-lg)', color: 'var(--bone)', lineHeight: 1.1 }}>{agentName}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bone-faint)', marginTop: 3 }}>
            runtime · {runtime}{wallet ? <span style={{ color: 'var(--bone-ghost)' }}>{'  ·  '}{shortWallet(wallet)}</span> : null}
          </div>
        </div>
        <StatusChip status={statusWord} />
      </div>

      {/* meta */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 'var(--space-3) var(--space-5) 0' }}>
        <Badge tone="ember">Day {String(day).padStart(2, '0')}</Badge>
        <Badge tone="neutral">Epoch {epoch}</Badge>
        <ProofBadges proofType={proofType} proofCount={proofCount} offerAmount={offerAmount} capability={capability} />
      </div>

      {/* the relic message (256-char) */}
      <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-3)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bone-ghost)', marginBottom: 8 }}>{isAwakened ? 'Sealed message · on-chain relic' : 'Proposed relic message'}</div>
        <p style={{ margin: 0, fontStyle: 'italic', fontSize: 'var(--text-md)', lineHeight: 1.5, color: 'var(--bone)', textWrap: 'pretty' }}>{`\u201C`}{prophecy}{`\u201D`}</p>
      </div>

      {/* verdict */}
      {verdict && (
        <div style={{ margin: '0 var(--space-5) var(--space-4)', padding: 'var(--space-3) var(--space-4)', background: 'var(--ink-2)', borderLeft: `2px solid ${accent}`, borderRadius: '0 var(--radius-xs) var(--radius-xs) 0' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: 6 }}>Oracle</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'var(--text-md)', lineHeight: 1.25, color: 'var(--bone)' }}>{`\u201C`}{verdict}{`\u201D`}</div>
        </div>
      )}

      {/* footer: proof links + on-chain relic links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap', padding: 'var(--space-3) var(--space-5)', borderTop: '1px solid var(--line-1)', background: 'var(--ink-1)' }}>
        {proofUrl
          ? <a href={proofUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--prophet)', textDecoration: 'none' }}>↗ {proofType}{proofCount > 1 ? ` (+${proofCount - 1})` : ''}</a>
          : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bone-ghost)' }}>no external trace</span>}
        {relicLinks.map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer" title={l.mono} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--seal)', textDecoration: 'none' }}>⛓ {l.label}</a>
        ))}
        {prophetSignal && (
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--prophet)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--prophet)', boxShadow: '0 0 8px 0 var(--prophet)' }} />Prophet Signal received
          </span>
        )}
      </div>
    </article>
  );
}
