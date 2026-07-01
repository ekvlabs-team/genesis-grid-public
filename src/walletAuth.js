import { publicApiUrl } from './publicData.js';

export const BASE_CHAIN_ID = 8453;
export const BASE_CHAIN_ID_HEX = '0x2105';
export const SIWE_DOMAIN = 'genesisgrid.xyz';
export const SIWE_URI = 'https://genesisgrid.xyz';

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

async function postAuthJson(path, body, { apiBaseUrl, fetchImpl, signal } = {}) {
  const fetcher = fetchImpl ?? globalThis.fetch;
  if (typeof fetcher !== 'function') throw new Error('fetch is unavailable');
  const response = await fetcher(publicApiUrl(path, apiBaseUrl), {
    method: 'POST',
    credentials: 'include',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });
  return parseJsonResponse(response, path);
}

export async function requestSiweNonce({
  wallet,
  apiBaseUrl,
  fetchImpl,
  signal,
} = {}) {
  const body = await postAuthJson('/auth/nonce', { wallet: normalizeWallet(wallet) }, {
    apiBaseUrl,
    fetchImpl,
    signal,
  });
  const nonce = cleanString(body.nonce);
  if (!nonce) throw new Error('SIWE nonce response is missing nonce.');
  return nonce;
}

export function buildSiweMessage({
  wallet,
  nonce,
  issuedAt = new Date().toISOString(),
  domain = SIWE_DOMAIN,
  uri = SIWE_URI,
  chainId = BASE_CHAIN_ID,
  statement = 'Sign in to Genesis Grid. This proves wallet ownership; it does not mint or spend.',
} = {}) {
  const address = normalizeWallet(wallet);
  const cleanNonce = cleanString(nonce);
  if (!cleanNonce) throw new Error('SIWE nonce is required.');
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    statement,
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${cleanNonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}

export async function verifySiweSession({
  wallet,
  message,
  signature,
  apiBaseUrl,
  fetchImpl,
  signal,
} = {}) {
  const requestedWallet = normalizeWallet(wallet);
  const body = await postAuthJson('/auth/verify', {
    wallet: requestedWallet,
    message: cleanString(message),
    signature: cleanString(signature),
  }, {
    apiBaseUrl,
    fetchImpl,
    signal,
  });
  const verifiedWallet = normalizeWallet(body.wallet);
  if (verifiedWallet !== requestedWallet) {
    throw new Error('verified wallet does not match requested wallet');
  }
  return { wallet: verifiedWallet };
}

export async function connectWalletSession({
  ethereum = globalThis.ethereum,
  apiBaseUrl,
  fetchImpl,
  now = () => new Date(),
  signal,
} = {}) {
  if (!ethereum?.request) {
    throw new Error('EVM wallet provider is unavailable.');
  }

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const wallet = normalizeWallet(accounts?.[0]);
  const chainId = cleanString(await ethereum.request({ method: 'eth_chainId' })).toLowerCase();
  if (chainId !== BASE_CHAIN_ID_HEX) {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BASE_CHAIN_ID_HEX }],
    });
  }

  const nonce = await requestSiweNonce({ wallet, apiBaseUrl, fetchImpl, signal });
  const message = buildSiweMessage({
    wallet,
    nonce,
    issuedAt: now().toISOString(),
  });
  const signature = await ethereum.request({
    method: 'personal_sign',
    params: [message, wallet],
  });

  return verifySiweSession({
    wallet,
    message,
    signature,
    apiBaseUrl,
    fetchImpl,
    signal,
  });
}
