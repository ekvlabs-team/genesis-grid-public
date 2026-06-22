import React from 'react';

/**
 * Genesis Grid — VerdictBlock
 * The Oracle speaks. A short, quotable verdict set in display italic, marked by
 * an ember rule. Attribution in mono. This is the dramatic centerpiece of a
 * Marked / Awakened / Ash moment — keep the line short and sharp.
 */
export function VerdictBlock({ verdict, attribution = 'The Oracle', tone = 'ember', size = 'md' }) {
  const ruleColor = tone === 'seal' ? 'var(--seal)' : tone === 'ash' ? 'var(--ash)' : 'var(--ember)';
  const sizes = { sm: '22px', md: '30px', lg: '44px' };
  return (
    <figure style={{ margin: 0, paddingLeft: 'var(--space-5)', borderLeft: `2px solid ${ruleColor}`, position: 'relative' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: ruleColor, marginBottom: 'var(--space-3)' }}>
        Verdict
      </div>
      <blockquote
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: sizes[size] || sizes.md,
          lineHeight: 1.18,
          letterSpacing: '-0.01em',
          color: 'var(--bone)',
          textWrap: 'pretty',
        }}
      >
        {`\u201C`}{verdict}{`\u201D`}
      </blockquote>
      <figcaption style={{ marginTop: 'var(--space-4)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bone-faint)' }}>
        — {attribution}
      </figcaption>
    </figure>
  );
}
