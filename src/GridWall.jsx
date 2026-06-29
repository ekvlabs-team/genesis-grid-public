import React, { useMemo, useRef } from 'react';

const DEFAULT_TOTAL_SUPPLY = 10000;

function tokenSet(values) {
  const ids = [];
  for (const value of Array.isArray(values) ? values : []) {
    if (value === null || value === undefined || value === '') continue;
    const id = Number(value);
    if (Number.isFinite(id)) ids.push(id);
  }
  return new Set(ids);
}

function traceMap(traces) {
  const byToken = new Map();
  for (const trace of Array.isArray(traces) ? traces : []) {
    const tokenId = Number(trace.tokenId);
    if (Number.isFinite(tokenId)) byToken.set(tokenId, trace.id);
  }
  return byToken;
}

function cellState(tokenId, sets) {
  if (sets.awakened.has(tokenId)) return 'awakened';
  if (sets.ash.has(tokenId)) return 'ash';
  if (sets.called.has(tokenId)) return 'called';
  return 'void';
}

export function GridWall({ grid, traces, onOpenTrace }) {
  const tipRef = useRef(null);
  const wrapRef = useRef(null);
  const traceByToken = useMemo(() => traceMap(traces), [traces]);
  const cells = useMemo(() => {
    const total = Math.max(1, Math.min(Number(grid?.totalSupply) || DEFAULT_TOTAL_SUPPLY, DEFAULT_TOTAL_SUPPLY));
    const sets = {
      called: tokenSet(grid?.called),
      awakened: tokenSet(grid?.awakened),
      ash: tokenSet(grid?.ash),
    };
    return Array.from({ length: total }, (_, i) => {
      const tokenId = i + 1;
      const state = cellState(tokenId, sets);
      const traceId = traceByToken.get(tokenId);
      return React.createElement('i', {
        key: tokenId,
        className: `gg-cell ${state}`,
        'data-id': tokenId,
        'data-state': state,
        'data-trace-id': traceId || '',
      });
    });
  }, [grid, traceByToken]);

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
    if (cell && cell.getAttribute('data-state') === 'awakened') {
      onOpenTrace && onOpenTrace(cell.getAttribute('data-trace-id') || undefined);
    }
  };

  return (
    <div className="gg-wall" ref={wrapRef}>
      <div
        className="gg-wall-grid"
        onMouseMove={onMove}
        onMouseLeave={() => { if (tipRef.current) tipRef.current.style.opacity = '0'; }}
        onClick={onClick}
      >
        {cells}
      </div>
      <span className="gg-wall-tip" ref={tipRef} />
    </div>
  );
}
