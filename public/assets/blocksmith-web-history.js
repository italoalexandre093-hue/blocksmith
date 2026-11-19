/* Blocksmith Web: browser-local conversation persistence (not cloud sync). */
(function () {
  'use strict';
  var KEY = 'blocksmith-web-conversations-v1';
  var MAX_CHATS = 400;
  var MAX_MESSAGES = 3000;
  var timer = null;
  var lastSaved = null;
  var doNotOverwrite = false;
  var $ = function (id) { return document.getElementById(id); };
  var sidebar = $('sd');
  var input = $('inp');
  if (!sidebar || !input || !window.chats || !window.mainChats) return;

  function string(value, fallback, limit) {
    return typeof value === 'string' ? value.slice(0, limit || 50000) : (fallback || '');
  }
  function validId(id, type) {
    return typeof id === 'string' && (type === 'main' ? /^m[0-9]+$/ : type === 'project' ? /^p[0-9]+$/ : /^c[0-9]+$/).test(id);
  }
  function normalizeMessage(value) {
    if (!value || typeof value !== 'object' || !['u', 'a'].includes(value.cls)) return null;
    var result = { cls: value.cls, t: string(value.t, '', 50000), fs: [] };
    if (Array.isArray(value.fs)) result.fs = value.fs.slice(0, 30).map(function (f) { return { name: string(f && f.name, '', 200) }; });
    if (value.opts && typeof value.opts === 'object') result.opts = {
      genre: string(value.opts.genre, '', 100),
      dimension: string(value.opts.dimension, '', 100),
      character: string(value.opts.character, '', 100)
    };
    return result;
  }
  function normalizeChat(value) {
    var result = typeof window.mk === 'function' ? window.mk() : { m: [], draft: '', f: [], busy: false, rt: null };
    if (!value || typeof value !== 'object') return result;
    if (Array.isArray(value.m)) result.m = value.m.slice(-MAX_MESSAGES).map(normalizeMessage).filter(Boolean);
    result.draft = string(value.draft, '', 50000);
    if (value.opts && typeof value.opts === 'object') result.opts = {
      genre: string(value.opts.genre, 'Tycoon', 100),
      dimension: string(value.opts.dimension, '3D', 100),
      character: string(value.opts.character, 'Com personagem', 100)
    };
    result.f = []; result.busy = false; result.rt = null;
    return result;
  }
  function normalize(payload) {
    if (!payload || payload.version !== 1 || !Array.isArray(payload.mainChats) || !payload.chats || typeof payload.chats !== 'object') {
      throw new Error('Formato de histórico não reconhecido');
    }
    var main = payload.mainChats.slice(0, MAX_CHATS).filter(function (c) { return c && validId(c.id, 'main'); }).map(function (c) {
      return { id: c.id, name: string(c.name, 'Chat', 200) };
    });
    if (!main.length) throw new Error('O backup não contém chats principais válidos');
    var projects = (Array.isArray(payload.projects) ? payload.projects : []).slice(0, MAX_CHATS).filter(function (p) {
      return p && validId(p.id, 'project');
    }).map(function (p) {
      return {
        id: p.id, name: string(p.name, 'Projeto', 200), open: p.open !== false,
        chats: (Array.isArray(p.chats) ? p.chats : []).slice(0, MAX_CHATS).filter(function (c) { return c && validId(c.id, 'chat'); }).map(function (c) {
          return { id: c.id, name: string(c.name, 'Chat', 200) };
        })
      };
    });
    var activeKeys = ['thumbs', 'studio', 'chars'];
    main.forEach(function (c) { activeKeys.push('main:' + c.id); });
    projects.forEach(function (p) { p.chats.forEach(function (c) { activeKeys.push('project:' + p.id + ':' + c.id); }); });
    var chatMap = Object.create(null);
    activeKeys.forEach(function (key) { chatMap[key] = normalizeChat(Object.prototype.hasOwnProperty.call(payload.chats, key) ? payload.chats[key] : null); });
    if (!chatMap.thumbs.opts) chatMap.thumbs.opts = { genre: 'Tycoon', dimension: '3D', character: 'Com personagem' };
    var maxMain = main.reduce(function (n, c) { return Math.max(n, parseInt(c.id.slice(1), 10) || 0); }, 0);
    var maxProject = projects.reduce(function (n, p) { return Math.max(n, parseInt(p.id.slice(1), 10) || 0); }, 0);
    var maxProjectChat = projects.reduce(function (n, p) { return p.chats.reduce(function (v, c) { return Math.max(v, parseInt(c.id.slice(1), 10) || 0); }, n); }, 0);
    return {
      version: 1, mainChats: main, projects: projects, chats: chatMap,
      cur: activeKeys.indexOf(payload.cur) >= 0 ? payload.cur : 'main:' + main[0].id,
      mainChatSeq: Math.max(maxMain, Number(payload.mainChatSeq) || 0),
      projectSeq: Math.max(maxProject, Number(payload.projectSeq) || 0),
      projectChatSeq: Math.max(maxProjectChat, Number(payload.projectChatSeq) || 0),
      projectsOpen: payload.projectsOpen !== false
    };
  }
  function snapshot() {
    if (window.cur && window.chats[window.cur]) window.chats[window.cur].draft = input.textContent || '';
    var map = Object.create(null);
    Object.keys(window.chats).slice(0, MAX_CHATS * 2 + 3).forEach(function (key) {
      if (/^(thumbs|studio|chars|main:m[0-9]+|project:p[0-9]+:c[0-9]+)$/.test(key)) {
        var chat = window.chats[key];
        map[key] = { m: (chat && Array.isArray(chat.m) ? chat.m : []).slice(-MAX_MESSAGES).map(normalizeMessage).filter(Boolean), draft: string(chat && chat.draft, '', 50000) };
        if (chat && chat.opts) map[key].opts = chat.opts;
      }
    });
    return normalize({
      version: 1, chats: map, mainChats: window.mainChats,
      projects: window.projects, cur: window.cur,
      mainChatSeq: window.mainChatSeq, projectSeq: window.projectSeq,
      projectChatSeq: window.projectChatSeq, projectsOpen: window.projectsOpen
    });
  }
  var status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.style.cssText = 'font:11px system-ui,sans-serif;color:#99b7aa;padding:8px 12px;line-height:1.4;';
  status.textContent = 'Histórico local: iniciando…';
  var backup = document.createElement('div');
  backup.style.cssText = 'display:flex;gap:6px;padding:0 10px 8px;';
  var exportButton = document.createElement('button');
  exportButton.type = 'button'; exportButton.textContent = 'Exportar'; exportButton.title = 'Baixar backup dos chats neste navegador';
  var importButton = document.createElement('button');
  importButton.type = 'button'; importButton.textContent = 'Importar'; importButton.title = 'Restaurar backup do histórico';
  [exportButton, importButton].forEach(function (button) {
    button.style.cssText = 'flex:1;min-width:0;border:1px solid #395146;border-radius:7px;background:#15271f;color:#c8e1d5;font:11px system-ui,sans-serif;padding:6px 3px;cursor:pointer;';
    backup.appendChild(button);
  });
  var filePicker = document.createElement('input');
  filePicker.type = 'file'; filePicker.accept = '.json,application/json'; filePicker.hidden = true;
  var settings = $('settingsBtn');
  sidebar.insertBefore(status, settings); sidebar.insertBefore(backup, settings); sidebar.appendChild(filePicker);
  function notify(text, problem) { status.textContent = text; status.style.color = problem ? '#e8a89c' : '#99b7aa'; }
  function apply(data) {
    window.mainChats = data.mainChats;
    window.projects = data.projects;
    window.chats = data.chats;
    window.mainChatSeq = data.mainChatSeq;
    window.projectSeq = data.projectSeq;
    window.projectChatSeq = data.projectChatSeq;
    window.projectsOpen = data.projectsOpen;
    window.cur = data.cur;
    window.files = [];
    input.textContent = data.chats[data.cur].draft;
    if (typeof window.renderAtts === 'function') window.renderAtts();
    if (typeof window.updSend === 'function') window.updSend();
    if (typeof window.renderMainChats === 'function') window.renderMainChats();
    if (typeof window.renderProjectTree === 'function') window.renderProjectTree();
    if (typeof window.renderMsgs === 'function') window.renderMsgs();
    if (typeof window.renderChatContext === 'function') window.renderChatContext();
    if (typeof window.renderThumbControls === 'function') window.renderThumbControls();
    if (typeof window.setNav === 'function' && typeof window.navKey === 'function') window.setNav(window.navKey(window.cur));
  }
  function save() {
    if (doNotOverwrite) return;
    try {
      var encoded = JSON.stringify(snapshot());
      if (encoded === lastSaved) return;
      window.localStorage.setItem(KEY, encoded);
      lastSaved = encoded;
      notify('Histórico salvo neste navegador');
    } catch (error) {
      notify('Armazenamento indisponível. Exporte o backup.', true);
    }
  }
  function scheduleSave() { window.clearTimeout(timer); timer = window.setTimeout(save, 220); }
  try {
    var raw = window.localStorage.getItem(KEY);
    if (raw) {
      var parsed = normalize(JSON.parse(raw));
      apply(parsed);
      lastSaved = JSON.stringify(parsed);
      notify('Histórico restaurado neste navegador');
    } else notify('Histórico local ativado');
  } catch (error) {
    doNotOverwrite = true; notify('Backup local inválido; exporte antes de corrigir.', true);
  }
  exportButton.addEventListener('click', function () {
    try {
      var payload = JSON.stringify(snapshot(), null, 2);
      var url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
      var a = document.createElement('a'); a.href = url;
      a.download = 'blocksmith-chats-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); a.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    } catch (error) { notify('Não foi possível exportar o histórico', true); }
  });
  importButton.addEventListener('click', function () { filePicker.click(); });
  filePicker.addEventListener('change', function () {
    var file = filePicker.files && filePicker.files[0]; if (!file) return;
    file.text().then(function (text) {
      var next = normalize(JSON.parse(text));
      if (!window.confirm('Substituir os chats deste navegador pelo backup importado? Exporte os chats atuais antes, se necessário.')) return;
      doNotOverwrite = false; apply(next); lastSaved = null; save();
      notify('Histórico importado com sucesso');
    }).catch(function () { notify('Arquivo de backup inválido; nenhum chat foi alterado.', true); });
    filePicker.value = '';
  });
  document.addEventListener('click', function () { window.setTimeout(scheduleSave, 0); });
  document.addEventListener('input', scheduleSave, true);
  document.addEventListener('change', scheduleSave, true);
  var observer = new MutationObserver(scheduleSave);
  ['msgs', 'chatList', 'projectTree'].forEach(function (id) {
    var target = $(id); if (target) observer.observe(target, { subtree: true, childList: true, characterData: true });
  });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') save(); });
  window.addEventListener('pagehide', save);
  window.setInterval(save, 5000);
  if (!doNotOverwrite) scheduleSave();
})();