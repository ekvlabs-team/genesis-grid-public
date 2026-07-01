import { useState } from 'react';
import { Button } from './components/Button.jsx';

function GridGlyph({ size = 28 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} fill="none" style={{ color: 'var(--bone)', flexShrink: 0 }}>
      <rect x="3.5" y="3.5" width="41" height="41" stroke="currentColor" strokeWidth="2" />
      <g stroke="currentColor" strokeWidth="1.4" opacity="0.5">
        <line x1="3.5" y1="17.2" x2="44.5" y2="17.2" /><line x1="3.5" y1="30.8" x2="44.5" y2="30.8" />
        <line x1="17.2" y1="3.5" x2="17.2" y2="44.5" /><line x1="30.8" y1="3.5" x2="30.8" y2="44.5" />
      </g>
      <rect x="31.3" y="4" width="13" height="13" fill="var(--ember)" />
    </svg>
  );
}

function shortWallet(wallet) {
  if (!wallet) return '';
  return wallet.length > 12 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet;
}

export function TopBar({ route, onNav, onDonate, day, submissionsOpen, walletAddress = '', onConnectWallet = null }) {
  const [open, setOpen] = useState(false);
  const links = [
    { key: 'home', label: 'The Grid' },
    { key: 'pool', label: 'Day Pool' },
    { key: 'archive', label: 'Archive' },
    { key: 'submit', label: 'Face the Demon' },
  ];
  const go = (k) => { setOpen(false); onNav(k); };

  return (
    <header className="gg-topbar">
      <div className="gg-container gg-topbar-inner">
        <button className="gg-brand" onClick={() => go('home')}>
          <GridGlyph />
          <span className="gg-brand-name">Genesis&nbsp;Grid</span>
        </button>

        <nav className="gg-nav">
          {links.map(l => (
            <button key={l.key} className={'gg-nav-link' + (route === l.key ? ' active' : '')} onClick={() => go(l.key)}>{l.label}</button>
          ))}
        </nav>

        <div className="gg-topbar-right">
          <span className="gg-day-pill">Day&nbsp;{String(day).padStart(2, '0')} <span className="dim">/ 100</span></span>
          <span className="gg-topbar-divider" />
          <span className="gg-wallet-desktop">
            <Button variant="secondary" size="sm" onClick={onDonate}>Donate</Button>
          </span>
          <span className="gg-wallet-desktop">
            <Button variant="secondary" size="sm" onClick={onConnectWallet || undefined} disabled={!submissionsOpen || !onConnectWallet} title={submissionsOpen ? 'Connect wallet with SIWE.' : 'Wallet connection opens with the Gate.'}>
              {walletAddress ? shortWallet(walletAddress) : 'Wallet soon'}
            </Button>
          </span>
          <button className="gg-burger" aria-label="Menu" onClick={() => setOpen(!open)}>{open ? '×' : '≡'}</button>
        </div>
      </div>

      <div className={'gg-mobile-menu' + (open ? ' open' : '')}>
        {links.map(l => (
          <button key={l.key} className={'gg-nav-link' + (route === l.key ? ' active' : '')} onClick={() => go(l.key)}>{l.label}</button>
        ))}
        <span className="gg-day-pill">Day&nbsp;{String(day).padStart(2, '0')} / 100</span>
        <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Button variant="secondary" size="sm" full onClick={() => { setOpen(false); onDonate(); }}>Donate / Support</Button>
          <Button variant="secondary" size="sm" full onClick={onConnectWallet || undefined} disabled={!submissionsOpen || !onConnectWallet} title={submissionsOpen ? 'Connect wallet with SIWE.' : 'Wallet connection opens with the Gate.'}>
            {walletAddress ? shortWallet(walletAddress) : 'Wallet soon'}
          </Button>
        </div>
      </div>
    </header>
  );
}
