import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const web = read('../public/assets/blocksmith-web-models.js');
const history = read('../public/assets/blocksmith-web-history.js');
const server = read('../server.js');
const app = read('../src/App.tsx');

test('web models extension parses and includes full model manager', () => {
  assert.doesNotThrow(() => new vm.Script(web));
  for (const term of ['webSettingsModels', 'webSettingsCards', 'webSettingsAdd',
    'webModelForm', 'webProvider', 'webBaseUrl', 'webModelIds',
    'webLoadModels', 'webAvailable', 'webModalSave', 'renderModels', 'sendWebChat']) {
    assert.ok(web.includes(term), term);
  }
});


test('Models management is only available inside Settings', () => {
  assert.ok(web.includes('data-settings-tab="openai"'));
  assert.ok(web.includes('data-settings-pane="openai"'));
  assert.ok(web.includes("oldTab.textContent='Models'"));
  assert.ok(web.includes("$('webSettingsAdd').addEventListener('click',openModal)"));
  assert.ok(web.includes("renderCollection($('webSettingsCards'))"));
  for (const oldElement of ['web-models-nav', 'webModelsView', 'webModelsContent',
    'webModelsBack', 'webModelsAddTop', 'webSettingsOpen', 'showModels']) {
    assert.ok(!web.includes(oldElement), 'Unexpected standalone Models screen: ' + oldElement);
  }
  assert.ok(web.includes('Configurações → Models'));
  assert.ok(web.includes("var target=e.target.closest&&e.target.closest('#modelBtn')"),
    'Chat model selection must remain available');
});

test('web replaces demo send handlers with real chat calls', () => {
  assert.ok(web.includes("e.stopImmediatePropagation();sendWebChat();"));
  assert.ok(web.includes("fetch('/api/ai/'+action"));
  assert.ok(web.includes("localStorage.setItem(STORE"));
  assert.ok(web.includes("sessionStorage.setItem"));
});

test('web never persists API keys into chat history or localStorage', () => {
  assert.ok(web.includes("saveKey(c.provider,c.baseUrl,c.key)"));
  assert.ok(web.includes("sessionStorage.setItem"));
  assert.ok(!web.includes("localStorage.setItem('apiKey'"));
  assert.ok(history.includes('blocksmith-web-conversations-v1'));
});

test('provider URLs are fixed server-side for hosted proxy', () => {
  assert.ok(server.includes("AI_HOSTS=Object.freeze"));
  for (const hostname of ['api.openai.com', 'api.deepseek.com',
    'openrouter.ai', 'api.nightrouter.ai', 'radoxai.com', 'api.anthropic.com']) {
    assert.ok(server.includes(hostname), hostname);
  }
  assert.ok(server.includes("req.get('x-blocksmith-provider-key')"));
  assert.ok(!server.includes("fetch(req.body.url"));
});

test('three supported API formats have distinct message parsing', () => {
  assert.ok(server.includes("path='/chat/completions'"));
  assert.ok(server.includes("path='/responses'"));
  assert.ok(server.includes("path='/messages'"));
});

test('React web shell loads history, models and styles', () => {
  assert.ok(app.includes('blocksmith-web-history.js'));
  assert.ok(app.includes('blocksmith-web-models.js'));
  assert.ok(app.includes('blocksmith-web-models.css'));
});
