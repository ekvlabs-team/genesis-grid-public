import { publicApiUrl } from './publicData.js';

export const MEDIA_MIME_TYPE = 'image/webp';
export const MEDIA_MAX_BYTES = 100 * 1024;
export const MEDIA_REQUIRED_WIDTH = 768;
export const MEDIA_REQUIRED_HEIGHT = 768;

function cleanString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function safeHttpsUrl(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

function apiError(code, message) {
  return { ok: false, code, message };
}

function assertOk(result) {
  if (result.ok) return;
  const error = new Error(result.message);
  error.code = result.code;
  throw error;
}

function mediaSize(file) {
  return Number(file?.size ?? file?.byteSize ?? file?.byte_size ?? 0);
}

function mediaType(file, fallback = '') {
  return cleanString(file?.type ?? file?.mimeType ?? file?.mime_type, fallback);
}

function normalizeWallet(wallet) {
  const value = cleanString(wallet).toLowerCase();
  if (!/^0x[a-f0-9]{40}$/u.test(value)) {
    throw new Error('wallet must be a Base address');
  }
  return value;
}

function normalizePositiveInt(value, name) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return number;
}

function normalizeIdempotencyKey(value) {
  const key = cleanString(value, `media-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/u.test(key)) {
    throw new Error('Idempotency-Key must be 8-160 URL-safe characters.');
  }
  return key;
}

function completeIdempotencyKey(key) {
  if (key.length <= 151) return `${key}-complete`;
  return `${key.slice(0, 142)}-${key.slice(-8)}-complete`;
}

export function normalizeMediaFileName(value = 'relic.webp') {
  const base = cleanString(value, 'relic.webp')
    .replace(/[/\\]+/gu, '-')
    .replace(/[^A-Za-z0-9._-]+/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^[.-]+|[.-]+$/gu, '')
    .slice(0, 96);
  const withName = base || 'relic';
  return /\.webp$/iu.test(withName) ? withName : `${withName}.webp`;
}

export function validateRelicImageMeta({
  mimeType,
  byteSize,
  width,
  height,
  maxBytes = MEDIA_MAX_BYTES,
  requiredWidth = MEDIA_REQUIRED_WIDTH,
  requiredHeight = MEDIA_REQUIRED_HEIGHT,
}) {
  if (mimeType !== MEDIA_MIME_TYPE) {
    return apiError('invalid_media_type', 'Only image/webp media is accepted.');
  }
  if (!Number.isInteger(byteSize) || byteSize < 1) {
    return apiError('invalid_media_size', 'Image size is required.');
  }
  if (byteSize > maxBytes) {
    return apiError('media_too_large', 'Image must be 100 KB or smaller.');
  }
  if (width !== requiredWidth || height !== requiredHeight) {
    return apiError('invalid_dimensions', `Image must be exactly ${requiredWidth}x${requiredHeight}.`);
  }
  return { ok: true };
}

async function sha256Hex(file) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Web Crypto digest is unavailable.');
  }
  if (typeof file?.arrayBuffer !== 'function') {
    throw new Error('media file must expose arrayBuffer()');
  }
  const bytes = await file.arrayBuffer();
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function buildMediaUploadIntentPayload({
  wallet,
  file,
  fileName = file?.name,
  width,
  height,
}) {
  const mimeType = mediaType(file, MEDIA_MIME_TYPE);
  const byteSize = mediaSize(file);
  const cleanWidth = normalizePositiveInt(width, 'width');
  const cleanHeight = normalizePositiveInt(height, 'height');

  assertOk(validateRelicImageMeta({
    mimeType,
    byteSize,
    width: cleanWidth,
    height: cleanHeight,
  }));

  return {
    wallet: normalizeWallet(wallet),
    fileName: normalizeMediaFileName(fileName),
    mimeType,
    byteSize,
    width: cleanWidth,
    height: cleanHeight,
    checksum: await sha256Hex(file),
  };
}

async function parseJsonResponse(response, route) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const code = cleanString(body?.error?.code ?? body?.code, 'api_error');
    const message = cleanString(body?.error?.message ?? body?.message, `${route} failed with ${response.status}`);
    const error = new Error(message);
    error.code = code;
    error.status = response.status;
    throw error;
  }
  return body ?? {};
}

async function postMediaJson(path, body, {
  apiBaseUrl,
  fetchImpl,
  idempotencyKey,
  signal,
}) {
  const fetcher = fetchImpl ?? globalThis.fetch;
  if (typeof fetcher !== 'function') throw new Error('fetch is unavailable');
  const response = await fetcher(publicApiUrl(path, apiBaseUrl), {
    method: 'POST',
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'idempotency-key': normalizeIdempotencyKey(idempotencyKey),
    },
    body: JSON.stringify(body),
    signal,
  });
  return parseJsonResponse(response, path);
}

export function normalizeMediaUploadResult(body = {}) {
  const status = cleanString(body.status, 'unknown');
  const storageBucket = cleanString(body.storageBucket ?? body.storage_bucket);
  const publicUrl = storageBucket === 'media-approved'
    ? safeHttpsUrl(body.publicUrl ?? body.public_url ?? body.url)
    : '';

  let message = 'Media state is pending.';
  if (status === 'quarantine') message = 'Media intent accepted for private quarantine.';
  if (status === 'uploaded') message = 'Media uploaded to private quarantine. Operator review pending.';
  if (status === 'approved') message = 'Media approved for public display.';
  if (status === 'rejected') message = cleanString(body.rejectionReason ?? body.rejection_reason, 'Media rejected by operator.');

  return {
    status,
    mediaAssetId: cleanString(body.mediaAssetId ?? body.media_asset_id ?? body.id),
    storageBucket,
    storagePath: cleanString(body.storagePath ?? body.storage_path),
    publicUrl,
    uploadUrl: safeHttpsUrl(body.uploadUrl ?? body.upload_url),
    uploadMethod: cleanString(body.uploadMethod ?? body.upload_method, 'PUT').toUpperCase(),
    canComplete: false,
    message,
  };
}

export async function createMediaUploadIntent({
  wallet,
  file,
  fileName,
  width,
  height,
  apiBaseUrl,
  fetchImpl,
  idempotencyKey,
  signal,
}) {
  const payload = await buildMediaUploadIntentPayload({ wallet, file, fileName, width, height });
  const body = await postMediaJson('/media/upload-intent', payload, {
    apiBaseUrl,
    fetchImpl,
    idempotencyKey,
    signal,
  });
  return normalizeMediaUploadResult(body);
}

export async function completeMediaUpload({
  mediaAssetId,
  storagePath,
  apiBaseUrl,
  fetchImpl,
  idempotencyKey,
  signal,
}) {
  const body = await postMediaJson('/media/complete', {
    mediaAssetId,
    storagePath,
  }, {
    apiBaseUrl,
    fetchImpl,
    idempotencyKey,
    signal,
  });
  return normalizeMediaUploadResult(body);
}

async function uploadToSignedTarget({ uploadUrl, uploadMethod, file, fetchImpl, signal }) {
  const fetcher = fetchImpl ?? globalThis.fetch;
  if (typeof fetcher !== 'function') throw new Error('fetch is unavailable');
  const target = safeHttpsUrl(uploadUrl);
  if (!target) throw new Error('Signed upload target must be HTTPS.');
  const response = await fetcher(target, {
    method: cleanString(uploadMethod, 'PUT').toUpperCase(),
    credentials: 'omit',
    headers: {
      'content-type': MEDIA_MIME_TYPE,
    },
    body: file,
    signal,
  });
  if (!response.ok) {
    throw new Error(`signed media upload failed with ${response.status}`);
  }
}

export async function uploadRelicMediaDraft({
  wallet,
  file,
  fileName,
  width,
  height,
  apiBaseUrl,
  fetchImpl,
  idempotencyKey,
  signal,
}) {
  const key = normalizeIdempotencyKey(idempotencyKey);
  const intent = await createMediaUploadIntent({
    wallet,
    file,
    fileName,
    width,
    height,
    apiBaseUrl,
    fetchImpl,
    idempotencyKey: key,
    signal,
  });

  if (!intent.uploadUrl) {
    return {
      ...intent,
      status: 'intent_accepted',
      canComplete: false,
      message: 'Secure quarantine upload target is not available yet.',
    };
  }

  await uploadToSignedTarget({
    uploadUrl: intent.uploadUrl,
    uploadMethod: intent.uploadMethod,
    file,
    fetchImpl,
    signal,
  });

  return completeMediaUpload({
    mediaAssetId: intent.mediaAssetId,
    storagePath: intent.storagePath,
    apiBaseUrl,
    fetchImpl,
    idempotencyKey: completeIdempotencyKey(key),
    signal,
  });
}
