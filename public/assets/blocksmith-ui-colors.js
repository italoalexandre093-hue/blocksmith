/*
 * Blocksmith Visual Color Studio
 * Changes presentation only. Stores a validated palette ID and hex color;
 * never touches credentials, conversations or API requests.
 */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var pane = document.querySelector('[data-settings-pane="appearance"]');
  if (!app || !pane || document.getElementById('blocksmithVisualColorStudio')) return;

  var storageKey = 'blocksmith.visual-color-studio.v1';
  var presets = [
    {id:'amethyst', label:'Ametista', accent:'#8055D8', bg:'#0B0716', side:'#130E27', surface:'#1A1430', raised:'#241B43', border:'#403167'},
    {id:'cobalt', label:'Cobalto', accent:'#315DA9', bg:'#05070D', side:'#0B1120', surface:'#101A30', raised:'#172644', border:'#263C62'},
    {id:'emerald', label:'Esmeralda', accent:'#118467', bg:'#060F0D', side:'#0D1C18', surface:'#112721', raised:'#163B31', border:'#28584B'},
    {id:'rose', label:'Rubi', accent:'#BD417E', bg:'#140912', side:'#220F1D', surface:'#321527', raised:'#481D36', border:'#61334E'},
    {id:'amber', label:'Âmbar', accent:'#AC731C', bg:'#120D08', side:'#21190E', surface:'#312415', raised:'#48331B', border:'#62472B'},
    {id:'slate', label:'Grafite', accent:'#5F7597', bg:'#0B0E15', side:'#151B27', surface:'#1D2634', raised:'#263447', border:'#3E526A'}
  ];
  var byId = {};
  presets.forEach(function (preset) { byId[preset.id] = preset; });
  function validHex(value) { return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value); }
  function rgb(hex) {
    return [1,3,5].map(function (offset) { return parseInt(hex.slice(offset,offset+2),16); }).join(',');
  }
  function readSaved() {
    try {
      var state = JSON.parse(window.localStorage.getItem(storageKey) || 'null');
      if (!state || !Object.prototype.hasOwnProperty.call(byId, state.preset)) return null;
      return {preset:state.preset, accent:validHex(state.accent) ? state.accent : byId[state.preset].accent};
    } catch (_) { return null; }
  }
  function save(state) {
    try { window.localStorage.setItem(storageKey,JSON.stringify(state)); }
    catch (_) { /* Storage can be disabled. Palette still works for this visit. */ }
  }

  // Native controls: buttons, a color input and a miniature preview per palette.
  var studio = document.createElement('section');
  studio.id = 'blocksmithVisualColorStudio';
  studio.className = 'visual-color-studio';
  studio.setAttribute('aria-labelledby','visualColorTitle');
  var head = document.createElement('div');
  head.className = 'visual-color-heading';
  var title = document.createElement('h3');
  title.id = 'visualColorTitle';
  title.className = 'visual-color-title';
  title.textContent = 'Paleta visual da interface';
  head.appendChild(title); studio.appendChild(head);
  var hint = document.createElement('p');
  hint.className = 'visual-color-hint';
  hint.textContent = 'Clique em uma prévia para mudar as cores do menu, chat, botões, modelos e janelas em tempo real.';
  studio.appendChild(hint);
  var grid = document.createElement('div');
  grid.className = 'visual-color-grid';
  grid.setAttribute('role','group');
  grid.setAttribute('aria-label','Paletas de cores da interface');
  var buttons = [];
  presets.forEach(function (preset) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'visual-color-choice';
    button.setAttribute('data-ui-color-preset',preset.id);
    button.setAttribute('aria-pressed','false');
    button.setAttribute('aria-label','Usar paleta '+preset.label);
    button.style.setProperty('--sample-bg',preset.bg);
    button.style.setProperty('--sample-side',preset.side);
    button.style.setProperty('--sample-accent',preset.accent);
    var mock = document.createElement('span');
    mock.className = 'visual-color-mock';
    mock.setAttribute('aria-hidden','true');
    var side = document.createElement('span');
    side.className = 'visual-color-mock-side';
    for (var n=0;n<3;n++) side.appendChild(document.createElement('i'));
    var main = document.createElement('span');
    main.className = 'visual-color-mock-main';
    main.appendChild(document.createElement('i'));
    main.appendChild(document.createElement('i'));
    main.appendChild(document.createElement('b'));
    mock.appendChild(side); mock.appendChild(main); button.appendChild(mock);
    var footer = document.createElement('span');
    footer.className = 'visual-color-choice-foot';
    var name = document.createElement('span');
    name.textContent = preset.label;
    var dot = document.createElement('span');
    dot.className = 'visual-color-dot';
    dot.setAttribute('aria-hidden','true');
    footer.appendChild(name); footer.appendChild(dot); button.appendChild(footer);
    button.addEventListener('click',function () { apply(preset.id,preset.accent,true); });
    grid.appendChild(button); buttons.push(button);
  });
  studio.appendChild(grid);
  var tools = document.createElement('div');
  tools.className = 'visual-color-tools';
  var colorLabel = document.createElement('label');
  colorLabel.textContent = 'Cor personalizada';
  colorLabel.setAttribute('for','visualColorInput');
  tools.appendChild(colorLabel);
  var input = document.createElement('input');
  input.type = 'color';
  input.id = 'visualColorInput';
  input.className = 'visual-color-input';
  input.setAttribute('aria-label','Escolher cor personalizada');
  tools.appendChild(input);
  var hexLabel = document.createElement('span');
  hexLabel.className = 'visual-color-hex';
  hexLabel.id = 'visualColorHex';
  tools.appendChild(hexLabel);
  var resetButton = document.createElement('button');
  resetButton.type = 'button';
  resetButton.className = 'visual-color-reset';
  resetButton.textContent = 'Restaurar azul';
  tools.appendChild(resetButton); studio.appendChild(tools);
  var status = document.createElement('p');
  status.className = 'visual-color-status';
  status.id = 'visualColorStatus';
  status.setAttribute('role','status');
  status.setAttribute('aria-live','polite');
  studio.appendChild(status);

  var originalPreview = pane.querySelector('.ap-preview');
  if (originalPreview) pane.insertBefore(studio,originalPreview);
  else pane.insertBefore(studio,pane.firstChild);
  var selected = 'amethyst';
  function apply(id,accent,persist) {
    if (!Object.prototype.hasOwnProperty.call(byId,id)) return;
    var preset = byId[id];
    if (!validHex(accent)) accent = preset.accent;
    accent = accent.toUpperCase();
    selected = id;
    var vars = {
      '--ui-bg':preset.bg, '--ui-side':preset.side,
      '--ui-surface':preset.surface, '--ui-raised':preset.raised,
      '--ui-border':preset.border, '--ui-accent':accent,
      '--ui-accent-rgb':rgb(accent),
      '--bg':preset.bg, '--s1':preset.side,
      '--s2':preset.surface, '--s3':preset.raised,
      '--bd':preset.border, '--bd2':preset.border
    };
    [document.documentElement,document.body,app].forEach(function (target) {
      if (!target) return;
      Object.keys(vars).forEach(function (name) { target.style.setProperty(name,vars[name],'important'); });
    });
    // Existing Appearance preview and controls continue to follow the chosen accent.
    if (typeof window.setAccent === 'function') window.setAccent(accent);
    app.style.setProperty('--ac',accent,'important');
    app.style.setProperty('--ac-rgb',rgb(accent),'important');
    app.style.setProperty('--ac2',accent,'important');
    app.setAttribute('data-ui-palette',id);
    input.value = accent;
    hexLabel.textContent = accent;
    buttons.forEach(function (button) {
      var on = button.getAttribute('data-ui-color-preset') === id;
      button.setAttribute('aria-pressed',on ? 'true' : 'false');
    });
    status.textContent = 'Aplicado: '+preset.label+' · '+accent+(persist ? ' · escolha salva neste navegador' : '');
    if (persist) save({preset:id,accent:accent});
  }
  input.addEventListener('input',function () { apply(selected,input.value,true); });
  resetButton.addEventListener('click',function () { apply('cobalt',byId.cobalt.accent,true); });
  var legacyGrid = document.getElementById('accentGrid');
  if (legacyGrid) legacyGrid.addEventListener('click',function (event) {
    var button = event.target && event.target.closest ? event.target.closest('[data-accent-choice]') : null;
    if (!button) return;
    var value = button.getAttribute('data-accent-choice');
    if (validHex(value)) apply(selected,value,true);
  });
  var resetAppearance = document.getElementById('appearanceReset');
  if (resetAppearance) resetAppearance.addEventListener('click',function () {
    // Runs after the legacy reset and Midnight Forge's queued primary color.
    queueMicrotask(function () { apply('cobalt',byId.cobalt.accent,true); });
  });
  var previous = readSaved();
  apply(previous ? previous.preset : 'amethyst', previous ? previous.accent : byId.amethyst.accent, false);

  window.BlocksmithVisualColors = {
    palettes:function () { return presets.map(function (p) { return {id:p.id,label:p.label,accent:p.accent}; }); },
    select:function (id) { if (Object.prototype.hasOwnProperty.call(byId,id)) apply(id,byId[id].accent,true); }
  };
})();
