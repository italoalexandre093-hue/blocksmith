(function(){
'use strict';
// Browser-only enhancement for the legacy web shell; the Electron app remains separate.
var $=function(id){return document.getElementById(id);};
if(!$('app')||!$('settingsView')||!window.chats)return;
var STORE='blocksmith-web-models-v1',SELECTED='blocksmith-web-selected-model-v1';
var LABELS={
 'compatible':'OpenAI Compatible','anthropic-compatible':'Anthropic Compatible',
 'openai':'OpenAI','anthropic':'Anthropic','deepseek':'DeepSeek',
 'openrouter':'OpenRouter','nightrouter':'NightRouter.ai','radox':'Radox AI'
};
var BASES={
 openai:'https://api.openai.com/v1',anthropic:'https://api.anthropic.com/v1',
 deepseek:'https://api.deepseek.com',openrouter:'https://openrouter.ai/api/v1',
 nightrouter:'https://api.nightrouter.ai/v1',radox:'https://radoxai.com/v1'
};
var models=[],selected='',search='',modalOpen=false,validatedIds=null;
function escape(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function node(tag,cls,text){var x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x;}
function notice(s,isBad){
 var n=$('web-model-feedback');if(n){n.textContent=s;n.style.color=isBad?'#f1aaa2':'#94b8a5';}
}
try{
 var saved=JSON.parse(localStorage.getItem(STORE)||'[]');
 if(Array.isArray(saved))models=saved.filter(function(x){return x&&LABELS[x.provider]&&typeof x.modelId==='string'&&x.modelId.length>0&&x.modelId.length<257;}).slice(0,200);
 selected=localStorage.getItem(SELECTED)||'';
}catch(e){models=[];selected='';}
function modelKey(item){return [item.provider,item.apiType||'chat',item.baseUrl||'',item.modelId].join('|');}
function selectedModel(){return models.find(function(m){return modelKey(m)===selected;})||null;}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(models));localStorage.setItem(SELECTED,selected);}catch(e){notice('Armazenamento local indisponível. Exporte os chats antes de fechar a aba.',true);}}
function sessionKey(provider,base){return 'blocksmith-web-api-key:'+(provider||'')+':'+(base||'');}
function keyFor(item){try{return sessionStorage.getItem(sessionKey(item.provider,item.baseUrl||''))||'';}catch(e){return '';}}
function saveKey(provider,base,value){try{if(value)sessionStorage.setItem(sessionKey(provider,base),value);else sessionStorage.removeItem(sessionKey(provider,base));}catch(e){}}
function updateChip(){
 var m=selectedModel();
 if($('chipName'))$('chipName').textContent=m?m.modelId:'Selecionar modelo';
 if($('chipEff'))$('chipEff').textContent=m?' · '+LABELS[m.provider]:'';
}
var baseRenderChip=window.renderChip;
if(typeof baseRenderChip==='function')window.renderChip=function(){baseRenderChip();updateChip();};
// The embedded template still owns old provider tabs and a demo effort slider.
// Keep their DOM nodes for its original event initialization, but make the
// hosted web selector exclusively about configured API models.
var picker=$('pop');
if(picker){
 picker.setAttribute('data-web-model-picker','true');
 picker.setAttribute('aria-label','Selecionar modelo de IA');
 ['.prov','.eff','.trk'].forEach(function(selector){
  var old=picker.querySelector(selector);
  if(old){old.setAttribute('aria-hidden','true');old.inert=true;old.hidden=true;}
 });
 var heading=node('div','web-model-picker-heading','Selecionar modelo');
 picker.insertBefore(heading,picker.firstChild);
}
if($('srch')){$('srch').setAttribute('data-ph','Pesquisar modelos cadastrados...');$('srch').setAttribute('aria-label','Pesquisar modelos cadastrados');}
if($('chipIc')){$('chipIc').style.display='none';$('chipIc').setAttribute('aria-hidden','true');}
// Models is managed exclusively in Configurações → Models.
// The chat's model picker remains available for selecting a configured model.
var oldTab=document.querySelector('[data-settings-tab="openai"]');
var settingsPane=document.querySelector('[data-settings-pane="openai"]');
if(oldTab)oldTab.textContent='Models';
if(settingsPane){
 settingsPane.innerHTML='<div id="webSettingsModels"><div class="settings-pane-title">Models</div><div class="settings-pane-sub">Gerencie seus provedores, modelos e seleção para o chat em um único lugar. As chaves de API permanecem somente nesta sessão do navegador.</div><div class="web-settings-actions"><button type="button" class="web-btn web-btn-primary" id="webSettingsAdd">+ Add model</button></div><div id="web-model-feedback" role="status" aria-live="polite"></div><div id="webSettingsCards"></div></div>';
 $('webSettingsAdd').addEventListener('click',openModal);
}
var overlay=node('div','web-model-dialog-backdrop');overlay.id='webModelBackdrop';overlay.setAttribute('role','presentation');
overlay.innerHTML='<div class="web-model-dialog" role="dialog" aria-modal="true" aria-labelledby="webModalTitle"><div class="web-dialog-title"><span id="webModalTitle">Add model</span><button class="web-btn" type="button" id="webModalClose" aria-label="Fechar">✕</button></div><form id="webModelForm"><div class="web-dialog-body">'+
 '<label class="web-dialog-field">Provider<select id="webProvider" required></select></label>'+
 '<label class="web-dialog-field" id="webApiTypeRow">API type<select id="webApiType"><option value="chat">Chat Completions API</option><option value="responses">Responses API</option><option value="anthropic">Anthropic Messages API</option></select></label>'+
 '<label class="web-dialog-field" id="webBaseRow">Base URL<input id="webBaseUrl" placeholder="https://api.exemplo.com/v1" autocomplete="url"></label>'+
 '<label class="web-dialog-field">API key<div class="web-row"><input id="webApiKey" type="password" placeholder="Insira sua API key" autocomplete="off"><button type="button" class="web-btn" id="webToggleKey" aria-label="Mostrar chave">👁</button></div></label>'+
 '<p class="web-note">A chave fica somente na sessão deste navegador. O Railway não a grava.</p>'+
 '<div class="web-dialog-field">Model IDs <button type="button" class="web-btn" id="webAddId" style="float:right">+ Add Model ID</button></div><div id="webModelIds"></div>'+
 '<div class="web-row" style="margin-top:12px"><button type="button" class="web-btn" id="webLoadModels">Buscar modelos</button><select id="webAvailable" aria-label="Modelos da API" style="display:none"><option value="">Selecione...</option></select></div>'+
 '<div id="webModalFeedback" class="web-error" role="status"></div></div>'+
 '<div class="web-dialog-footer"><button type="button" class="web-btn" id="webModalCancel">Cancel</button><button type="submit" class="web-btn web-btn-primary" id="webModalSave">Adicionar modelos</button></div></form></div>';
document.body.appendChild(overlay);
var providerSelect=$('webProvider');
Object.keys(LABELS).forEach(function(id){var option=node('option','',LABELS[id]);option.value=id;providerSelect.appendChild(option);});
function modalFeedback(msg,isGood){var s=$('webModalFeedback');s.textContent=msg;s.style.color=isGood?'#8fd7b4':'#f0a59d';}
function addId(value){
 var row=node('div','web-row');row.style.margin='7px 0';
 var field=node('input');field.className='web-model-id';field.type='text';field.maxLength=256;field.placeholder='Ex.: deepseek-chat';field.value=value||'';
 var remove=node('button','web-btn','🗑');remove.type='button';remove.title='Remover ID';
 remove.addEventListener('click',function(){row.remove();});
 row.appendChild(field);row.appendChild(remove);$('webModelIds').appendChild(row);
}
function updateProvider(){
 var p=providerSelect.value,custom=p==='compatible'||p==='anthropic-compatible';
 $('webBaseRow').style.display=custom?'block':'none';
 $('webBaseUrl').value=custom?'':BASES[p]||'';
 $('webApiTypeRow').style.display=p==='anthropic'||p==='anthropic-compatible'?'none':'block';
 $('webApiType').value=p==='anthropic'||p==='anthropic-compatible'?'anthropic':'chat';
 $('webAvailable').style.display='none';$('webAvailable').innerHTML='<option value="">Selecione...</option>';
 validatedIds=null;
 $('webApiKey').value=keyFor({provider:p,baseUrl:custom?$('webBaseUrl').value:''});
 modalFeedback(custom?'Provedores personalizados dependem de CORS do servidor escolhido.':'',true);
}
function openModal(){
 modalOpen=true;overlay.classList.add('on');
 $('webModelForm').reset();providerSelect.value='openrouter';
 $('webModelIds').textContent='';addId('');
 $('webApiKey').type='password';updateProvider();
 $('webProvider').focus();
}
function closeModal(){modalOpen=false;overlay.classList.remove('on');}
$('webModalClose').addEventListener('click',closeModal);
$('webModalCancel').addEventListener('click',closeModal);
overlay.addEventListener('click',function(e){if(e.target===overlay)closeModal();});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&modalOpen){e.stopImmediatePropagation();closeModal();}},true);
providerSelect.addEventListener('change',updateProvider);
$('webBaseUrl').addEventListener('change',function(){
 $('webApiKey').value=keyFor({provider:providerSelect.value,baseUrl:this.value.trim()});
});
$('webToggleKey').addEventListener('click',function(){var el=$('webApiKey');el.type=el.type==='password'?'text':'password';});
$('webAddId').addEventListener('click',function(){addId('');});
$('webAvailable').addEventListener('change',function(){
 if(this.value){
  var fields=Array.from(document.querySelectorAll('#webModelIds .web-model-id'));
  var empty=fields.find(function(x){return !x.value.trim();});
  if(empty)empty.value=this.value;else addId(this.value);
 }
});
function customUrl(p){var u=$('webBaseUrl').value.trim();return p==='compatible'||p==='anthropic-compatible'?u:'';}
function validateUrl(u){
 try{var url=new URL(u);
 return url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 }catch(e){return false;}
}
function currentApiConfig(){
 var p=providerSelect.value,u=customUrl(p),key=$('webApiKey').value.trim();
 if(u&&!validateUrl(u))throw Error('Use uma Base URL HTTPS válida, ou HTTP apenas para localhost.');
 if((p==='compatible'||p==='anthropic-compatible')&&!u)throw Error('Informe a Base URL do provedor compatível.');
 if(p!=='compatible'&&p!=='anthropic-compatible'&&!key)throw Error('Informe sua API key.');
 return {provider:p,baseUrl:u,key:key,apiType:$('webApiType').value};
}
async function providerCall(action,item,payload,key){
 var p=item.provider;
 if(p==='compatible'||p==='anthropic-compatible'){
  if(!validateUrl(item.baseUrl))throw Error('Base URL inválida.');
  var path=action==='models'?'/models':(item.apiType==='responses'?'/responses':item.apiType==='anthropic'?'/messages':'/chat/completions');
  var headers={'content-type':'application/json'};
  if(key){if(item.apiType==='anthropic'){headers['x-api-key']=key;headers['anthropic-version']='2023-06-01';}else headers.Authorization='Bearer '+key;}
  var options={method:action==='models'?'GET':'POST',headers:headers};
  if(action!=='models'){
   var messages=payload.messages,system=payload.system||'',model=payload.model;
   if(item.apiType==='anthropic')options.body=JSON.stringify({model,max_tokens:2048,messages:messages,system:system||undefined});
   else if(item.apiType==='responses')options.body=JSON.stringify({model,input:[...(system?[{role:'developer',content:system}]:[]),...messages],stream:false});
   else options.body=JSON.stringify({model,messages:[...(system?[{role:'system',content:system}]:[]),...messages],stream:false});
  }
  var direct;
  try{direct=await fetch(item.baseUrl.replace(/\/+$/,'')+path,options);}catch(e){throw Error('Conexão direta bloqueada ou indisponível (CORS). Verifique seu servidor compatível.');}
  if(!direct.ok)throw Error('O provedor retornou HTTP '+direct.status);
  var result=await direct.json();
  if(action==='models')return {models:(result.data||result.models||[]).map(function(x){return typeof x==='string'?x:x.id;})};
  var output='';
  if(item.apiType==='anthropic')output=(result.content||[]).filter(function(x){return x.type==='text';}).map(function(x){return x.text;}).join('\n');
  else if(item.apiType==='responses')output=result.output_text||(result.output||[]).flatMap(function(x){return x.content||[];}).map(function(x){return x.text||'';}).join('\n');
  else output=result.choices&&result.choices[0]&&result.choices[0].message&&result.choices[0].message.content||'';
  return {text:typeof output==='string'?output:JSON.stringify(output)};
 }
 var response=await fetch('/api/ai/'+action,{
  method:'POST',headers:{'content-type':'application/json','x-blocksmith-provider-key':key},
  body:JSON.stringify(Object.assign({provider:p},payload||{}))
 });
 var answer=await response.json().catch(function(){return {error:'Resposta inválida do servidor'};});
 if(!response.ok)throw Error(answer.error||'Erro HTTP '+response.status);
 return answer;
}
$('webLoadModels').addEventListener('click',async function(){
 var button=this;validatedIds=null;
 try{
  var c=currentApiConfig();
  button.disabled=true;modalFeedback('Consultando o provedor...',true);
  var response=await providerCall('models',{provider:c.provider,apiType:c.apiType,baseUrl:c.baseUrl},null,c.key);
  var items=(response.models||[]).filter(function(x){return typeof x==='string'&&x.length<=256;});
  if(!items.length)throw Error('O provedor retornou uma lista vazia.');
  validatedIds=items;
  var select=$('webAvailable');select.innerHTML='<option value="">Selecione um modelo...</option>';
  items.forEach(function(id){var o=node('option','',id);o.value=id;select.appendChild(o);});
  select.style.display='block';modalFeedback(items.length+' modelos recebidos. Você pode selecionar ou digitar IDs.',true);
 }catch(e){modalFeedback(e.message||'Falha na listagem.',false);}finally{button.disabled=false;}
});
$('webModelForm').addEventListener('submit',function(e){
 e.preventDefault();
 try{
  var c=currentApiConfig(),ids=Array.from(document.querySelectorAll('#webModelIds .web-model-id')).map(function(x){return x.value.trim();}).filter(Boolean);
  ids=Array.from(new Set(ids));
  if(!ids.length)throw Error('Adicione pelo menos um ID de modelo.');
  if(ids.some(function(x){return x.length>256;}))throw Error('ID muito longo.');
  var added=0;
  if(models.length+ids.length>200)throw Error('Limite de 200 modelos atingido.');
  ids.forEach(function(modelId){
   var item={provider:c.provider,apiType:c.apiType,baseUrl:c.baseUrl,modelId:modelId};
   if(!models.some(function(m){return modelKey(m)===modelKey(item);})){models.push(item);added++;}
   if(!selected)selected=modelKey(item);
  });
  if(models.length>200)throw Error('Limite de 200 modelos atingido.');
  saveKey(c.provider,c.baseUrl,c.key);persist();closeModal();renderModels();updateChip();
  notice(added+' modelos cadastrados'+(validatedIds?' (listagem consultada)':' (IDs ainda não validados)')+'.',false);
 }catch(err){modalFeedback(err.message||'Erro ao cadastrar.',false);}
});
function renderCollection(root){
 root.textContent='';
 if(!models.length){
  var empty=node('div','web-empty');empty.innerHTML='<div class="web-empty-icon">◇</div><strong>No custom models yet</strong><p>Select Add model to get started.</p>';
  root.appendChild(empty);return;
 }
 var grid=node('div','web-models-grid');
 models.forEach(function(m){
  var card=node('div','web-model-card');
  var name=node('strong','',m.modelId);
  var detail=node('small','',LABELS[m.provider]+' · '+(m.apiType==='responses'?'Responses API':m.apiType==='anthropic'?'Anthropic Messages':'Chat Completions'));
  var actions=node('div','web-actions');
  var use=node('button','web-btn '+(selected===modelKey(m)?'web-btn-primary':''),selected===modelKey(m)?'Selecionado':'Usar no chat');
  use.type='button';use.addEventListener('click',function(){selected=modelKey(m);persist();updateChip();renderModels();notice('Modelo ativo: '+m.modelId,false);});
  var remove=node('button','web-btn web-btn-danger','Remover');remove.type='button';
  remove.addEventListener('click',function(){
   if(!window.confirm('Remover '+m.modelId+' da biblioteca?'))return;
   models=models.filter(function(x){return modelKey(x)!==modelKey(m);});
   if(selected===modelKey(m))selected=models.length?modelKey(models[0]):'';
   persist();renderModels();updateChip();
  });
  actions.appendChild(use);actions.appendChild(remove);
  card.appendChild(name);card.appendChild(detail);card.appendChild(actions);grid.appendChild(card);
 });
 root.appendChild(grid);
}
function renderModels(){
 if($('webSettingsCards'))renderCollection($('webSettingsCards'));
}
function renderPopup(){
 var list=$('mlist');if(!list)return;
 list.textContent='';
 var found=models.filter(function(m){return (m.modelId+' '+LABELS[m.provider]).toLowerCase().includes(search);});
 if(!found.length){
  list.appendChild(node('div','web-model-legacy-notice',models.length?'Nenhum modelo corresponde à pesquisa.':'Nenhum modelo cadastrado. Adicione em Configurações → Models.'));
  var manage=node('button','web-btn','Abrir Configurações → Models');manage.type='button';
  manage.addEventListener('click',function(){
   if($('pop'))$('pop').style.display='none';
   if($('settingsBtn'))$('settingsBtn').click();
   var tab=document.querySelector('[data-settings-tab="openai"]');if(tab)tab.click();
  });
  list.appendChild(manage);return;
 }
 found.forEach(function(m){
  var button=node('button','web-popup-model',m.modelId);
  var sub=node('small','',LABELS[m.provider]);button.appendChild(sub);
  button.addEventListener('click',function(){selected=modelKey(m);persist();updateChip();$('pop').style.display='none';renderModels();});
  list.appendChild(button);
 });
}
function selectModelMenu(e){
 var target=e.target.closest&&e.target.closest('#modelBtn');
 if(!target)return;
 e.preventDefault();e.stopImmediatePropagation();
 var popup=$('pop');search='';if($('srch'))$('srch').textContent='';
 renderPopup();
 var opening=popup.style.display==='none';
 popup.style.display=opening?'block':'none';
 if($('modelBtn'))$('modelBtn').setAttribute('aria-expanded',opening?'true':'false');
}
document.addEventListener('click',selectModelMenu,true);
if($('srch'))$('srch').addEventListener('input',function(e){search=($('srch').textContent||'').toLowerCase();renderPopup();e.stopImmediatePropagation();},true);
function addChatMessage(key,cls,text){
 if(!window.chats[key])return;
 window.chats[key].m.push({cls:cls,t:text,fs:[]});
 if(window.cur===key){if(typeof window.renderMsgs==='function')window.renderMsgs();if($('msgs'))$('msgs').scrollTop=$('msgs').scrollHeight;}
}
function chatHistory(key){
 return (window.chats[key].m||[]).filter(function(x){return (x.cls==='a'||x.cls==='u')&&x.t;}).slice(-38).map(function(x){return {role:x.cls==='u'?'user':'assistant',content:String(x.t).slice(0,12000)};});
}
async function sendWebChat(){
 var key=window.cur,chat=window.chats[key],input=$('inp'),value=(input.textContent||'').trim(),m=selectedModel();
 if(!chat||chat.busy||!value)return;
 if(window.files&&window.files.length){addChatMessage(key,'a','Anexos ainda não são enviados pelo site. Use o Blocksmith Desktop para trabalhar com arquivos.');return;}
 if(!m){addChatMessage(key,'a','Abra Configurações → Models, adicione um modelo e selecione Usar no chat.');return;}
 var apiKey=keyFor(m);
 if(!apiKey&&m.provider!=='compatible'&&m.provider!=='anthropic-compatible'){
  addChatMessage(key,'a','A API key deste provedor não está nesta sessão. Abra Configurações → Models e cadastre novamente a chave.');return;
 }
 addChatMessage(key,'u',value);input.textContent='';
 if(typeof window.updSend==='function')window.updSend();
 chat.busy=true;if($('spin')&&window.cur===key)$('spin').style.visibility='visible';
 var system=String(($('settingSystemPrompt')&&$('settingSystemPrompt').value)||'Você é o Blocksmith, assistente de desenvolvimento de jogos Roblox.').slice(0,4000);
 if(window.mode==='plan')system+='\nResponda com um plano de implementação antes de sugerir alterações.';
 if(key==='thumbs')system+='\nVocê pode planejar e descrever thumbnails, mas esta interface web não gera arquivos de imagem.';
 if(key==='studio'||key==='chars')system+='\nVocê pode planejar scripts e modelos, mas esta interface web não executa Blender nem Roblox Studio localmente.';
 try{
  var result=await providerCall('chat',m,{model:m.modelId,apiType:m.apiType,messages:chatHistory(key),system:system},apiKey);
  addChatMessage(key,'a',result.text||'O provedor não retornou conteúdo.');
 }catch(e){addChatMessage(key,'a','Não foi possível obter resposta: '+(e.message||'erro desconhecido'));}
 finally{chat.busy=false;if($('spin')&&window.cur===key)$('spin').style.visibility='hidden';}
}
document.addEventListener('click',function(e){
 var t=e.target.closest&&e.target.closest('#send');
 if(t){e.preventDefault();e.stopImmediatePropagation();sendWebChat();}
},true);
document.addEventListener('keydown',function(e){
 if(e.target===$('inp')&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.stopImmediatePropagation();sendWebChat();}
},true);
var desktopButtons=['cliInstallClaude','cliInstallCodex','studioInstall','blenderInstall','plusBtn'];
desktopButtons.forEach(function(id){
 var b=$(id);if(!b)return;
 b.addEventListener('click',function(e){
  e.preventDefault();e.stopImmediatePropagation();
  var el=$('cliInstallStatus')||$('studioInstallStatus');
  if(el)el.textContent='Esta instalação exige o aplicativo Blocksmith Desktop no Windows. O Railway não executa ferramentas locais.';
  if(id==='plusBtn')window.alert('O gerenciador de CLI está disponível no Blocksmith Desktop Windows.');
 },true);
 if(id!=='plusBtn'){b.setAttribute('title','Requer Blocksmith Desktop Windows');var label=b.querySelector('span');if(label)label.textContent='Somente desktop';}
});
/* Persist non-sensitive preferences. API keys are deliberately excluded. */
var PREF='blocksmith-web-ui-preferences-v1';
try{
 var pref=JSON.parse(localStorage.getItem(PREF)||'{}');
 if(typeof pref.prompt==='string'&&$('settingSystemPrompt')){$('settingSystemPrompt').value=pref.prompt;if(window.settings)window.settings.systemPrompt=pref.prompt;}
 if(pref.theme==='light'||pref.theme==='dark')if(typeof window.applyTheme==='function')window.applyTheme(pref.theme);
 if(pref.checks&&typeof pref.checks==='object')Object.keys(pref.checks).forEach(function(id){
  var e=$(id);if(e&&e.type==='checkbox'){e.checked=!!pref.checks[id];e.dispatchEvent(new Event('change',{bubbles:true}));}
 });
}catch(e){}
function savePrefs(){
 var state={prompt:($('settingSystemPrompt')?.value||'').slice(0,4000),checks:{}};
 document.querySelectorAll('.setting-check').forEach(function(e){if(e.id)state.checks[e.id]=e.checked;});
 state.theme=$('app')?.getAttribute('data-theme')||'dark';
 try{localStorage.setItem(PREF,JSON.stringify(state));}catch(e){}
}
document.querySelectorAll('[data-theme-choice]').forEach(function(e){e.addEventListener('click',function(){setTimeout(savePrefs,0);});});
$('savePrompt')?.addEventListener('click',savePrefs);
document.addEventListener('change',function(e){if(e.target.matches&&e.target.matches('.setting-check'))savePrefs();},true);
['clis','roblox','blender','plugins'].forEach(function(p){
 var area=document.querySelector('[data-settings-pane="'+p+'"]');
 if(!area)return;
 var n=node('div','web-model-legacy-notice','Funcionalidades que instalam aplicativos, conectam Roblox Studio/Blender ou executam MCP local exigem o Blocksmith Desktop no Windows. Aqui os botões de instalação não simulam sucesso.');
 area.insertBefore(n,area.firstChild);
});
renderModels();updateChip();notice('Modelos disponíveis nesta instalação web. Escolha um para habilitar respostas reais.',false);
})();