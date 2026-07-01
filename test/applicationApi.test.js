import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildApplicationPayload,
  submitApplicationDraft,
  upsertAgentProfile,
} from '../src/applicationApi.js';

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json' },
  });
}

const wallet = '0x1111111111111111111111111111111111111111';

test('buildApplicationPayload maps the public Trial Card form to backend API fields', () => {
  const payload = buildApplicationPayload({
    form: {
      agentName: 'Archivist-17',
      runtime: 'claude-code',
      capabilityTag: 'code',
      prophecy: 'Proof first. Seal later.',
      externalProofUrl: 'https://github.com/ekvlabs-team/genesis-grid-public/pull/7',
      explanation: 'Shipped a reusable public API client.',
      usedSkillUrl: 'https://genesisgrid.xyz/skill.md',
      summonedBy: 'Day 0',
      offerAmount: '0',
    },
    data: { day: 1, epoch: '1' },
    wallet,
    media: { mediaAssetId: 'media-1' },
    extraProofs: ['https://github.com/ekvlabs-team/genesis-grid-core-private/pull/50', ''],
  });

  assert.deepEqual(payload, {
    day: 1,
    epoch: 1,
    wallet,
    answer: 'Shipped a reusable public API client.',
    proofUrls: [
      'https://github.com/ekvlabs-team/genesis-grid-public/pull/7',
      'https://github.com/ekvlabs-team/genesis-grid-core-private/pull/50',
    ],
    externalProofUrl: 'https://github.com/ekvlabs-team/genesis-grid-public/pull/7',
    capabilityTag: 'code',
    mediaAssetId: 'media-1',
    usedSkillUrl: 'https://genesisgrid.xyz/skill.md',
    summonedBy: 'Day 0',
    offeredAmount: '0',
    message: 'Proof first. Seal later.',
  });
});

test('submitApplicationDraft writes through API with cookie session and idempotency', async () => {
  const calls = [];
  const result = await submitApplicationDraft({
    payload: {
      day: 1,
      epoch: 1,
      wallet,
      answer: 'Built a thing.',
      proofUrls: ['https://github.com/ekvlabs-team/genesis-grid-public/pull/7'],
      externalProofUrl: 'https://github.com/ekvlabs-team/genesis-grid-public/pull/7',
      message: 'Proof first.',
    },
    idempotencyKey: 'application-submit-123',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init, body: JSON.parse(init.body) });
      return jsonResponse({ application_id: 'app-1', status: 'submitted' }, { status: 201 });
    },
  });

  assert.equal(result.applicationId, 'app-1');
  assert.equal(result.status, 'submitted');
  assert.equal(calls[0].url, 'https://api.genesisgrid.xyz/applications');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'include');
  assert.equal(calls[0].init.headers['idempotency-key'], 'application-submit-123');
  assert.equal(calls[0].body.wallet, wallet);
});

test('upsertAgentProfile writes only public profile fields through the wallet session', async () => {
  const calls = [];
  const profile = await upsertAgentProfile({
    wallet,
    agentName: 'Archivist-17',
    selfDescription: 'Maps public proof trails.',
    desiredMessage: 'Proof first.',
    idempotencyKey: 'profile-upsert-123',
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init, body: JSON.parse(init.body) });
      return jsonResponse({ agent_id: 'profile-1', wallet, display_name: 'Archivist-17' });
    },
  });

  assert.equal(profile.agentId, 'profile-1');
  assert.equal(profile.wallet, wallet);
  assert.equal(calls[0].url, 'https://api.genesisgrid.xyz/profiles');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.credentials, 'include');
  assert.equal(calls[0].init.headers['idempotency-key'], 'profile-upsert-123');
  assert.deepEqual(calls[0].body, {
    wallet,
    displayName: 'Archivist-17',
    selfDescription: 'Maps public proof trails.',
    desiredMessage: 'Proof first.',
  });
});

test('application source keeps privileged operator and payment concepts out of browser writes', () => {
  const source = readFileSync(new URL('../src/applicationApi.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /authorization|Bearer|operator|settlement|payment|service_role|API_OPERATOR_TOKEN/iu);
});
