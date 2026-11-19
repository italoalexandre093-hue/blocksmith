import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const get = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const css = get('../public/assets/blocksmith-pro-workspace.css');
const js = get('../public/assets/blocksmith-pro-workspace.js');
const app = get('../src/App.tsx');
const colorCss = get('../public/assets/blocksmith-ui-colors.css');
const original = get('../public/assets/aistudio/blocksmith-app-ajustado_aadf2d67.html');

test('Professional workspace JavaScript parses and enhancement targets exist', () => {
  assert.doesNotThrow(() => new Script(js));
  for (const selector of ['id="app"', 'id="sd"', 'id="rp"', 'id="msgs"', 'id="inp"', 'id="comp"', 'id="settingsBtn"', 'id="newChat"'])
    assert.ok(original.includes(selector), 'Missing original DOM target ' + selector);
  assert.ok(js.includes('bsProfessionalTopbar'));
  assert.ok(js.includes('bsProfessionalWelcome'));
  assert.ok(js.includes('data-workspace-design'));
  assert.ok(js.includes("editor.setAttribute('data-ph'"));
});

test('Professional design spans all primary screens, respects palette tokens', () => {
  for (const selector of ['.sd', '.rp', '.brand', '.newc', '.nav.act', '.msgs', '.comp', '.send',
    '.panel-view.on', '.settings-tab.act', '.web-model-card', '.web-model-dialog', '.blocksmith-tool-dialog'])
    assert.ok(css.includes(selector), 'Unstyled screen ' + selector);
  for (const token of ['--ui-accent', '--ui-accent-rgb', '--ui-bg', '--ui-side'])
    assert.ok(css.includes(token) || js.includes(token), 'Missing palette integration ' + token);
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(css.includes('focus-visible'));
  assert.equal((css.match(/\{/g) || []).length, (css.match(/\}/g) || []).length);
  assert.ok(colorCss.includes('.visual-color-choice'));
});

test('Quick-start cards only prepare a draft and use existing app controls', () => {
  for (const label of ['Criar um sistema', 'Criar uma thumbnail', 'Planejar meu jogo'])
    assert.ok(js.includes(label));
  assert.ok(js.includes("document.querySelector('#newChat span')"));
  assert.doesNotMatch(js, /action\('Novo chat'/);
  assert.ok(js.includes("document.getElementById('settingsBtn')"));
  assert.ok(js.includes("new Event('input', {bubbles:true})"));
  assert.ok(js.includes('MutationObserver'));
  assert.ok(js.includes('messages.removeChild(welcome)'));
  assert.doesNotMatch(js, /fetch\(/);
  assert.doesNotMatch(js, /localStorage/);
  assert.doesNotMatch(js, /innerHTML\s*=/);
  assert.doesNotMatch(js, /eval\(/);
});

test('React iframe loads professional styles after color studio and script after UI modules', () => {
  assert.ok(app.includes('blocksmith-pro-workspace.css?v=1'));
  assert.ok(app.includes('blocksmith-pro-workspace.js?v=1'));
  assert.ok(app.indexOf("blocksmith-ui-colors-style") < app.indexOf("blocksmith-pro-workspace-style"));
  assert.ok(app.indexOf("blocksmith-ui-colors-script") < app.indexOf("blocksmith-pro-workspace-script"));
  assert.ok(app.indexOf("blocksmith-cli-accounts-script") < app.indexOf("blocksmith-pro-workspace-script"));
});

test('Visual language stays application-oriented and avoids false connection status', () => {
  assert.ok(js.includes('Interface web do Blocksmith'));
  assert.ok(js.includes('Descreva o que você quer criar no Blocksmith'));
  assert.ok(js.includes('Prepare a draft rather than pretending a provider is connected'));
  assert.ok(css.includes('.bs-welcome'));
  assert.ok(css.includes('.bs-topbar'));
  assert.ok(css.includes('.bs-shortcut'));
});
