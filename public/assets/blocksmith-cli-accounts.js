(function(){
'use strict';
/* Browser bridge to real, external CLI login. No spoofed login callbacks, token
 * interception, or Railway-side CLI execution. */
var $=function(id){return document.getElementById(id);};
if(!$('app')||!$('plusBtn'))return;
var logos={
 antigravity:'/assets/brands/antigravity-color.svg',
 qoder:'/assets/brands/qoder-color.svg'
};
var catalog={
 claude:{
  title:'Claude Code',hint:'Anthropic · CLI',description:'Assistente de programação Claude Code no computador.',
  install:'https://code.claude.com/docs/en/quickstart',docs:'https://code.claude.com/docs/en/quickstart',account:'https://claude.ai/',
  command:'claude auth login',steps:[
   'Instale o Claude Code no Windows seguindo o instalador oficial.',
   'Abra PowerShell ou o terminal do Claude Code.',
   'Execute o comando de login. A autenticação abre o fluxo oficial da Anthropic.',
   'Confirme o resultado no próprio terminal. Este site não possui acesso à sessão local.'
  ]
 },
 codex:{
  title:'ChatGPT Codex',hint:'OpenAI · CLI',description:'Codex CLI com login pela conta ChatGPT no seu computador.',
  install:'https://developers.openai.com/codex/cli/',docs:'https://developers.openai.com/codex/cli/',account:'https://chatgpt.com/',
  command:'codex login',steps:[
   'Instale o Codex CLI seguindo as instruções oficiais.',
   'Abra PowerShell e confirme que o comando codex está disponível.',
   'Execute codex login e conclua a autenticação no navegador.',
   'Volte ao terminal e confira o resultado. O Railway não consegue validar a sessão do Windows.'
  ]
 },
 antigravity:{
  title:'Google Antigravity',hint:'Google · App + CLI',description:'Use a conta Google pelo aplicativo Antigravity ou pela CLI oficial agy.',
  install:'https://antigravity.google/download',docs:'https://antigravity.google/docs/install/',account:'https://antigravity.google.com/',
  command:'agy',steps:[
   'Instale o Antigravity CLI ou o aplicativo Windows a partir do site oficial.',
   'Abra o PowerShell no seu computador e execute agy. Se não houver sessão local, ele abrirá seu navegador.',
   'Entre com sua conta Google no fluxo OAuth oficial e retorne ao terminal.',
   'A CLI reutiliza credenciais locais quando disponíveis. A autenticação não é importada pelo site Railway.'
  ]
 },
 qoder:{
  title:'Qoder',hint:'Qoder · App + CLI',description:'Agente de código Qoder com autenticação oficial por navegador ou token pessoal na CLI.',
  install:'https://qoder.com/download',docs:'https://docs.qoder.com/cli/authentication',account:'https://qoder.com/users/sign-in',
  command:'qoder',steps:[
   'Instale o Qoder CLI (Windows) pelo download oficial.',
   'Abra PowerShell e execute qoder.',
   'No prompt interativo do Qoder, digite /login (ou /signin).',
   'Escolha Login with Qoder Platform para autenticar pelo navegador e confirme no próprio terminal.'
  ],after:'/login'
 }
};
function brand(key){
 if(logos[key]){
  var img=document.createElement('img');
  img.src=logos[key];img.alt='';img.setAttribute('aria-hidden','true');
  img.decoding='async';img.loading='eager';
  return img;
 }
 var previous=document.querySelector('svg[data-brand="'+(key==='codex'?'openai':'claude')+'"]');
 if(previous){var copy=previous.cloneNode(true);copy.removeAttribute('data-brand');return copy;}
 var token=document.createElement('span');token.textContent=key==='codex'?'◎':'✳';token.setAttribute('aria-hidden','true');return token;
}
function text(el,str){el.textContent=str;return el;}
function el(tag,className,str){
 var n=document.createElement(tag);if(className)n.className=className;if(str!==undefined)n.textContent=str;return n;
}
var overlay=el('div','blocksmith-tool-overlay');
overlay.id='blocksmithToolOverlay';overlay.setAttribute('aria-hidden','true');
overlay.innerHTML='<div class="blocksmith-tool-dialog" role="dialog" aria-modal="true" aria-labelledby="blocksmithToolTitle" tabindex="-1">'+
 '<div class="blocksmith-tool-head"><div><strong id="blocksmithToolTitle">Connect developer tools</strong><p>Configure CLI tools and sign in safely on your own device.</p></div>'+
 '<button class="blocksmith-tool-close" id="blocksmithToolClose" type="button" title="Fechar" aria-label="Fechar">✕</button></div>'+
 '<div class="blocksmith-tool-body"><div class="blocksmith-tool-list" id="blocksmithToolList"></div>'+
 '<div class="blocksmith-tool-details" id="blocksmithToolDetails"></div></div></div>';
document.body.appendChild(overlay);
var keys=['claude','codex','antigravity','qoder'],current='antigravity',previousFocus=null;
var feedback=null;
function openExternal(url){
 // Only fixed public, official https destinations from the catalog.
 try{
  var u=new URL(url);
  if(u.protocol!=='https:' || ![
   'claude.ai','code.claude.com','developers.openai.com','chatgpt.com',
   'antigravity.google','antigravity.google.com','qoder.com','docs.qoder.com'
  ].includes(u.hostname))throw Error('Destino não autorizado.');
  var opened=window.open(u.href,'_blank','noopener,noreferrer');
  if(!opened)throw Error('Seu navegador bloqueou a abertura. Permita pop-ups para este site.');
 }catch(err){if(feedback)feedback.textContent=err.message||'Não foi possível abrir o endereço oficial.';}
}
function closeHub(){
 overlay.classList.remove('open');overlay.setAttribute('aria-hidden','true');
 document.body.style.removeProperty('overflow');
 if(previousFocus&&previousFocus.isConnected)previousFocus.focus();
}
function showHub(key){
 if(catalog[key])current=key;
 previousFocus=document.activeElement;
 var pop=$('pop');if(pop)pop.style.display='none';
 overlay.classList.add('open');overlay.setAttribute('aria-hidden','false');
 render();
 $('blocksmithToolClose').focus();
}
function copyToClipboard(value){
 if(navigator.clipboard&&navigator.clipboard.writeText)
  return navigator.clipboard.writeText(value);
 var temp=el('textarea');temp.value=value;temp.setAttribute('readonly','');temp.style.cssText='position:fixed;opacity:0;left:-10000px';
 document.body.appendChild(temp);temp.select();var ok=document.execCommand('copy');temp.remove();
 return ok?Promise.resolve():Promise.reject(Error('Não foi possível copiar. Selecione o comando manualmente.'));
}
function selectTool(key){if(!catalog[key])return;current=key;render();}
function render(){
 var list=$('blocksmithToolList');list.textContent='';
 keys.forEach(function(key){
  var cfg=catalog[key],choice=el('button','blocksmith-tool-choice'+(current===key?' selected':''));
  choice.type='button';choice.setAttribute('data-cli-connector',key);choice.setAttribute('aria-pressed',current===key?'true':'false');
  choice.appendChild(brand(key));
  var lines=el('span');lines.appendChild(el('strong','',cfg.title));lines.appendChild(el('small','',cfg.hint));
  choice.appendChild(lines);choice.addEventListener('click',function(){selectTool(key);});list.appendChild(choice);
 });
 var cfg=catalog[current],area=$('blocksmithToolDetails');area.textContent='';
 var heading=el('div','blocksmith-tool-heading');heading.appendChild(brand(current));
 var names=el('div');names.appendChild(el('h3','',cfg.title));names.appendChild(el('span','blocksmith-tool-tag','Login oficial no dispositivo'));heading.appendChild(names);area.appendChild(heading);
 area.appendChild(el('p','blocksmith-tool-description',cfg.description));
 var steps=el('ol','blocksmith-tool-steps');
 cfg.steps.forEach(function(s){steps.appendChild(el('li','',s));});area.appendChild(steps);
 var shell=el('div','blocksmith-tool-code');shell.appendChild(el('code','',cfg.command+(cfg.after?'\n'+cfg.after:'')));
 var copy=el('button','blocksmith-tool-copy','Copiar');copy.type='button';copy.setAttribute('data-cli-copy',current);
 copy.addEventListener('click',function(){copyToClipboard(cfg.command).then(function(){feedback.textContent='Comando copiado. Execute no terminal local.';},function(){feedback.textContent='Copie manualmente o comando acima.';});});
 shell.appendChild(copy);area.appendChild(shell);
 if(cfg.after)area.appendChild(el('p','blocksmith-tool-description','Depois de executar qoder, digite /login dentro do programa (não diretamente no PowerShell).'));
 var actions=el('div','blocksmith-tool-actions');
 var install=el('button','blocksmith-tool-button main','Abrir download oficial');install.type='button';install.setAttribute('data-cli-install',current);
 install.addEventListener('click',function(){openExternal(cfg.install);});
 var signin=el('button','blocksmith-tool-button','Abrir conta oficial');signin.type='button';signin.setAttribute('data-cli-signin',current);
 signin.addEventListener('click',function(){openExternal(cfg.account);if(feedback)feedback.textContent='Conclua o login no site ou CLI oficial. O Blocksmith Web não recebe tokens de autenticação.';});
 var docs=el('button','blocksmith-tool-button','Guia de login');docs.type='button';docs.setAttribute('data-cli-docs',current);
 docs.addEventListener('click',function(){openExternal(cfg.docs);});
 actions.appendChild(install);actions.appendChild(signin);actions.appendChild(docs);area.appendChild(actions);
 area.appendChild(el('div','blocksmith-tool-alert','Status: não verificado. O site Railway não executa agy, qoder, codex ou claude do Windows e não recebe seus tokens OAuth. O login da CLI é realizado diretamente pelo programa oficial.'));
 feedback=el('div','blocksmith-tool-feedback');feedback.setAttribute('role','status');area.appendChild(feedback);
}
$('blocksmithToolClose').addEventListener('click',closeHub);
overlay.addEventListener('click',function(e){if(e.target===overlay)closeHub();});
overlay.addEventListener('keydown',function(e){
 if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeHub();return;}
 if(e.key!=='Tab')return;
 var focusable=Array.prototype.slice.call(overlay.querySelectorAll('button:not([disabled])')).filter(function(b){return b.offsetParent!==null;});
 if(!focusable.length)return;
 var first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
 else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
});
function addQuickButtons(){
 var bar=$('pop')&&$('pop').querySelector('.prov');
 var plus=$('plusBtn');if(!bar||!plus)return;
 var wrap=el('div','cli-quick-picker');wrap.setAttribute('role','group');wrap.setAttribute('aria-label','CLI tools');
 keys.forEach(function(key){
  var button=el('button','cli-quick-brand');button.type='button';button.setAttribute('data-tool',key);button.setAttribute('data-short',catalog[key].title);
  button.setAttribute('aria-label','Configurar '+catalog[key].title);button.title='Configurar '+catalog[key].title;
  button.appendChild(brand(key));button.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();showHub(key);});
  wrap.appendChild(button);
 });
 bar.insertBefore(wrap,plus);
}
function addSettingsCards(){
 var pane=document.querySelector('[data-settings-pane="clis"]');if(!pane)return;
 var old=Array.from(pane.querySelectorAll('.install-card'));
 var reference=old.length?old[old.length-1]:null;
 ['antigravity','qoder'].forEach(function(key){
  var cfg=catalog[key];if($('cliCard-'+key))return;
  var card=el('div','install-card blocksmith-cli-new');card.id='cliCard-'+key;
  var icon=el('span','install-ic');icon.appendChild(brand(key));card.appendChild(icon);
  var description=el('div','install-body');description.appendChild(el('strong','',cfg.title));
  description.appendChild(el('small','',key==='antigravity'?'Google OAuth na CLI oficial agy.':'Login pelo navegador via qoder /login.'));
  card.appendChild(description);
  var btn=el('button','','Configurar');btn.id='cliConfigure-'+key;btn.type='button';
  btn.addEventListener('click',function(){showHub(key);});card.appendChild(btn);
  if(reference&&reference.parentNode){reference.insertAdjacentElement('afterend',card);reference=card;}
  else pane.appendChild(card);
 });
 var note=el('div','web-model-legacy-notice','Antigravity e Qoder entram com suas contas oficiais. No site Web, estes botões abrem a instalação e as instruções de autenticação; o uso da CLI no chat exige conexão local pelo aplicativo Windows.');
 pane.appendChild(note);
}
addQuickButtons();addSettingsCards();
/* Intercept legacy controls before demo installers can claim success. */
document.addEventListener('click',function(e){
 var target=e.target.closest&&e.target.closest('#plusBtn,#cliInstallClaude,#cliInstallCodex');
 if(!target)return;
 var key=target.id==='cliInstallClaude'?'claude':target.id==='cliInstallCodex'?'codex':'antigravity';
 e.preventDefault();e.stopImmediatePropagation();showHub(key);
},true);
window.BlocksmithCliAccounts={open:function(key){showHub(key||'antigravity');},list:function(){return keys.slice();}};
})();