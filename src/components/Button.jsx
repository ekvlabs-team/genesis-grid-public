import React from 'react';

/**
 * Genesis Grid — Button
 * The fire is rationed: `primary` (ember fill) is the one hot action per view.
 * `secondary` is a bone-outline, `ghost` is chrome. Sharp corners, no bounce —
 * press settles down like a stamp.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  full = false,
  iconLeft = null,
  iconRight = null,
  as = 'button',
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);

  const sizes = {
    sm: { padding: '7px 12px', font: 'var(--text-2xs)', gap: '6px' },
    md: { padding: '10px 18px', font: 'var(--text-xs)', gap: '8px' },
    lg: { padding: '14px 26px', font: 'var(--text-sm)', gap: '10px' },
  };
  const s = sizes[size] || sizes.md;

  const base = {
    display: full ? 'flex' : 'inline-flex',
    width: full ? '100%' : 'auto',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.gap,
    padding: s.padding,
    fontFamily: 'var(--font-mono)',
    fontSize: s.font,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    borderRadius: 'var(--radius-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
    transform: active && !disabled ? 'translateY(1px)' : 'translateY(0)',
    opacity: disabled ? 0.4 : 1,
    border: '1px solid transparent',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  const variants = {
    primary: {
      background: disabled ? 'var(--ember-deep)' : (active ? 'var(--ember-deep)' : hover ? 'var(--ember-bright)' : 'var(--ember)'),
      color: 'var(--text-on-ember)',
      borderColor: 'transparent',
      boxShadow: hover && !disabled ? 'var(--glow-ember)' : 'none',
    },
    secondary: {
      background: hover && !disabled ? 'var(--surface-hover)' : 'transparent',
      color: 'var(--bone)',
      borderColor: hover && !disabled ? 'var(--line-3)' : 'var(--line-2)',
    },
    ghost: {
      background: hover && !disabled ? 'var(--surface-hover)' : 'transparent',
      color: hover && !disabled ? 'var(--bone)' : 'var(--bone-dim)',
      borderColor: 'transparent',
    },
    seal: {
      background: disabled ? 'var(--seal-deep)' : (active ? 'var(--seal-deep)' : hover ? 'var(--seal-bright)' : 'var(--seal)'),
      color: 'var(--text-on-seal)',
      borderColor: 'transparent',
      boxShadow: hover && !disabled ? 'var(--glow-seal)' : 'none',
    },
    danger: {
      background: 'transparent',
      color: hover && !disabled ? 'var(--ember-bright)' : 'var(--ember)',
      borderColor: hover && !disabled ? 'var(--ember)' : 'var(--ember-deep)',
    },
  };

  const Tag = as;
  return (
    <Tag
      style={{ ...base, ...(variants[variant] || variants.primary) }}
      disabled={as === 'button' ? disabled : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setActive(false); }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </Tag>
  );
}
