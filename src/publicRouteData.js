import {
  STATIC_CURRENT_DAY_PATH,
  fetchDayArchive,
  fetchProfileRecord,
  fetchTokenRecord,
  normalizeDayRecord,
  normalizeProfileRecord,
  normalizeTokenRecord,
} from './publicData.js';

function cleanString(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function cleanInt(value, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.floor(number));
}

function parseNonNegativeRouteInt(value) {
  if (!/^(0|[1-9]\d*)$/u.test(cleanString(value))) return -1;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : -1;
}

function isWallet(value) {
  return /^0x[a-f0-9]{40}$/iu.test(cleanString(value));
}

function safeRouteId(value) {
  const id = cleanString(value);
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/u.test(id) ? id : '';
}

function pathParts(pathname = '/') {
  const raw = cleanString(pathname, '/');
  let path = raw;
  try {
    path = new URL(raw, 'https://genesisgrid.xyz').pathname;
  } catch {
    path = raw;
  }
  return path.replace(/\/+$/u, '').split('/').filter(Boolean);
}

export function parsePublicRoute(pathname = '/') {
  const parts = pathParts(pathname);
  if (parts.length === 0) return { view: 'home' };
  if (parts[0] === 'pool' && parts.length === 1) return { view: 'pool' };
  if (parts[0] === 'archive' && parts.length === 1) return { view: 'archive' };
  if (parts[0] === 'submit' && parts.length === 1) return { view: 'submit' };
  if (parts[0] === 'day' && parts.length === 2) {
    const day = parseNonNegativeRouteInt(parts[1]);
    return day > 0 ? { view: 'day', day } : { view: 'not-found' };
  }
  if (parts[0] === 'token' && parts.length === 2) {
    const tokenId = parseNonNegativeRouteInt(parts[1]);
    return tokenId >= 0 ? { view: 'token', tokenId } : { view: 'not-found' };
  }
  if (parts[0] === 'profile' && parts.length === 2 && isWallet(parts[1])) {
    return { view: 'profile', wallet: parts[1].toLowerCase() };
  }
  if (parts[0] === 'trial' && parts.length === 2) {
    const trialId = safeRouteId(parts[1]);
    return trialId ? { view: 'trial', trialId } : { view: 'not-found' };
  }
  return { view: 'not-found' };
}

export function routeToPath(route = {}) {
  if (route.view === 'home') return '/';
  if (route.view === 'pool') return '/pool';
  if (route.view === 'archive') return '/archive';
  if (route.view === 'submit') return '/submit';
  if (route.view === 'day') return `/day/${cleanInt(route.day, 0)}`;
  if (route.view === 'token') return `/token/${cleanInt(route.tokenId, 0)}`;
  if (route.view === 'profile') return `/profile/${cleanString(route.wallet).toLowerCase()}`;
  if (route.view === 'trial') return `/trial/${safeRouteId(route.trialId) || 'example'}`;
  return '/';
}

async function fetchStaticJson(url, fetchImpl, signal) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
  const response = await fetchImpl(url, {
    method: 'GET',
    credentials: 'omit',
    headers: { accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`);
  return response.json();
}

export async function loadPublicRouteData(route = {}, {
  apiBaseUrl,
  fetchImpl = globalThis.fetch,
  allowLiveDayState = false,
  signal,
} = {}) {
  if (route.view === 'day' && !allowLiveDayState) {
    return {
      route,
      status: 'gated',
      record: null,
      message: 'Public day records open after launch approval.',
    };
  }

  if (['token', 'profile'].includes(route.view) && !allowLiveDayState) {
    return {
      route,
      status: 'gated',
      record: null,
      message: 'Public token and profile records open after launch approval.',
    };
  }

  if (route.view === 'day') {
    const record = normalizeDayRecord(await fetchDayArchive(route.day, { apiBaseUrl, fetchImpl, signal }));
    return { route, status: record ? 'loaded' : 'empty', record };
  }

  if (route.view === 'token') {
    if (!Number.isInteger(route.tokenId) || route.tokenId < 0) {
      return { route, status: 'not-found', record: null, message: 'Token route is invalid.' };
    }
    const record = normalizeTokenRecord(await fetchTokenRecord(route.tokenId, { apiBaseUrl, fetchImpl, signal }));
    return { route, status: record ? 'loaded' : 'empty', record };
  }

  if (route.view === 'profile') {
    const record = normalizeProfileRecord(await fetchProfileRecord(route.wallet, { apiBaseUrl, fetchImpl, signal }));
    return { route, status: record ? 'loaded' : 'empty', record };
  }

  if (route.view === 'trial' && route.trialId === 'example') {
    const record = await fetchStaticJson('/data/trial/example.json', fetchImpl, signal);
    return { route, status: 'static-example', record };
  }

  if (route.view === 'trial') {
    return {
      route,
      status: 'gated',
      record: null,
      message: 'Public Trial Card routes open only after approved export data exists.',
    };
  }

  if (route.view === 'archive') {
    const record = await fetchStaticJson(STATIC_CURRENT_DAY_PATH, fetchImpl, signal);
    return { route, status: 'static-current-day', record };
  }

  return { route, status: 'idle', record: null };
}
