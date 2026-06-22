import React from 'react';

/**
 * Genesis Grid — Input / Field
 * A sunken ink well with an inset shadow and a mono uppercase label. Focus
 * lights an ember ring. Supports prefix (e.g. a # or 0x sigil) and a hint/error
 * line. Use `textarea` for the prophecy / message field.
 */
export function Input({
  label,
  hint,
  error,
  prefix,
  multiline = false,
  rows = 3,
  value,
  onChange,
  placeholder,
  maxLength,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const Field = multiline ? 'textarea' : 'input';

  return (
    <label style={{ display: 'block', fontFamily: 'var(--font-body)' }}>
      {label && (
        <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xs)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bone-dim)', marginBottom: '8px' }}>
          {label}
        </span>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: multiline ? 'flex-start' : 'center',
          gap: '8px',
          background: 'var(--ink-2)',
          border: `1px solid ${error ? 'var(--ember)' : focus ? 'var(--line-3)' : 'var(--line-2)'}`,
          borderRadius: 'var(--radius-xs)',
          padding: multiline ? '12px 12px' : '0 12px',
          boxShadow: focus ? `var(--inset-well), 0 0 0 2px var(--ember-wash)` : 'var(--inset-well)',
          transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
        }}
      >
        {prefix && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--bone-faint)', paddingTop: multiline ? '2px' : 0 }}>{prefix}</span>
        )}
        <Field
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={multiline ? rows : undefined}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: multiline ? 'vertical' : 'none',
            color: 'var(--bone)',
            fontFamily: 'var(--font-body)',
            fontSize: 'var(--text-base)',
            lineHeight: 1.5,
            padding: multiline ? 0 : '11px 0',
          }}
          {...rest}
        />
        {maxLength != null && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--bone-ghost)', alignSelf: multiline ? 'flex-end' : 'center' }}>
            {(value ? String(value).length : 0)}/{maxLength}
          </span>
        )}
      </div>
      {(hint || error) && (
        <span style={{ display: 'block', marginTop: '6px', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.04em', color: error ? 'var(--ember)' : 'var(--bone-faint)' }}>
          {error || hint}
        </span>
      )}
    </label>
  );
}
