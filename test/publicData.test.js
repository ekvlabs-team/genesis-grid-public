import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { GG_DATA } from '../src/data.js';
import {
  fetchDayArchive,
  fetchGridSnapshot,
  fetchProfileRecord,
  fetchPublicConfig,
  fetchTokenRecord,
  loadPublicData,
  mergeGridSnapshot,
  normalizeCurrentDay,
  publicApiUrl,
  resolveApiBase,
} from '../src/publicData.js';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

test('public current-day JSON normalizes into the UI data shape', () => {
  const staticDay = JSON.parse(readFileSync(new URL('../public/data/current-day.json', import.meta.url), 'utf8'));
  const data = normalizeCurrentDay(staticDay, GG_DATA);

  assert.equal(data.day, 0);
  assert.equal(data.epoch, '0');
  assert.equal(data.phase, 'prelaunch');
  assert.equal(data.counters.called, 0);
  assert.equal(data.counters.awakened, 0);
  assert.equal(data.counters.ash, 0);
  assert.equal(data.counters.born, 10000);
  assert.deepEqual(data.traces, []);
  assert.deepEqual(data.archive, []);
  assert.equal(data.submissionsOpen, false);
});

test('prelaunch payloads cannot open public submissions', () => {
  const data = normalizeCurrentDay(
    {
      ...GG_DATA,
      phase: 'prelaunch',
      traces: [{ id: 'trace-1', agentName: 'Should not render' }],
      archive: [{ day: 1, law: 'Should not render' }],
      submissionsOpen: true,
    },
    GG_DATA,
  );

  assert.equal(data.phase, 'prelaunch');
  assert.deepEqual(data.traces, []);
  assert.deepEqual(data.archive, []);
  assert.equal(data.submissionsOpen, false);
});

test('live-looking payloads stay closed until the launch read switch is enabled', () => {
  const payload = {
    phase: 'active',
    day: 1,
    epoch: 'I',
    epochName: 'Signal and virality',
    law: 'Bring proof before the seal.',
    counters: { born: 10000, calledToday: 100, awakenedToday: 0, ashToday: 0 },
    submissionsOpen: true,
  };

  const defaultData = normalizeCurrentDay(payload, GG_DATA);
  assert.equal(defaultData.phase, 'prelaunch');
  assert.equal(defaultData.submissionsOpen, false);

  const launchData = normalizeCurrentDay(payload, GG_DATA, { allowLiveDayState: true });
  assert.equal(launchData.phase, 'active');
  assert.equal(launchData.submissionsOpen, true);
});

test('grid snapshots update read-only grid state without opening submissions', () => {
  const data = mergeGridSnapshot(GG_DATA, {
    day: 0,
    totalSupply: 10000,
    called: [null, '', 0, 1, 2, 3],
    awakened: [9],
    ash: [13, 14],
  }, {
    allowLiveGridState: true,
  });

  assert.deepEqual(data.grid.called, [0, 1, 2, 3]);
  assert.deepEqual(data.grid.awakened, [9]);
  assert.deepEqual(data.grid.ash, [13, 14]);
  assert.equal(data.counters.called, 4);
  assert.equal(data.counters.awakened, 1);
  assert.equal(data.counters.ash, 2);
  assert.equal(data.submissionsOpen, false);
});

test('prelaunch grid snapshots are observed but not rendered as live state by default', () => {
  const data = mergeGridSnapshot(GG_DATA, {
    day: 0,
    totalSupply: 10000,
    called: [1, 2, 3],
    awakened: [9],
    ash: [13, 14],
  });

  assert.deepEqual(data.grid.called, []);
  assert.deepEqual(data.grid.awakened, []);
  assert.deepEqual(data.grid.ash, []);
  assert.equal(data.counters.called, 0);
  assert.equal(data.submissionsOpen, false);
});

test('loadPublicData falls back to embedded data when public reads fail', async () => {
  const result = await loadPublicData({
    fetchImpl: async () => new Response('not found', { status: 404 }),
    apiBaseUrl: 'https://api.genesisgrid.xyz',
  });

  assert.equal(result.data.day, GG_DATA.day);
  assert.equal(result.data.submissionsOpen, false);
  assert.equal(result.status.source, 'embedded');
  assert.ok(result.status.errors.length >= 1);
});

test('loadPublicData connects to API but keeps grid visually closed during prelaunch', async () => {
  const seen = [];
  const result = await loadPublicData({
    apiBaseUrl: 'https://api.genesisgrid.xyz',
    fetchImpl: async (url) => {
      seen.push(String(url));
      if (String(url).endsWith('/data/current-day.json')) {
        return jsonResponse({
          phase: 'prelaunch',
          day: 0,
          epoch: '0',
          epochName: 'Before the Gate',
          law: 'The Grid is not open yet.',
          counters: { born: 10000, calledToday: 0, awakenedToday: 0, ashToday: 0 },
          submissionsOpen: false,
        });
      }
      if (String(url).endsWith('/config')) {
        return jsonResponse({ chainId: 8453, media: { mimeType: 'image/webp' } });
      }
      if (String(url).endsWith('/grid')) {
        return jsonResponse({ day: 0, totalSupply: 10000, called: [7], awakened: [], ash: [] });
      }
      return new Response('not found', { status: 404 });
    },
  });

  assert.equal(result.status.source, 'static');
  assert.equal(result.status.apiConnected, true);
  assert.deepEqual(result.data.grid.called, []);
  assert.equal(result.data.submissionsOpen, false);
  assert.ok(seen.some((url) => url.endsWith('/config')));
  assert.ok(seen.some((url) => url.endsWith('/grid')));
});

test('loadPublicData can render active read-only grid only with explicit live-read approval', async () => {
  const result = await loadPublicData({
    apiBaseUrl: 'https://api.genesisgrid.xyz',
    allowLiveDayState: true,
    fetchImpl: async (url) => {
      if (String(url).endsWith('/data/current-day.json')) {
        return jsonResponse({
          phase: 'active',
          day: 1,
          epoch: 'I',
          epochName: 'Signal and virality',
          law: 'Bring proof before the seal.',
          counters: { born: 10000, calledToday: 100, awakenedToday: 0, ashToday: 0 },
          submissionsOpen: false,
        });
      }
      if (String(url).endsWith('/config')) {
        return jsonResponse({ chainId: 8453, media: { mimeType: 'image/webp' } });
      }
      if (String(url).endsWith('/grid')) {
        return jsonResponse({ day: 1, totalSupply: 10000, called: [7], awakened: [], ash: [] });
      }
      return new Response('not found', { status: 404 });
    },
  });

  assert.equal(result.data.phase, 'active');
  assert.deepEqual(result.data.grid.called, [7]);
  assert.equal(result.data.submissionsOpen, false);
});

test('live trace URL fields are sanitized before rendering', () => {
  const data = normalizeCurrentDay(
    {
      phase: 'active',
      day: 1,
      epoch: 'I',
      epochName: 'Signal and virality',
      law: 'Bring proof before the seal.',
      traces: [{
        id: 'trace-1',
        proofUrl: 'javascript:alert(1)',
        proofs: ['https://github.com/ekvlabs-team/genesis-grid-public/pull/1', 'http://insecure.test/proof'],
        imageUrl: 'data:image/svg+xml;base64,PHN2Zy8+',
        arweaveUrl: 'ftp://example.test/meta',
        txHash: '0x1234',
      }],
      archive: [{ day: 1, law: 'Sealed law', calledTokenIds: [1] }],
      submissionsOpen: false,
    },
    GG_DATA,
    { allowLiveDayState: true },
  );

  assert.equal(data.traces[0].proofUrl, 'https://github.com/ekvlabs-team/genesis-grid-public/pull/1');
  assert.deepEqual(data.traces[0].proofs, ['https://github.com/ekvlabs-team/genesis-grid-public/pull/1']);
  assert.equal(data.traces[0].imageSrc, '');
  assert.equal(data.traces[0].arweaveUrl, '');
  assert.equal(data.traces[0].txHash, '');
  assert.equal(data.archive.length, 1);
});

test('API base URL defaults to the public Genesis Grid API', () => {
  assert.equal(resolveApiBase({}), 'https://api.genesisgrid.xyz');
  assert.equal(resolveApiBase({ VITE_GENESIS_GRID_API_BASE_URL: 'https://api.genesisgrid.xyz/' }), 'https://api.genesisgrid.xyz');
  assert.equal(publicApiUrl('/grid'), 'https://api.genesisgrid.xyz/grid');
});

test('public API read helpers use GET with omitted credentials', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return jsonResponse({ ok: true });
  };
  const options = { apiBaseUrl: 'https://api.genesisgrid.xyz', fetchImpl };

  await fetchPublicConfig(options);
  await fetchGridSnapshot(options);
  await fetchDayArchive(7, options);
  await fetchTokenRecord(42, options);
  await fetchProfileRecord('0x1111111111111111111111111111111111111111', options);

  assert.deepEqual(calls.map((call) => call.url), [
    'https://api.genesisgrid.xyz/config',
    'https://api.genesisgrid.xyz/grid',
    'https://api.genesisgrid.xyz/days/7',
    'https://api.genesisgrid.xyz/tokens/42',
    'https://api.genesisgrid.xyz/profiles/0x1111111111111111111111111111111111111111',
  ]);
  for (const call of calls) {
    assert.equal(call.init.method, 'GET');
    assert.equal(call.init.credentials, 'omit');
  }
});

test('production API base rejects privileged or non-canonical browser targets', () => {
  const rejected = [
    'https://abc.supabase.co',
    'https://genesis-grid-api.workers.dev',
    'http://localhost:8787',
    'http://127.0.0.1:8787',
    '/api',
  ];

  for (const value of rejected) {
    assert.equal(
      resolveApiBase({ VITE_GENESIS_GRID_API_BASE_URL: value }),
      'https://api.genesisgrid.xyz',
      `${value} must not become the production browser API base`,
    );
  }
});

test('public source does not name privileged backend secrets', () => {
  const files = [
    '../src/App.jsx',
    '../src/data.js',
    '../src/publicData.js',
    '../src/SubmitView.jsx',
    '../public/data/routes.json',
  ];
  const forbidden = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'SESSION_SECRET',
    'API_OPERATOR_TOKEN',
    'CHAINOPS_PROPOSER_PRIVATE_KEY',
    'PRIVATE_KEY',
    'service_role',
  ];

  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    for (const token of forbidden) {
      assert.doesNotMatch(source, new RegExp(token, 'i'), `${file} must not expose ${token}`);
    }
  }
});
