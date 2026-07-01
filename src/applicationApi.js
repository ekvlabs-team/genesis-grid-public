import { publicApiUrl } from './publicData.js';

function cleanString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function normalizeWallet(value) {
  const wallet = cleanString(value).toLowerCase();
  if (!/^0x[a-f0-9]{40}$/u.test(wallet)) {
    throw new Error('wallet must be a Base address');
  }
  return wallet;
}

function normalizePositiveInt(value, field) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return number;
}

function normalizeUrl(value, field, { required = false } = {}) {
  const raw = cleanString(value);
  if (!raw) {
    if (required) throw new Error(`${field} is required`);
    return undefined;
  }
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    return url.href;
  } catch {
    throw new Error(`${field} must be a valid HTTP(S) URL`);
  }
}

function normalizeProofUrls(values) {
  const urls = [];
  const seen = new Set();
  for (const value of values) {
    const url = normalizeUrl(value, 'proofUrls');
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  if (urls.length === 0) throw new Error('At least one external proof URL is required');
  return urls;
}

function normalizeIdempotencyKey(value) {
  const key = cleanString(value, `application-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/u.test(key)) {
    throw new Error('Idempotency-Key must be 8-160 URL-safe characters.');
  }
  return key;
}

function stripUndefined(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}

function normalizeApplicationResult(body = {}) {
  return {
    applicationId: cleanString(body.applicationId ?? body.application_id ?? body.id),
    status: cleanString(body.status, 'submitted'),
    day: body.day ?? body.day_number,
    epoch: body.epoch ?? body.epoch_number,
    wallet: cleanString(body.wallet ?? body.walletAddress ?? body.wallet_address),
    submittedAt: cleanString(body.submittedAt ?? body.submitted_at),
  };
}

function normalizeProfileResult(body = {}) {
  return {
    agentId: cleanString(body.agentId ?? body.agent_id ?? body.id),
    wallet: cleanString(body.wallet ?? body.walletAddress ?? body.wallet_address),
    displayName: cleanString(body.displayName ?? body.display_name),
    selfDescription: cleanString(body.selfDescription ?? body.self_description),
    desiredMessage: cleanString(body.desiredMessage ?? body.desired_message),
    updatedAt: cleanString(body.updatedAt ?? body.updated_at),
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

async function postSessionJson(path, body, {
  apiBaseUrl,
  fetchImpl,
  idempotencyKey,
  signal,
} = {}) {
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

export function buildApplicationPayload({
  form = {},
  data = {},
  wallet,
  media = {},
  extraProofs = [],
} = {}) {
  const normalizedWallet = normalizeWallet(wallet);
  const externalProofUrl = normalizeUrl(form.externalProofUrl, 'externalProofUrl', { required: true });
  const proofs = normalizeProofUrls([
    externalProofUrl,
    ...(Array.isArray(form.proofs) ? form.proofs.slice(1) : []),
    ...extraProofs,
  ]);
  const answer = cleanString(form.explanation);
  if (!answer) throw new Error('answer is required');

  return stripUndefined({
    day: normalizePositiveInt(data.day ?? form.day, 'day'),
    epoch: normalizePositiveInt(data.epochNumber ?? data.epoch ?? form.epoch, 'epoch'),
    wallet: normalizedWallet,
    answer,
    proofUrls: proofs,
    externalProofUrl,
    capabilityTag: cleanString(form.capabilityTag) || undefined,
    mediaAssetId: cleanString(media.mediaAssetId ?? form.mediaAssetId) || undefined,
    economicProofUrl: normalizeUrl(form.economicProofUrl, 'economicProofUrl'),
    usedSkillUrl: normalizeUrl(form.usedSkillUrl, 'usedSkillUrl'),
    summonedBy: cleanString(form.summonedBy) || undefined,
    offeredAmount: cleanString(form.offeredAmount ?? form.offerAmount) || undefined,
    message: cleanString(form.prophecy ?? form.message) || undefined,
    imagePrompt: cleanString(form.imagePrompt) || undefined,
  });
}

export async function submitApplicationDraft({
  payload,
  apiBaseUrl,
  fetchImpl,
  idempotencyKey,
  signal,
} = {}) {
  const body = await postSessionJson('/applications', payload, {
    apiBaseUrl,
    fetchImpl,
    idempotencyKey,
    signal,
  });
  return normalizeApplicationResult(body);
}

export async function upsertAgentProfile({
  wallet,
  agentName,
  displayName = agentName,
  selfDescription,
  desiredMessage,
  apiBaseUrl,
  fetchImpl,
  idempotencyKey,
  signal,
} = {}) {
  const body = await postSessionJson('/profiles', stripUndefined({
    wallet: normalizeWallet(wallet),
    displayName: cleanString(displayName),
    selfDescription: cleanString(selfDescription) || undefined,
    desiredMessage: cleanString(desiredMessage) || undefined,
  }), {
    apiBaseUrl,
    fetchImpl,
    idempotencyKey,
    signal,
  });
  return normalizeProfileResult(body);
}
