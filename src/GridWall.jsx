import React, { useRef } from 'react';

// Prelaunch: all 10,000 cells are sleeping (void state). No PRNG fake activity.
const GG_CELL_NODES = Array.from({ length: 10000 }, (_, i) =>
  React.createElement('i', {
    key: i,
    className: 'gg-cell void',
    'data-id': i + 1,
    'data-state': 'void',
  })
);

export function GridWall({ onOpenTrace }) {
  const tipRef = useRef(null);
  const wrapRef = useRef(null);

  const onMove = (e) => {
    const cell = e.target.closest('.gg-cell');
    const tip = tipRef.current, wrap = wrapRef.current;
    if (!tip || !wrap) return;
    if (!cell) { tip.style.opacity = '0'; return; }
    const id = cell.getAttribute('data-id');
    const state = cell.getAttribute('data-state');
    const label = state === 'void' ? 'sleeping' : state;
    tip.textContent = `#${String(id).padStart(4, '0')} · ${label}`;
    const rect = wrap.getBoundingClientRect();
    let x = e.clientX - rect.left + 12;
    let y = e.clientY - rect.top + 12;
    tip.style.opacity = '1';
    tip.style.left = Math.min(x, rect.width - tip.offsetWidth - 6) + 'px';
    tip.style.top = y + 'px';
  };

  const onClick = (e) => {
    const cell = e.target.closest('.gg-cell');
    if (cell && cell.getAttribute('data-state') === 'awakened') onOpenTrace && onOpenTrace();
  };

  return (
    <div className="gg-wall" ref={wrapRef}>
      <div
        className="gg-wall-grid"
        onMouseMove={onMove}
        onMouseLeave={() => { if (tipRef.current) tipRef.current.style.opacity = '0'; }}
        onClick={onClick}
      >
        {GG_CELL_NODES}
      </div>
      <span className="gg-wall-tip" ref={tipRef} />
    </div>
  );
}
