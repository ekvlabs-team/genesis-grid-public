import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MEDIA_MAX_BYTES,
  MEDIA_MIME_TYPE,
  MEDIA_REQUIRED_HEIGHT,
  MEDIA_REQUIRED_WIDTH,
  buildMediaUploadIntentPayload,
  normalizeMediaUploadResult,
  uploadRelicMediaDraft,
  validateRelicImageMeta,
} from '../src/mediaUpload.js';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

function webpBlob(size = 48) {
  return new Blob([new Uint8Array(size).fill(7)], { type: MEDIA_MIME_TYPE });
}

test('relic media client rules match the MVP backend contract', () => {
  assert.equal(MEDIA_MIME_TYPE, 'image/webp');
  assert.equal(MEDIA_MAX_BYTES, 100 * 1024);
  assert.equal(MEDIA_REQUIRED_WIDTH, 768);
  assert.equal(MEDIA_REQUIRED_HEIGHT, 768);

  assert.deepEqual(validateRelicImageMeta({
    mimeType: 'image/webp',
    byteSize: 100 * 1024,
    width: 768,
    height: 768,
  }), { ok: true });
});

test('relic media client rejects non-WebP, oversized or non-768 media before intent', () => {
  assert.equal(validateRelicImageMeta({
    mimeType: 'image/png',
    byteSize: 42,
    width: 768,
    height: 768,
  }).code, 'invalid_media_type');

  assert.equal(validateRelicImageMeta({
    mimeType: 'image/webp',
    byteSize: 100 * 1024 + 1,
    width: 768,
    height: 768,
  }).code, 'media_too_large');

  assert.equal(validateRelicImageMeta({
    mimeType: 'image/webp',
    byteSize: 42,
    width: 512,
    height: 512,
  }).code, 'invalid_dimensions');
});

test('media upload intent payload is strict and wallet-bound', async () => {
  const file = webpBlob();
  const payload = await buildMediaUploadIntentPayload({
    wallet: '0x1111111111111111111111111111111111111111',
    file,
    fileName: 'trace/relic image.webp',
    width: 768,
    height: 768,
  });

  assert.equal(payload.wallet, '0x1111111111111111111111111111111111111111');
  assert.equal(payload.fileName, 'trace-relic-image.webp');
  assert.equal(payload.mimeType, 'image/webp');
  assert.equal(payload.byteSize, file.size);
  assert.equal(payload.width, 768);
  assert.equal(payload.height, 768);
  assert.match(payload.checksum, /^[a-f0-9]{64}$/u);
});

test('uploadRelicMediaDraft creates intent with session credentials and idempotency', async () => {
  const calls = [];
  const result = await uploadRelicMediaDraft({
    wallet: '0x1111111111111111111111111111111111111111',
    file: webpBlob(),
    fileName: 'trace.webp',
    width: 768,
    height: 768,
    idempotencyKey: 'media-ui-test-key',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init, body: JSON.parse(init.body) });
      return jsonResponse({
        media_asset_id: 'media-1',
        storage_bucket: 'media-quarantine',
        storage_path: '111/trace.webp',
        status: 'quarantine',
      }, { status: 201 });
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.genesisgrid.xyz/media/upload-intent');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'include');
  assert.equal(calls[0].init.headers.accept, 'application/json');
  assert.equal(calls[0].init.headers['content-type'], 'application/json');
  assert.equal(calls[0].init.headers['idempotency-key'], 'media-ui-test-key');
  assert.equal(calls[0].body.wallet, '0x1111111111111111111111111111111111111111');
  assert.equal(result.status, 'intent_accepted');
  assert.equal(result.mediaAssetId, 'media-1');
  assert.equal(result.storageBucket, 'media-quarantine');
  assert.equal(result.storagePath, '111/trace.webp');
});

test('media write idempotency key mirrors backend URL-safe shape', async () => {
  await assert.rejects(
    uploadRelicMediaDraft({
      wallet: '0x1111111111111111111111111111111111111111',
      file: webpBlob(),
      fileName: 'trace.webp',
      width: 768,
      height: 768,
      idempotencyKey: '.bad-key',
      fetchImpl: async () => {
        throw new Error('fetch should not run for invalid idempotency key');
      },
    }),
    /Idempotency-Key must be 8-160 URL-safe characters/,
  );
});

test('uploadRelicMediaDraft does not fake uploaded state without a signed upload target', async () => {
  const calls = [];
  const result = await uploadRelicMediaDraft({
    wallet: '0x1111111111111111111111111111111111111111',
    file: webpBlob(),
    fileName: 'trace.webp',
    width: 768,
    height: 768,
    idempotencyKey: 'media-ui-no-target',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return jsonResponse({
        media_asset_id: 'media-1',
        storage_bucket: 'media-quarantine',
        storage_path: '111/trace.webp',
        status: 'quarantine',
      }, { status: 201 });
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(result.status, 'intent_accepted');
  assert.equal(result.canComplete, false);
  assert.equal(result.message, 'Secure quarantine upload target is not available yet.');
});

test('uploadRelicMediaDraft completes only after a signed upload target succeeds', async () => {
  const calls = [];
  const result = await uploadRelicMediaDraft({
    wallet: '0x1111111111111111111111111111111111111111',
    file: webpBlob(),
    fileName: 'trace.webp',
    width: 768,
    height: 768,
    idempotencyKey: 'media-ui-complete',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/media/upload-intent')) {
        return jsonResponse({
          media_asset_id: 'media-1',
          storage_bucket: 'media-quarantine',
          storage_path: '111/trace.webp',
          status: 'quarantine',
          upload_url: 'https://upload.genesisgrid.test/quarantine/111/trace.webp',
          upload_method: 'PUT',
        }, { status: 201 });
      }
      if (String(url).startsWith('https://upload.genesisgrid.test/')) {
        return new Response('', { status: 200 });
      }
      if (String(url).endsWith('/media/complete')) {
        return jsonResponse({
          media_asset_id: 'media-1',
          storage_bucket: 'media-quarantine',
          storage_path: '111/trace.webp',
          status: 'uploaded',
        }, { status: 201 });
      }
      return new Response('not found', { status: 404 });
    },
  });

  assert.deepEqual(calls.map((call) => call.init.method), ['POST', 'PUT', 'POST']);
  assert.equal(calls[1].init.credentials, 'omit');
  assert.equal(calls[1].init.headers['content-type'], 'image/webp');
  assert.equal(calls[2].init.credentials, 'include');
  assert.equal(calls[2].init.headers['idempotency-key'], 'media-ui-complete-complete');
  assert.equal(result.status, 'uploaded');
  assert.equal(result.mediaAssetId, 'media-1');
});

test('uploadRelicMediaDraft keeps complete idempotency key within backend limits', async () => {
  const longKey = `A${'b'.repeat(159)}`;
  const calls = [];

  await uploadRelicMediaDraft({
    wallet: '0x1111111111111111111111111111111111111111',
    file: webpBlob(),
    fileName: 'trace.webp',
    width: 768,
    height: 768,
    idempotencyKey: longKey,
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      if (String(url).endsWith('/media/upload-intent')) {
        return jsonResponse({
          media_asset_id: 'media-1',
          storage_bucket: 'media-quarantine',
          storage_path: '111/trace.webp',
          status: 'quarantine',
          upload_url: 'https://upload.genesisgrid.test/quarantine/111/trace.webp',
        }, { status: 201 });
      }
      if (String(url).startsWith('https://upload.genesisgrid.test/')) {
        return new Response('', { status: 200 });
      }
      return jsonResponse({
        media_asset_id: 'media-1',
        storage_bucket: 'media-quarantine',
        storage_path: '111/trace.webp',
        status: 'uploaded',
      }, { status: 201 });
    },
  });

  const completeKey = calls[2].init.headers['idempotency-key'];
  assert.match(completeKey, /^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/u);
  assert.ok(completeKey.endsWith('-complete'));
  assert.ok(completeKey.length <= 160);
});

test('normalizeMediaUploadResult exposes only safe public media states', () => {
  assert.deepEqual(normalizeMediaUploadResult({
    media_asset_id: 'media-1',
    storage_bucket: 'media-approved',
    storage_path: '111/trace.webp',
    public_url: 'https://project.supabase.co/storage/v1/object/public/media-approved/111/trace.webp',
    status: 'approved',
  }), {
    status: 'approved',
    mediaAssetId: 'media-1',
    storageBucket: 'media-approved',
    storagePath: '111/trace.webp',
    publicUrl: 'https://project.supabase.co/storage/v1/object/public/media-approved/111/trace.webp',
    uploadUrl: '',
    uploadMethod: 'PUT',
    canComplete: false,
    message: 'Media approved for public display.',
  });

  assert.equal(normalizeMediaUploadResult({
    media_asset_id: 'media-2',
    storage_bucket: 'media-quarantine',
    storage_path: '111/private.webp',
    public_url: 'https://project.supabase.co/storage/v1/object/public/media-quarantine/111/private.webp',
    status: 'uploaded',
  }).publicUrl, '');

  assert.equal(normalizeMediaUploadResult({
    media_asset_id: 'media-3',
    status: 'rejected',
    rejection_reason: 'Bad media',
  }).message, 'Bad media');
});
