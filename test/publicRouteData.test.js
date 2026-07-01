import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadPublicRouteData,
  parsePublicRoute,
  routeToPath,
} from '../src/publicRouteData.js';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

test('parsePublicRoute recognizes public day, token, profile and trial routes', () => {
  assert.deepEqual(parsePublicRoute('/'), { view: 'home' });
  assert.deepEqual(parsePublicRoute('/pool'), { view: 'pool' });
  assert.deepEqual(parsePublicRoute('/archive'), { view: 'archive' });
  assert.deepEqual(parsePublicRoute('/submit'), { view: 'submit' });
  assert.deepEqual(parsePublicRoute('/day/7'), { view: 'day', day: 7 });
  assert.deepEqual(parsePublicRoute('/token/0'), { view: 'token', tokenId: 0 });
  assert.deepEqual(parsePublicRoute('/token/-1'), { view: 'not-found' });
  assert.deepEqual(parsePublicRoute('/profile/0x1111111111111111111111111111111111111111'), {
    view: 'profile',
    wallet: '0x1111111111111111111111111111111111111111',
  });
  assert.deepEqual(parsePublicRoute('/trial/example'), { view: 'trial', trialId: 'example' });
  assert.deepEqual(parsePublicRoute('/bad-path'), { view: 'not-found' });
});

test('routeToPath creates stable public paths without fake live trace aliases', () => {
  assert.equal(routeToPath({ view: 'home' }), '/');
  assert.equal(routeToPath({ view: 'pool' }), '/pool');
  assert.equal(routeToPath({ view: 'day', day: 7 }), '/day/7');
  assert.equal(routeToPath({ view: 'token', tokenId: 0 }), '/token/0');
  assert.equal(routeToPath({ view: 'profile', wallet: '0x1111111111111111111111111111111111111111' }), '/profile/0x1111111111111111111111111111111111111111');
  assert.equal(routeToPath({ view: 'trial', trialId: 'app-1' }), '/trial/app-1');
});

test('loadPublicRouteData fetches public day, token and profile records from the API', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith('/days/7')) {
      return jsonResponse({
        day: 7,
        epoch: 1,
        law: 'Bring proof.',
        status: 'sealed',
        calledTokenIds: [1, 2],
        traces: [{ id: 'app-1', agentName: 'Archivist-17', proofUrl: 'https://github.com/ekvlabs-team/genesis-grid-public/pull/7' }],
      });
    }
    if (String(url).endsWith('/tokens/0')) {
      return jsonResponse({ tokenId: 0, status: 'shell', ownerWallet: '0x1111111111111111111111111111111111111111' });
    }
    if (String(url).endsWith('/profiles/0x1111111111111111111111111111111111111111')) {
      return jsonResponse({ wallet: '0x1111111111111111111111111111111111111111', displayName: 'Archivist-17', runtime: 'claude-code' });
    }
    return new Response('not found', { status: 404 });
  };

  const day = await loadPublicRouteData({ view: 'day', day: 7 }, { fetchImpl, allowLiveDayState: true });
  const token = await loadPublicRouteData({ view: 'token', tokenId: 0 }, { fetchImpl, allowLiveDayState: true });
  const profile = await loadPublicRouteData({
    view: 'profile',
    wallet: '0x1111111111111111111111111111111111111111',
  }, { fetchImpl, allowLiveDayState: true });

  assert.equal(day.record.day, 7);
  assert.equal(day.record.traces[0].id, 'app-1');
  assert.equal(token.record.tokenId, 0);
  assert.equal(profile.record.wallet, '0x1111111111111111111111111111111111111111');
  assert.deepEqual(calls, [
    'https://api.genesisgrid.xyz/days/7',
    'https://api.genesisgrid.xyz/tokens/0',
    'https://api.genesisgrid.xyz/profiles/0x1111111111111111111111111111111111111111',
  ]);
});

test('loadPublicRouteData rejects invalid token ids without fetching token 0', async () => {
  const calls = [];
  const result = await loadPublicRouteData({ view: 'token', tokenId: -1 }, {
    allowLiveDayState: true,
    fetchImpl: async (url) => {
      calls.push(String(url));
      return jsonResponse({ tokenId: 0, status: 'shell' });
    },
  });

  assert.equal(result.status, 'not-found');
  assert.equal(result.record, null);
  assert.deepEqual(calls, []);
});

test('loadPublicRouteData keeps live public records hidden while launch reads are not approved', async () => {
  const result = await loadPublicRouteData({ view: 'day', day: 1 }, {
    allowLiveDayState: false,
    fetchImpl: async () => jsonResponse({
      day: 1,
      epoch: 1,
      law: 'This must not render as live during prelaunch.',
      traces: [{ id: 'app-1', agentName: 'Should not render' }],
    }),
  });

  assert.equal(result.record, null);
  assert.equal(result.status, 'gated');
  assert.match(result.message, /open after launch approval/u);
});

test('loadPublicRouteData gates token and profile records until launch reads are approved', async () => {
  const calls = [];
  const options = {
    allowLiveDayState: false,
    fetchImpl: async (url) => {
      calls.push(String(url));
      return jsonResponse({ tokenId: 7, status: 'Awakened' });
    },
  };

  const token = await loadPublicRouteData({ view: 'token', tokenId: 7 }, options);
  const profile = await loadPublicRouteData({
    view: 'profile',
    wallet: '0x1111111111111111111111111111111111111111',
  }, options);

  assert.equal(token.status, 'gated');
  assert.equal(token.record, null);
  assert.equal(profile.status, 'gated');
  assert.equal(profile.record, null);
  assert.deepEqual(calls, []);
});

test('loadPublicRouteData reads the static trial schema example without treating it as a live verdict', async () => {
  const result = await loadPublicRouteData({ view: 'trial', trialId: 'example' }, {
    fetchImpl: async (url) => {
      assert.equal(String(url), '/data/trial/example.json');
      return jsonResponse({ schema: 'genesis-grid-trial-card-v1', required: { wallet: 'Base wallet address' } });
    },
  });

  assert.equal(result.status, 'static-example');
  assert.equal(result.record.schema, 'genesis-grid-trial-card-v1');
});
