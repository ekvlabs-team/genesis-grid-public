import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('SubmitView wires relic upload UI to the media runtime helper without opening prelaunch', () => {
  const source = readFileSync(new URL('../src/SubmitView.jsx', import.meta.url), 'utf8');
  const stateSource = readFileSync(new URL('../src/mediaUiState.js', import.meta.url), 'utf8');
  const combined = `${source}\n${stateSource}`;

  assert.match(source, /uploadRelicMediaDraft/, 'SubmitView should call the browser-safe media helper');
  assert.match(source, /validateRelicImageMeta/, 'SubmitView should share backend media validation constants');
  assert.match(combined, /intent_accepted/, 'SubmitView should expose honest intent-created state');
  assert.match(combined, /Secure quarantine upload target is not available yet/, 'SubmitView should not fake uploaded state');
  assert.match(source, /exactly.*MEDIA_REQUIRED_WIDTH.*MEDIA_REQUIRED_HEIGHT/is, 'SubmitView should require exact media dimensions from the shared contract');
  assert.match(source, /onConnectWallet/, 'SubmitView should not fake a wallet connector without a handler');
  assert.match(source, /Wallet session required/, 'SubmitView should describe the SIWE session requirement without overclaiming inline signing');
  assert.match(source, /currentWalletRef/, 'SubmitView should guard async media completion against wallet changes');
  assert.match(source, /currentMediaAttemptRef/, 'SubmitView should guard async media completion against stale upload attempts');
  assert.match(source, /currentWalletRef\.current === uploadWallet && currentMediaAttemptRef\.current === uploadAttemptKey/, 'SubmitView should guard async media failures against stale upload attempts');
  assert.match(source, /bindMediaStateToWallet/, 'SubmitView should bind uploaded media state to the creating wallet');
  assert.match(source, /canSubmitWithMedia\(media, wallet\)/, 'SubmitView should not reuse uploaded media across wallet sessions');
  assert.doesNotMatch(combined, /recommended/i, 'media dimensions must not be presented as optional');
  assert.doesNotMatch(combined, /API upload starts only after wallet signature/i, 'media UI must not claim it signs bytes directly');
  assert.doesNotMatch(combined, /localStorage|sessionStorage/i, 'upload UI must not store session or media state in browser storage');
});
