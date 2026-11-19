/*
 * Blocksmith Monochrome Studio
 * Theme choices change only neutral grayscale UI tokens. No provider
 * credentials, conversations or project data are read or modified.
 */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var pane = document.querySelector('[data-settings-pane="appearance"]');
  if (!app || !pane || document.getElementById('blocksmithVisualColorStudio')) return;

  // v2 intentionally does not import previously saved chromatic themes.
  var storageKey = 'blocksmith.monochrome.v2';
  var presets = [
    {id:'mono', label:'Preto e branco', accent:'#FFFFFF', bg:'#080808', side:'#101010', surface:'#191919', raised:'#262626', border:'#383838'},
    {id:'graphite', label:'Grafite', accent:'#E6E6E6', bg:'#0D0D0D', side:'#171717', surface:'#222222', raised:'#303030', border:'#444444'},
    {id:'contrast', label:'Alto contraste', accent:'#FFFFFF', bg:'#000000', side:'#080808', surface:'#111111', raised:'#1D1D1D', border:'#666666'}
  ];
  var byId = Object.create(null);
  presets.forEach(function (p) { byId[p.id] = p; });
  function rgb(hex) { return [1,3,5].map(function (n) { return parseInt(hex.slice(n,n+2),16); }).join(','); }
  function readSaved() {
    try {
      var raw = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
      return raw && Object.prototype.hasOwnProperty.call(byId,raw.preset) ? raw.preset : null;
    } catch (_) { return null; }
  }
  function save(id) {
    try { window.localStorage.setItem(storageKey,JSON.stringify({preset:id})); }
    catch (_) { /* Storage disabled: theme still applies for this visit. */ }
  }
  function node(tag,cls,text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (typeof text === 'string') el.textContent = text;
    return el;
  }
  var studio=node('section','visual-color-studio');studio.id='blocksmithVisualColorStudio';
  studio.setAttribute('aria-labelledby','visualColorTitle');
  var title=node('h3','visual-color-title','Aparência preto e branco');
  title.id='visualColorTitle';studio.appendChild(title);
  studio.appendChild(node('p','visual-color-hint','Estilo profissional monocromático, sem roxo, azul ou cores fortes. Escolha o contraste da interface.'));
  var grid=node('div','visual-color-grid');grid.setAttribute('role','group');
  grid.setAttribute('aria-label','Variações de preto e branco');
  var buttons=[];
  presets.forEach(function (preset) {
    var button=node('button','visual-color-choice');
    button.type='button';
    button.setAttribute('aria-pressed','false');
    button.setAttribute('data-ui-color-preset',preset.id);
    button.setAttribute('aria-label','Usar tema '+preset.label);
    button.style.setProperty('--sample-bg',preset.bg);
    button.style.setProperty('--sample-side',preset.side);
    button.style.setProperty('--sample-accent',preset.accent);
    var mock=node('span','visual-color-mock');mock.setAttribute('aria-hidden','true');
    var side=node('span','visual-color-mock-side');
    for(var i=0;i<3;i++)side.appendChild(node('i'));
    var main=node('span','visual-color-mock-main');
    main.appendChild(node('i'));main.appendChild(node('i'));main.appendChild(node('b'));
    mock.appendChild(side);mock.appendChild(main);button.appendChild(mock);
    var foot=node('span','visual-color-choice-foot');
    foot.appendChild(node('span','',preset.label));
    foot.appendChild(node('span','visual-color-dot'));
    button.appendChild(foot);
    button.addEventListener('click',function(){apply(preset.id,true);});
    buttons.push(button);grid.appendChild(button);
  });
  studio.appendChild(grid);
  var tools=node('div','visual-color-tools');
  var reset=node('button','visual-color-reset','Restaurar preto e branco');
  reset.type='button';
  reset.addEventListener('click',function(){apply('mono',true);});
  tools.appendChild(reset);studio.appendChild(tools);
  var status=node('p','visual-color-status');
  status.id='visualColorStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  studio.appendChild(status);
  var preview=pane.querySelector('.ap-preview');
  if (preview) pane.insertBefore(studio,preview);
  else pane.insertBefore(studio,pane.firstChild);

  function apply(id,persist) {
    var p=byId[id];
    if (!p) return;
    var vars={
      '--ui-bg':p.bg,'--ui-side':p.side,'--ui-surface':p.surface,
      '--ui-raised':p.raised,'--ui-border':p.border,'--ui-accent':p.accent,
      '--ui-accent-rgb':rgb(p.accent),
      '--bg':p.bg,'--s1':p.side,'--s2':p.surface,'--s3':p.raised,
      '--bd':p.border,'--bd2':p.border,
      '--ac':p.accent,'--ac-rgb':rgb(p.accent),'--ac2':p.accent,
      '--pro-canvas':p.bg,'--pro-sidebar':p.side,'--pro-panel':p.surface,
      '--pro-panel-lift':p.raised,'--pro-line':p.border,'--pro-line-strong':p.border,
      '--pro-brand':p.accent,'--pro-brand-rgb':rgb(p.accent)
    };
    [document.documentElement,document.body,app].forEach(function (element) {
      if(!element)return;
      Object.keys(vars).forEach(function(key){element.style.setProperty(key,vars[key],'important');});
    });
    // Synchronize the built-in palette control with white/gray accents only.
    if(typeof window.setAccent==='function')window.setAccent(p.accent);
    app.style.setProperty('--ac',p.accent,'important');
    app.style.setProperty('--ac-rgb',rgb(p.accent),'important');
    app.style.setProperty('--ac2',p.accent,'important');
    app.setAttribute('data-ui-palette',p.id);
    app.setAttribute('data-design','monochrome');
    buttons.forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-ui-color-preset')===id?'true':'false');});
    status.textContent='Ativo: '+p.label+(persist?' · salvo neste navegador':'');
    if(persist)save(id);
  }
  // The old accent picker must not restore blue, orange or purple.
  var legacyGrid=document.getElementById('accentGrid');
  if(legacyGrid)legacyGrid.addEventListener('click',function(){queueMicrotask(function(){apply(readSaved()||'mono',false);});});
  var legacyCustom=document.getElementById('accentCustom');
  if(legacyCustom)legacyCustom.addEventListener('input',function(){queueMicrotask(function(){apply(readSaved()||'mono',false);});});
  var resetAppearance=document.getElementById('appearanceReset');
  if(resetAppearance)resetAppearance.addEventListener('click',function(){queueMicrotask(function(){apply('mono',true);});});
  apply(readSaved()||'mono',false);
  window.BlocksmithVisualColors={
    palettes:function(){return presets.map(function(p){return {id:p.id,label:p.label,accent:p.accent};});},
    select:function(id){apply(id,true);}
  };
})();
