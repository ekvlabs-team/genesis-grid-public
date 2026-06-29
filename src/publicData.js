import { GG_DATA } from './data.js';

export const DEFAULT_API_BASE_URL = 'https://api.genesisgrid.xyz';
export const STATIC_CURRENT_DAY_PATH = '/data/current-day.json';

const CLOSED_PHASE = 'prelaunch';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

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

function safeImageUrl(value) {
  const raw = cleanString(value);
  if (!raw) return '';
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return safeHttpsUrl(raw);
}

function safeTxHash(value) {
  const raw = cleanString(value);
  return /^0x[a-f0-9]{64}$/iu.test(raw) ? raw : '';
}

function cleanInt(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function cleanArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueTokenIds(value) {
  const ids = [];
  const seen = new Set();
  for (const entry of cleanArray(value)) {
    const id = cleanInt(entry, -1);
    if (id < 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function normalizeCounters(counters = {}, fallback = {}) {
  const source = isObject(counters) ? counters : {};
  return {
    called: cleanInt(source.called ?? source.calledToday, fallback.called ?? 0),
    awakened: cleanInt(source.awakened ?? source.awakenedToday, fallback.awakened ?? 0),
    ash: cleanInt(source.ash ?? source.ashToday, fallback.ash ?? 0),
    supplyCap: cleanInt(source.supplyCap, fallback.supplyCap ?? 3333),
    born: cleanInt(source.born ?? source.totalSupply, fallback.born ?? 10000),
  };
}

function normalizeTrace(trace, fallbackDay, fallbackEpoch) {
  if (!isObject(trace)) return null;
  const id = cleanString(trace.id ?? trace.applicationId ?? trace.application_id ?? trace.traceId);
  if (!id) return null;
  const proofUrls = cleanArray(trace.proofs ?? trace.proofUrls ?? trace.proof_urls)
    .map((url) => safeHttpsUrl(url))
    .filter(Boolean);
  const proofUrl = safeHttpsUrl(trace.proofUrl ?? trace.externalProofUrl ?? trace.external_proof_url);
  if (proofUrl && !proofUrls.includes(proofUrl)) proofUrls.unshift(proofUrl);

  return {
    id,
    applicationId: cleanString(trace.applicationId ?? trace.application_id, id),
    agentName: cleanString(trace.agentName ?? trace.displayName ?? trace.display_name, 'Agent'),
    runtime: cleanString(trace.runtime, 'unknown'),
    wallet: cleanString(trace.wallet ?? trace.walletAddress ?? trace.wallet_address),
    status: cleanString(trace.status, 'Submitted'),
    prophecy: cleanString(trace.prophecy ?? trace.message ?? trace.answer),
    proofType: cleanString(trace.proofType ?? trace.proof_type, 'external trace'),
    proofCount: Math.max(1, cleanInt(trace.proofCount ?? proofUrls.length, proofUrls.length || 1)),
    proofUrl: proofUrls[0],
    proofs: proofUrls,
    day: cleanInt(trace.day ?? trace.dayNumber ?? trace.day_number, fallbackDay),
    epoch: cleanString(trace.epoch ?? trace.epochNumber ?? trace.epoch_number, fallbackEpoch),
    imageSrc: safeImageUrl(trace.imageSrc ?? trace.imageUrl ?? trace.image_url),
    tokenId: trace.tokenId ?? trace.token_id,
    offerAmount: trace.offerAmount ?? trace.offer_amount ?? null,
    capability: cleanString(trace.capability ?? trace.capabilityTag ?? trace.capability_tag),
    verdict: cleanString(trace.verdict ?? trace.oracleVerdict ?? trace.oracle_verdict),
    txHash: safeTxHash(trace.txHash ?? trace.tx_hash),
    arweaveUrl: safeHttpsUrl(trace.arweaveUrl ?? trace.arweave_url ?? trace.metadataUrl ?? trace.metadata_url),
  };
}

function normalizeArchiveEntry(entry) {
  if (!isObject(entry)) return null;
  const day = cleanInt(entry.day ?? entry.dayNumber ?? entry.day_number, -1);
  if (day < 0) return null;
  return {
    day,
    epoch: cleanString(entry.epoch ?? entry.epochNumber ?? entry.epoch_number),
    law: cleanString(entry.law),
    status: cleanString(entry.status, 'sealed'),
    calledTokenIds: uniqueTokenIds(entry.calledTokenIds ?? entry.called_token_ids),
    awakened: cleanInt(entry.awakened ?? entry.awakenedToday ?? entry.awakened_today, 0),
    ash: cleanInt(entry.ash ?? entry.ashToday ?? entry.ash_today, 0),
    sealedAt: cleanString(entry.sealedAt ?? entry.sealed_at),
  };
}

function normalizeGridSnapshot(snapshot = {}, fallback = {}) {
  const source = isObject(snapshot) ? snapshot : {};
  return {
    day: cleanInt(source.day ?? source.dayNumber ?? source.day_number, fallback.day ?? 0),
    totalSupply: cleanInt(source.totalSupply ?? source.total_supply, fallback.totalSupply ?? 10000),
    called: uniqueTokenIds(source.called ?? source.calledTokenIds ?? source.called_token_ids),
    awakened: uniqueTokenIds(source.awakened ?? source.awakenedTokenIds ?? source.awakened_token_ids),
    ash: uniqueTokenIds(source.ash ?? source.ashTokenIds ?? source.ash_token_ids),
  };
}

function withClosedDefaults(data) {
  return {
    ...GG_DATA,
    ...data,
    phase: data.phase ?? CLOSED_PHASE,
    submissionsOpen: false,
    traces: cleanArray(data.traces),
    archive: cleanArray(data.archive),
    grid: normalizeGridSnapshot(data.grid),
  };
}

function isLiveAttempt(payload) {
  if (!isObject(payload)) return false;
  const phase = cleanString(payload.phase, CLOSED_PHASE);
  return phase !== CLOSED_PHASE || cleanInt(payload.day, 0) > 0 || payload.submissionsOpen === true;
}

export function normalizeCurrentDay(payload, fallback = GG_DATA, options = {}) {
  if (!isObject(payload)) return withClosedDefaults(fallback);

  if (!options.allowLiveDayState && isLiveAttempt(payload)) {
    if (cleanString(payload.phase, CLOSED_PHASE) === CLOSED_PHASE) {
      const prelaunchData = normalizeCurrentDay({ ...payload, submissionsOpen: false }, fallback, {
        ...options,
        allowLiveDayState: true,
      });
      return { ...prelaunchData, phase: CLOSED_PHASE, submissionsOpen: false };
    }
    return withClosedDefaults(fallback);
  }

  const phase = cleanString(payload.phase, fallback.phase ?? CLOSED_PHASE);
  const day = cleanInt(payload.day ?? payload.dayNumber ?? payload.day_number, fallback.day ?? 0);
  const epoch = cleanString(payload.epoch ?? payload.epochNumber ?? payload.epoch_number, fallback.epoch ?? '0');
  const canRenderPublicRecords = phase !== CLOSED_PHASE && options.allowLiveDayState === true;
  const traces = canRenderPublicRecords
    ? cleanArray(payload.traces)
        .map((trace) => normalizeTrace(trace, day, epoch))
        .filter(Boolean)
    : [];
  const archive = canRenderPublicRecords
    ? cleanArray(payload.archive)
        .map(normalizeArchiveEntry)
        .filter(Boolean)
    : [];

  return {
    ...fallback,
    phase,
    day,
    epoch,
    epochName: cleanString(payload.epochName ?? payload.epoch_name, fallback.epochName),
    law: cleanString(payload.law, fallback.law),
    counters: normalizeCounters(payload.counters, fallback.counters),
    traces,
    archive,
    submissionsOpen: phase !== CLOSED_PHASE && options.allowLiveDayState === true && payload.submissionsOpen === true,
    grid: normalizeGridSnapshot(payload.grid ?? fallback.grid),
  };
}

export function mergeGridSnapshot(data, snapshot, options = {}) {
  const current = withClosedDefaults(data);
  const grid = normalizeGridSnapshot(snapshot, current.grid);
  const liveGridAllowed = options.allowLiveGridState === true || current.phase !== CLOSED_PHASE;
  const visibleGrid = liveGridAllowed
    ? grid
    : { ...grid, called: [], awakened: [], ash: [] };

  return {
    ...current,
    grid: visibleGrid,
    counters: liveGridAllowed
      ? {
          ...current.counters,
          called: visibleGrid.called.length,
          awakened: visibleGrid.awakened.length,
          ash: visibleGrid.ash.length,
          born: visibleGrid.totalSupply || current.counters.born,
        }
      : current.counters,
    submissionsOpen: current.submissionsOpen === true && current.phase !== CLOSED_PHASE,
  };
}

function isAllowedApiOrigin(url) {
  return url.origin === DEFAULT_API_BASE_URL;
}

export function resolveApiBase(env = {}) {
  const raw = cleanString(env.VITE_GENESIS_GRID_API_BASE_URL, DEFAULT_API_BASE_URL);
  try {
    const url = new URL(raw);
    if (isAllowedApiOrigin(url)) return url.origin;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
  return DEFAULT_API_BASE_URL;
}

async function fetchJson(url, fetchImpl, options = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
  const response = await fetchImpl(url, {
    method: 'GET',
    credentials: 'omit',
    headers: { accept: 'application/json' },
    signal: options.signal,
  });
  if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`);
  return response.json();
}

export function publicApiUrl(path, apiBaseUrl = DEFAULT_API_BASE_URL) {
  const apiUrl = resolveApiBase({ VITE_GENESIS_GRID_API_BASE_URL: apiBaseUrl });
  const cleanPath = `/${cleanString(path).replace(/^\/+/u, '')}`;
  return `${apiUrl}${cleanPath}`;
}

export function fetchPublicConfig(options = {}) {
  return fetchJson(publicApiUrl('/config', options.apiBaseUrl), options.fetchImpl ?? globalThis.fetch, options);
}

export function fetchGridSnapshot(options = {}) {
  return fetchJson(publicApiUrl('/grid', options.apiBaseUrl), options.fetchImpl ?? globalThis.fetch, options);
}

export function fetchDayArchive(day, options = {}) {
  const dayNumber = cleanInt(day, -1);
  if (dayNumber < 1) throw new Error('day must be a positive integer');
  return fetchJson(publicApiUrl(`/days/${dayNumber}`, options.apiBaseUrl), options.fetchImpl ?? globalThis.fetch, options);
}

export function fetchTokenRecord(tokenId, options = {}) {
  const id = cleanInt(tokenId, -1);
  if (id < 0) throw new Error('tokenId must be a non-negative integer');
  return fetchJson(publicApiUrl(`/tokens/${id}`, options.apiBaseUrl), options.fetchImpl ?? globalThis.fetch, options);
}

export function fetchProfileRecord(wallet, options = {}) {
  const value = cleanString(wallet);
  if (!/^0x[a-f0-9]{40}$/iu.test(value)) throw new Error('wallet must be a Base address');
  return fetchJson(publicApiUrl(`/profiles/${value.toLowerCase()}`, options.apiBaseUrl), options.fetchImpl ?? globalThis.fetch, options);
}

export async function loadPublicData({
  fetchImpl = globalThis.fetch,
  apiBaseUrl = DEFAULT_API_BASE_URL,
  staticCurrentDayUrl = STATIC_CURRENT_DAY_PATH,
  allowLiveDayState = false,
  signal,
} = {}) {
  const status = {
    source: 'embedded',
    apiBaseUrl,
    apiConnected: false,
    errors: [],
  };
  let data = withClosedDefaults(GG_DATA);

  try {
    const staticDay = await fetchJson(staticCurrentDayUrl, fetchImpl, { signal });
    data = normalizeCurrentDay(staticDay, data, { allowLiveDayState });
    status.source = 'static';
  } catch (error) {
    status.errors.push({ source: 'static', message: error.message });
  }

  try {
    const apiUrl = resolveApiBase({ VITE_GENESIS_GRID_API_BASE_URL: apiBaseUrl });
    status.apiBaseUrl = apiUrl;
    await fetchPublicConfig({ apiBaseUrl: apiUrl, fetchImpl, signal });
    status.apiConnected = true;
    const grid = await fetchGridSnapshot({ apiBaseUrl: apiUrl, fetchImpl, signal });
    data = mergeGridSnapshot(data, grid, { allowLiveGridState: allowLiveDayState });
  } catch (error) {
    status.errors.push({ source: 'api', message: error.message });
  }

  return { data, status };
}
