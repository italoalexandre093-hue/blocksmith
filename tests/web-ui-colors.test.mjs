import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const script = source('../public/assets/blocksmith-ui-colors.js');
const css = source('../public/assets/blocksmith-ui-colors.css');
const app = source('../src/App.tsx');
const original = source('../public/assets/aistudio/blocksmith-app-ajustado_aadf2d67.html');

test('Visual Color Studio scripts parse and preserve the existing Appearance panel', () => {
  assert.doesNotThrow(() => new Script(script));
  assert.match(original, /data-settings-pane="appearance"/);
  assert.match(script, /querySelector\('\[data-settings-pane="appearance"\]'\)/);
  assert.match(script, /blocksmithVisualColorStudio/);
  assert.match(script, /visual-color-grid/);
});

test('Six palettes include background, panel, border and accent colors', () => {
  for (const id of ['amethyst','cobalt','emerald','rose','amber','slate'])
    assert.match(script, new RegExp("id:'"+id+"'"));
  for (const token of ['--ui-bg','--ui-side','--ui-surface','--ui-raised','--ui-border','--ui-accent']) {
    assert.ok(script.includes(token), token);
    assert.ok(css.includes(token), token);
  }
  assert.match(script, /input\.type = 'color'/);
  assert.match(script, /aria-pressed/);
  assert.match(script, /visual-color-mock/);
  assert.match(script, /visualColorStatus/);
});

test('Chat, models, sidebar, settings and modal colors use the selected visual theme', () => {
  for (const selector of ['.sd','.rp','.comp','.send','.nav.act','.settings-tab.act','.web-model-card','.web-model-dialog','.blocksmith-tool-dialog'])
    assert.ok(css.includes(selector), selector);
  assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
});

test('Theme preferences persist locally without modifying provider credentials or chat state', () => {
  assert.match(script, /localStorage\.setItem\(storageKey/);
  assert.match(script, /validHex/);
  assert.match(script, /readSaved\(\)/);
  assert.match(script, /appearanceReset/);
  assert.doesNotMatch(script, /\/api\/ai\//);
  assert.doesNotMatch(script, /localStorage\.clear\(/);
  assert.doesNotMatch(script, /innerHTML\s*=/);
});

test('Color Studio styles load after Midnight Forge and script is injected into iframe', () => {
  assert.ok(app.includes('blocksmith-ui-colors.css?v=1'));
  assert.ok(app.includes('blocksmith-ui-colors.js?v=1'));
  assert.ok(app.indexOf('blocksmith-midnight-forge-style') < app.indexOf('blocksmith-ui-colors-style'));
  assert.ok(app.indexOf('blocksmith-cli-accounts-script') < app.indexOf('blocksmith-ui-colors-script'));
});
