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
  assert.equal(socialLinks.x.href, 'https://x.com/GenesisGridAI');
  assert.equal(socialLinks.moltbook.href, null);
});

test('prelaunch grid does not fake called awakened or ash cells', () => {
  const css = readFileSync(new URL('../src/ui_kit.css', import.meta.url), 'utf8');
  const gridSource = readFileSync(new URL('../src/GridWall.jsx', import.meta.url), 'utf8');
  assert.equal(css.includes('.cell:nth-child'), false);
  assert.match(gridSource, /const tokenId = i \+ 1;/, 'public grid should preserve 1-based token display');
});

test('no social links use placeholder hash URLs', () => {
  for (const [key, link] of Object.entries(socialLinks)) {
    if (link.href !== null) {
      assert.notEqual(link.href, '#', `${key}.href must not be placeholder`);
      assert.ok(link.href.startsWith('https://'), `${key}.href must be https`);
    }
  }
});

test('github link points to ekvlabs-team org', () => {
  assert.ok(socialLinks.github.href.includes('ekvlabs-team'));
});

test('agent-facing relic media copy is WebP-only', () => {
  const files = [
    '../public/skill.md',
    '../public/data/trial/example.json',
    '../src/content.js',
    '../src/SubmitView.jsx',
  ];

  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /webp/i, `${file} must mention WebP`);
    assert.ok(
      /768(?:×|x)768/i.test(source) || /MEDIA_REQUIRED_WIDTH.*MEDIA_REQUIRED_HEIGHT/is.test(source),
      `${file} must mention exact 768x768 relic media or use the shared media-size constants`,
    );
    assert.doesNotMatch(source, /\bpng\b/i, `${file} must not advertise PNG relics`);
    assert.doesNotMatch(source, /image\/png/i, `${file} must not accept PNG uploads`);
    assert.doesNotMatch(source, /recommended/i, `${file} must not present required relic dimensions as optional`);
  }
});

test('prelaunch UI does not fake wallet connection or local submissions', () => {
  const currentDayJson = JSON.parse(readFileSync(new URL('../public/data/current-day.json', import.meta.url), 'utf8'));
  const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const topbarSource = readFileSync(new URL('../src/TopBar.jsx', import.meta.url), 'utf8');
  const submitSource = readFileSync(new URL('../src/SubmitView.jsx', import.meta.url), 'utf8');

  assert.equal(currentDayJson.submissionsOpen, false);
  assert.doesNotMatch(appSource, /Math\.random/, 'prelaunch app must not mint local trace IDs');
  assert.doesNotMatch(appSource, /setData\(\{\s*\.\.\.data,\s*traces:/, 'prelaunch app must not append local traces');
  assert.doesNotMatch(topbarSource + submitSource, /0x9f3c/i, 'prelaunch UI must not show a fake wallet address');
});

test('public copy does not promise a live trial card route before launch', () => {
  const files = [
    '../src/AgentQuickstart.jsx',
    '../src/EmptyViews.jsx',
    '../src/data.js',
    '../src/components/TraceCard.jsx',
  ];

  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /\/trial\/\{?id\}?/i, `${file} must not promise a live /trial/{id} route in prelaunch`);
    assert.doesNotMatch(source, /permanent card at/i, `${file} must not promise permanent cards before launch`);
  }
});
