import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  BASE_CHAIN_ID_HEX,
  buildSiweMessage,
  connectWalletSession,
  requestSiweNonce,
  verifySiweSession,
} from '../src/walletAuth.js';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

const wallet = '0x1111111111111111111111111111111111111111';

test('wallet auth requests backend nonce with credentials and no idempotency key', async () => {
  const calls = [];
  const nonce = await requestSiweNonce({
    wallet,
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init, body: JSON.parse(init.body) });
      return jsonResponse({ nonce: 'nonce-123' });
    },
  });

  assert.equal(nonce, 'nonce-123');
  assert.equal(calls[0].url, 'https://api.genesisgrid.xyz/auth/nonce');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'include');
  assert.equal(calls[0].init.headers.accept, 'application/json');
  assert.equal(calls[0].init.headers['content-type'], 'application/json');
  assert.equal(calls[0].init.headers['idempotency-key'], undefined);
  assert.deepEqual(calls[0].body, { wallet });
});

test('wallet auth builds an EIP-4361 SIWE message for genesisgrid.xyz on Base', () => {
  const message = buildSiweMessage({
    wallet,
    nonce: 'nonce-123',
    issuedAt: '2026-07-01T00:00:00.000Z',
  });

  assert.match(message, /^genesisgrid\.xyz wants you to sign in with your Ethereum account:\n0x1111/u);
  assert.match(message, /\nURI: https:\/\/genesisgrid\.xyz\n/u);
  assert.match(message, /\nVersion: 1\n/u);
  assert.match(message, /\nChain ID: 8453\n/u);
  assert.match(message, /\nNonce: nonce-123\n/u);
  assert.match(message, /\nIssued At: 2026-07-01T00:00:00.000Z/u);
});

test('connectWalletSession proves Base wallet ownership and receives an HttpOnly cookie from API', async () => {
  const calls = [];
  const ethereumCalls = [];
  const ethereum = {
    request: async ({ method, params }) => {
      ethereumCalls.push({ method, params });
      if (method === 'eth_requestAccounts') return [wallet];
      if (method === 'eth_chainId') return BASE_CHAIN_ID_HEX;
      if (method === 'personal_sign') return '0xsigned';
      throw new Error(`unexpected method ${method}`);
    },
  };

  const session = await connectWalletSession({
    ethereum,
    now: () => new Date('2026-07-01T00:00:00.000Z'),
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init, body: JSON.parse(init.body) });
      if (String(url).endsWith('/auth/nonce')) return jsonResponse({ nonce: 'nonce-123' });
      if (String(url).endsWith('/auth/verify')) return jsonResponse({ wallet });
      return new Response('not found', { status: 404 });
    },
  });

  assert.equal(session.wallet, wallet);
  assert.deepEqual(ethereumCalls.map((call) => call.method), [
    'eth_requestAccounts',
    'eth_chainId',
    'personal_sign',
  ]);
  assert.equal(ethereumCalls[2].params[1], wallet);
  assert.equal(calls[1].url, 'https://api.genesisgrid.xyz/auth/verify');
  assert.equal(calls[1].init.method, 'POST');
  assert.equal(calls[1].init.credentials, 'include');
  assert.equal(calls[1].body.wallet, wallet);
  assert.equal(calls[1].body.signature, '0xsigned');
  assert.match(calls[1].body.message, /Nonce: nonce-123/u);
});

test('connectWalletSession requests Base switch before signing when wallet is on another chain', async () => {
  const methods = [];
  const ethereum = {
    request: async ({ method }) => {
      methods.push(method);
      if (method === 'eth_requestAccounts') return [wallet];
      if (method === 'eth_chainId') return '0x1';
      if (method === 'wallet_switchEthereumChain') return null;
      if (method === 'personal_sign') return '0xsigned';
      throw new Error(`unexpected method ${method}`);
    },
  };

  await connectWalletSession({
    ethereum,
    now: () => new Date('2026-07-01T00:00:00.000Z'),
    fetchImpl: async (url) => {
      if (String(url).endsWith('/auth/nonce')) return jsonResponse({ nonce: 'nonce-123' });
      if (String(url).endsWith('/auth/verify')) return jsonResponse({ wallet });
      return new Response('not found', { status: 404 });
    },
  });

  assert.deepEqual(methods, ['eth_requestAccounts', 'eth_chainId', 'wallet_switchEthereumChain', 'personal_sign']);
});

test('wallet auth refuses to verify a different wallet than the signed account', async () => {
  await assert.rejects(
    verifySiweSession({
      wallet,
      message: 'message',
      signature: '0xsigned',
      fetchImpl: async () => jsonResponse({ wallet: '0x2222222222222222222222222222222222222222' }),
    }),
    /verified wallet does not match requested wallet/u,
  );
});

test('wallet auth source does not persist session material in browser storage', () => {
  const source = readFileSync(new URL('../src/walletAuth.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage/u);
  assert.doesNotMatch(source, /service_role|API_OPERATOR_TOKEN|SESSION_SECRET/iu);
});
