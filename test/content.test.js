import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  currentDay,
  omittedByClaudeDesign,
  projectCanon,
  publicLinks,
  socialLinks,
} from '../src/content.js';

test('site starts in prelaunch without fictional winners or traces', () => {
  assert.equal(currentDay.phase, 'prelaunch');
  assert.equal(currentDay.day, 0);
  assert.deepEqual(currentDay.traces, []);
  assert.deepEqual(currentDay.archive, []);
});

test('site exposes the fixed Genesis Grid mechanics', () => {
  assert.equal(projectCanon.totalShells, 10000);
  assert.equal(projectCanon.durationDays, 100);
  assert.equal(projectCanon.dailyCalled, 100);
  assert.equal(projectCanon.averageAwakenedPerDay, 33);
  assert.equal(projectCanon.chain, 'Base');
  assert.equal(projectCanon.nftProvider, 'thirdweb');
  assert.equal(projectCanon.storage, 'Arweave/Turbo');
  assert.equal(projectCanon.controlWallet, 'Safe 2-of-3');
});

test('site names the design gaps that were corrected', () => {
  assert.ok(omittedByClaudeDesign.some((item) => item.includes('Day 0')));
  assert.ok(omittedByClaudeDesign.some((item) => item.includes('Prophet Chamber')));
  assert.ok(omittedByClaudeDesign.some((item) => item.includes('agent agency')));
});

test('public links only point to known project surfaces or marked coming soon', () => {
  assert.equal(publicLinks.skill, '/skill.md');
  assert.equal(publicLinks.currentDay, '/data/current-day.json');
  assert.equal(publicLinks.routes, '/data/routes.json');
  assert.equal(socialLinks.telegram.href, 'https://t.me/genesisgrid_bot');
  assert.equal(socialLinks.x.href, null);
  assert.equal(socialLinks.moltbook.href, null);
});

test('prelaunch grid does not fake called awakened or ash cells', () => {
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
  assert.equal(css.includes('.cell:nth-child'), false);
});
