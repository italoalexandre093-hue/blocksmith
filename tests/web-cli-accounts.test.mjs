import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
const get=(relative)=>readFileSync(new URL(relative,import.meta.url),'utf8');
const ui=get('../public/assets/blocksmith-cli-accounts.js');
const css=get('../public/assets/blocksmith-cli-accounts.css');
const app=get('../src/App.tsx');
const antigravity=get('../public/assets/brands/antigravity-color.svg');
const qoder=get('../public/assets/brands/qoder-color.svg');
const license=get('../public/assets/brands/LOBE_ICONS_LICENSE.txt');
test('CLI account extension parses and includes four supported local tools',()=>{
 assert.doesNotThrow(()=>new Script(ui));
 for(const name of ["claude","codex","antigravity","qoder"])
  assert.ok(ui.includes(name+':{'),name);
 assert.ok(ui.includes("keys=['claude','codex','antigravity','qoder']"));
 assert.ok(ui.includes("addSettingsCards();"));
 assert.ok(!ui.includes("addQuickButtons();"));
 assert.ok(!ui.includes("cli-quick-picker"));
});
test('Brand icon SVG files are real, self-hosted vectors and license retained',()=>{
 for(const [name,asset] of [['antigravity',antigravity],['qoder',qoder]]){
  assert.ok(asset.includes('<svg'),name);
  assert.ok(asset.includes('<title>'),name);
  assert.ok(asset.includes('viewBox'),name);
  assert.ok(ui.includes('/assets/brands/'+name+'-color.svg'));
 }
 assert.match(license,/MIT License/);
 assert.match(license,/Copyright \(c\) 2023 LobeHub/);
});
test('Sign-in URLs only point to official domains',()=>{
 assert.ok(ui.includes("https://antigravity.google.com/"));
 assert.ok(ui.includes("https://qoder.com/users/sign-in"));
 assert.ok(ui.includes("https://antigravity.google/download"));
 assert.ok(ui.includes("https://qoder.com/download"));
 assert.ok(ui.includes("u.protocol!=='https:'"));
 assert.ok(ui.includes("Destino não autorizado."));
});
test('Antigravity and Qoder guide login through official Windows apps without CLI',()=>{
 assert.match(ui,/command:''/);
 assert.doesNotMatch(ui,/command:'agy'/);
 assert.doesNotMatch(ui,/command:'qoder'/);
 assert.match(ui,/Faça login com Google diretamente no aplicativo oficial/);
 assert.match(ui,/aplicativo oficial Qoder para Windows/);
 assert.match(ui,/if\(cfg\.command\)\{/);
 assert.match(ui,/command:'codex login'/);
 assert.match(ui,/command:'claude auth login'/);
});
test('Never claim a local CLI is connected or installed without verification',()=>{
 assert.match(ui,/Status: não verificado/);
 assert.match(ui,/não acessa nem valida sessões locais/);
 assert.doesNotMatch(ui,/localStorage\.setItem/);
 assert.doesNotMatch(ui,/sessionStorage\.setItem/);
 assert.doesNotMatch(ui,/cliInstalled\[key\]\s*=\s*true/);
 assert.doesNotMatch(ui,/eval\(/);
});
test('Old mocked installer buttons are superseded and Models picker has no CLI quick icons',()=>{
 assert.ok(ui.includes("e.stopImmediatePropagation();showHub(key);"));
 assert.ok(ui.includes("#plusBtn,#cliInstallClaude,#cliInstallCodex"));
 assert.ok(ui.includes("data-cli-connector"));
 assert.ok(ui.includes("cliConfigure-"));
 assert.ok(app.includes('blocksmith-web-history.js'));
 assert.ok(app.includes('blocksmith-web-models.js'));
});
test('Web shell loads both brand assets and account UI',()=>{
 assert.ok(app.includes('blocksmith-cli-accounts-style'));
 assert.ok(app.includes('blocksmith-cli-accounts-script'));
 assert.ok(app.includes('blocksmith-cli-accounts.js?v=1'));
 assert.ok(app.includes('blocksmith-cli-accounts.css?v=1'));
 assert.ok(css.includes('blocksmith-tool-overlay'));
 assert.ok(css.includes('blocksmith-tool-choice'));
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
