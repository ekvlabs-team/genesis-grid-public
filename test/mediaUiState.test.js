import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bindMediaStateToWallet,
  canSubmitWithMedia,
  mediaCreatingIntentState,
  mediaFailedState,
  mediaIntentAcceptedState,
  mediaSelectedState,
  mediaStatusTitle,
} from '../src/mediaUiState.js';

test('media UI state machine does not allow trace submission before stored media is uploaded', () => {
  assert.equal(canSubmitWithMedia(null), false);
  assert.equal(canSubmitWithMedia(mediaSelectedState()), false);
  assert.equal(canSubmitWithMedia(mediaCreatingIntentState()), false);
  assert.equal(canSubmitWithMedia(mediaIntentAcceptedState({
    mediaAssetId: 'media-1',
    storageBucket: 'media-quarantine',
    storagePath: '111/trace.webp',
  })), false);
  assert.equal(canSubmitWithMedia({ status: 'failed' }), false);
  assert.equal(canSubmitWithMedia({ status: 'rejected' }), false);
  assert.equal(canSubmitWithMedia({ status: 'uploaded' }), false);
  assert.equal(canSubmitWithMedia({ status: 'approved' }), false);
  assert.equal(
    canSubmitWithMedia(
      bindMediaStateToWallet({ status: 'uploaded' }, '0x1111111111111111111111111111111111111111'),
      '0x1111111111111111111111111111111111111111',
    ),
    true,
  );
  assert.equal(
    canSubmitWithMedia(
      bindMediaStateToWallet({ status: 'approved' }, '0x1111111111111111111111111111111111111111'),
      '0x2222222222222222222222222222222222222222',
    ),
    false,
  );
});

test('media UI copy describes session and quarantine honestly', () => {
  assert.match(mediaSelectedState().message, /wallet session/i);
  assert.match(mediaCreatingIntentState().message, /private quarantine intent/i);
  assert.match(mediaIntentAcceptedState({ status: 'quarantine' }).message, /no uploaded state is claimed/i);
  assert.equal(mediaFailedState(new Error('API rejected media')).message, 'API rejected media');
  assert.equal(mediaStatusTitle('intent_accepted'), 'Intent accepted');
  assert.equal(mediaStatusTitle('creating_intent'), 'creating intent');
});
