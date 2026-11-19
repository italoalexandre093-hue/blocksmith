import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const get = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const skin = get('../public/assets/blocksmith-midnight-forge.css');
const setup = get('../public/assets/blocksmith-midnight-forge.js');
const models = get('../public/assets/blocksmith-web-models.css');
const app = get('../src/App.tsx');
const shell = get('../src/index.css');

test('Midnight Forge stylesheet covers all major web surfaces', () => {
  const surfaces = [
    '.sd', '.rp', '.msgs', '.u', '.a', '.comp', '.nav',
    '.settings-tabs', '.settings-tab', '.settings-tool',
    '.settings-input', '.install-card', '.cli-manager',
    '#webModelsView', '.web-model-card', '.web-model-dialog',
    '.web-btn', '.theme-swatch', '.accent-btn'
  ];
  for (const selector of surfaces) {
    assert.ok(skin.includes(selector), 'Missing styled surface: ' + selector);
  }
  assert.ok(skin.includes('--bg: #05070d !important'));
  assert.ok(skin.includes('--tx: #f5f8ff !important'));
  assert.ok(skin.includes('--midnight-navy: #1b3975'));
  assert.equal((skin.match(/{/g) || []).length, (skin.match(/}/g) || []).length);
});

test('old emerald design tokens are removed from standalone Models CSS', () => {
  for (const old of ['#68d2ae', '#8ae8c4', '#83a89a', '#15221c', '#64d8a9']) {
    assert.ok(!models.toLowerCase().includes(old), 'Legacy green token: ' + old);
  }
  assert.ok(models.includes('#315da9'));
});

test('React shell loads Midnight Forge AFTER Models styles', () => {
  assert.ok(app.includes('blocksmith-midnight-forge.css?v=1'));
  assert.ok(app.includes('blocksmith-midnight-forge.js?v=1'));
  assert.ok(app.indexOf('blocksmith-web-models-style') < app.indexOf('blocksmith-midnight-forge-style'));
  assert.ok(app.includes('blocksmith-web-history.js'));
  assert.ok(app.includes('#080808'));
  assert.ok(shell.includes('#05070d'));
});

test('appearance palette initializes white without altering chat state', () => {
  assert.doesNotThrow(() => new vm.Script(setup));
  const accentCalls = [];
  const attrs = {};
  const originalPalette = Array.from({ length: 10 }, (_, i) => ['#ff7700', 'Orange ' + i]);
  const win = { ACCENTS: originalPalette, setAccent(hex) { accentCalls.push(hex); } };
  const root = { setAttribute(name, val) { attrs[name] = val; } };
  const doc = {
    getElementById(name) { return name === 'app' ? root : null; },
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };
  vm.runInNewContext(setup, { window: win, document: doc, Array, String, queueMicrotask });
  assert.equal(accentCalls.at(-1), '#FFFFFF');
  assert.equal(attrs['data-design'], 'monochrome');
  assert.ok(win.ACCENTS.every(([hex]) => /^#[0-9a-f]{6}$/i.test(hex) && hex !== '#ff7700'));
  assert.ok(!setup.includes('localStorage'));
  assert.ok(!setup.includes('sessionStorage'));
});

test('all three appearance theme options stay accessible', () => {
  for (const name of ['dark', 'white', 'gray']) {
    assert.ok(skin.includes('data-theme="' + name + '"'));
  }
  for (const label of ['Preto', 'Preto e branco', 'Grafite']) assert.ok(setup.includes(label));
});
