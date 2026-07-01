import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('App wires public route loaders, wallet auth and application submit without enabling launch', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const topbar = readFileSync(new URL('../src/TopBar.jsx', import.meta.url), 'utf8');
  const submit = readFileSync(new URL('../src/SubmitView.jsx', import.meta.url), 'utf8');

  assert.match(app, /parsePublicRoute/u, 'App should parse direct public routes');
  assert.match(app, /loadPublicRouteData/u, 'App should load day/token/profile/trial records through the public API/static client');
  assert.match(app, /connectWalletSession/u, 'App should wire wallet auth to the backend SIWE flow');
  assert.match(app, /submitApplicationDraft/u, 'App should submit Trial Card payloads through the backend API');
  assert.match(app, /ALLOW_LIVE_DAY_STATE = false/u, 'App must keep the launch read switch off in this PR');
  assert.match(app, /PublicNotFoundView/u, 'App should render a route-safe empty state for unknown paths');
  assert.match(topbar, /walletAddress/u, 'TopBar should render real wallet session state when provided');
  assert.match(topbar, /onConnectWallet/u, 'TopBar should call the wallet connector instead of faking a wallet');
  assert.match(submit, /await onSubmit/u, 'SubmitView should await API submission failures instead of assuming success');
  assert.doesNotMatch(app + topbar + submit, /localStorage|sessionStorage/u);
  assert.doesNotMatch(app + topbar + submit, /Safe|NFT|payment|Oracle decision/iu);
});
