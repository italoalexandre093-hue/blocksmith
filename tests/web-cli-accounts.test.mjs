import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
const get=(relative)=>readFileSync(new URL(relative,import.meta.url),'utf8');
const ui=get('../public/assets/blocksmith-cli-accounts.js');
const css=get('../public/assets/blocksmith-cli-accounts.css');
const legacy=get('../public/assets/aistudio/blocksmith-app-ajustado_aadf2d67.html');
const app=get('../src/App.tsx');
const antigravity=get('../public/assets/brands/antigravity-color.svg');
const qoder=get('../public/assets/brands/qoder-color.svg');
const license=get('../public/assets/brands/LOBE_ICONS_LICENSE.txt');
test('CLI account extension parses and includes four supported local tools',()=>{
 assert.doesNotThrow(()=>new Script(ui));
 for(const name of ["claude","codex","antigravity","qoder"])
  assert.ok(ui.includes(name+':{'),name);
 assert.ok(ui.includes("keys=['claude','codex','antigravity','qoder']"));
 assert.ok(ui.includes("addQuickButtons();addSettingsCards();"));
});
test('model picker shows exactly 4 connectors and +, never the three obsolete provider tabs, while keeping Low',()=>{
 const start=ui.indexOf('function addQuickButtons(){'),end=ui.indexOf('function addSettingsCards(){',start);
 assert.ok(start>=0&&end>start);
 const legacyTabs=Array.from({length:3},()=>({
   hidden:false,inert:false,tabIndex:0,attributes:{},
   setAttribute(name,value){this.attributes[name]=value;}
 }));
 const plus={id:'plusBtn',hidden:false};
 const bar={
   inserted:null,attributes:{},
   querySelectorAll(selector){assert.equal(selector,':scope > .pb');return legacyTabs;},
   insertBefore(wrap,next){assert.equal(next,plus);this.inserted=wrap;},
   setAttribute(name,value){this.attributes[name]=value;}
 };
 function element(tag,cls){
   return {
     tag,className:cls,children:[],attributes:{},
     appendChild(child){this.children.push(child);},
     setAttribute(name,value){this.attributes[name]=value;},
     addEventListener(){}
   };
 }
 const catalog={claude:{title:'Claude Code'},codex:{title:'ChatGPT Codex'},
   antigravity:{title:'Google Antigravity'},qoder:{title:'Qoder'}};
 const sandbox={
   Array,
   $:id=>id==='pop'?{querySelector:sel=>sel==='.prov'?bar:null}:id==='plusBtn'?plus:null,
   el:element, keys:['claude','codex','antigravity','qoder'],catalog,
   brand:key=>({brand:key})
 };
 runInNewContext(ui.slice(start,end)+'\naddQuickButtons();',sandbox);
 assert.ok(bar.inserted,'connector group must remain visible');
 assert.deepEqual(Array.from(bar.inserted.children,child=>child.attributes['data-tool']),
  ['claude','codex','antigravity','qoder']);
 assert.equal(plus.hidden,false,'plus connector launcher must remain');
 assert.equal(bar.attributes['data-deduplicated-providers'],'true');
 for(const tab of legacyTabs){
   assert.equal(tab.hidden,true);
   assert.equal(tab.inert,true);
   assert.equal(tab.tabIndex,-1);
   assert.equal(tab.attributes['aria-hidden'],'true');
 }
 assert.ok(css.includes('#app.app #pop .prov > .pb { display:none !important; }'));
 assert.match(legacy,/<div class="eff">/);
 assert.match(legacy,/id="trk" role="slider"/);
 assert.doesNotMatch(css,/\.eff.*display:none/);
 assert.doesNotMatch(css,/\.trk.*display:none/);
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
test('Old mocked installer buttons are superseded and Models untouched',()=>{
 assert.ok(ui.includes("e.stopImmediatePropagation();showHub(key);"));
 assert.ok(ui.includes("#plusBtn,#cliInstallClaude,#cliInstallCodex"));
 assert.ok(ui.includes("data-tool"));
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
