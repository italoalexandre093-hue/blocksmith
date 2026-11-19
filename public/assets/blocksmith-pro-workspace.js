/*
 * Blocksmith / Professional Workspace Enhancements
 * UI-only: uses established navigation, editor and new-chat event handlers.
 * No model requests, account/session access or simulated responses.
 */
(function () {
  'use strict';
  var app = document.getElementById('app');
  var sidebar = document.getElementById('sd');
  var main = document.getElementById('rp');
  var messages = document.getElementById('msgs');
  var editor = document.getElementById('inp');
  var composer = document.getElementById('comp');
  if (!app || !sidebar || !main || !messages || !editor || !composer) return;
  if (document.getElementById('bsProfessionalTopbar')) return;

  function el(tag, className, label) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof label === 'string') node.textContent = label;
    return node;
  }
  function addSidebarHeading(before, label) {
    if (!before || !before.parentElement) return;
    var caption = el('div', 'bs-nav-heading', label);
    caption.setAttribute('aria-hidden', 'true');
    before.parentElement.insertBefore(caption, before);
  }
  addSidebarHeading(document.getElementById('chatList'), 'CONVERSAS');
  addSidebarHeading(sidebar.querySelector('.navlist'), 'ESPAÇO DE CRIAÇÃO');

  var topbar = el('header', 'bs-topbar');
  topbar.id = 'bsProfessionalTopbar';
  var left = el('div', 'bs-topbar-left');
  left.appendChild(el('span', 'bs-eyebrow', 'BLOCKSMITH / WORKSPACE'));
  var pageTitle = el('h2', 'bs-page-title', 'Seu estúdio');
  left.appendChild(pageTitle);
  topbar.appendChild(left);
  var actions = el('div', 'bs-topbar-actions');
  var webTag = el('span', 'bs-web-tag', 'WEB');
  webTag.setAttribute('title', 'Interface web do Blocksmith');
  actions.appendChild(webTag);
  function action(label, icon, handler) {
    var button = el('button', 'bs-topbar-btn');
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.title = label;
    var symbol = el('i', 'ti ti-' + icon);
    symbol.setAttribute('aria-hidden', 'true');
    button.appendChild(symbol);
    button.appendChild(el('span', '', label));
    button.addEventListener('click', handler);
    actions.appendChild(button);
    return button;
  }
  action('Novo chat', 'plus', function () {
    var trigger = document.getElementById('newChat');
    if (trigger) trigger.click();
    editor.focus();
  });
  action('Configurações', 'settings', function () {
    var trigger = document.getElementById('settingsBtn');
    if (trigger) trigger.click();
  });
  topbar.appendChild(actions);
  var context = document.getElementById('chatContext');
  if (context && context.parentElement === main) main.insertBefore(topbar, context);
  else main.insertBefore(topbar, main.firstChild);

  function currentSection() {
    var activeNav = sidebar.querySelector('.nav.act');
    if (activeNav) {
      var word = activeNav.querySelector('span');
      if (word && word.textContent.trim()) return word.textContent.trim();
    }
    var currentChat = sidebar.querySelector('.tree-chat.act');
    if (currentChat) {
      var chatName = currentChat.querySelector('.tree-name');
      if (chatName && chatName.textContent.trim()) return chatName.textContent.trim();
    }
    return 'Seu estúdio';
  }
  function updateTitle() {
    var label = currentSection();
    if (pageTitle.textContent !== label) pageTitle.textContent = label;
  }
  updateTitle();
  var navObserver = new MutationObserver(function () { updateTitle(); });
  navObserver.observe(sidebar, {subtree:true, attributes:true, attributeFilter:['class'], childList:true});

  // Contextual welcome only when the active conversation has no messages.
  var welcome = el('div', 'bs-welcome');
  welcome.id = 'bsProfessionalWelcome';
  welcome.appendChild(el('div', 'bs-welcome-label', 'CRIATIVIDADE • DESENVOLVIMENTO'));
  var heading = el('h1');
  heading.appendChild(document.createTextNode('Seu próximo projeto '));
  heading.appendChild(el('strong', '', 'começa aqui.'));
  welcome.appendChild(heading);
  welcome.appendChild(el('p', '',
    'Transforme ideias em sistemas, histórias e experiências para Roblox. Organize seu fluxo de criação e comece uma conversa.'));
  welcome.appendChild(el('div', 'bs-welcome-caption', 'COMECE COM UMA IDEIA'));
  var shortcuts = el('div', 'bs-shortcuts');
  var prompts = [
    {
      icon:'code', title:'Criar um sistema',
      description:'Estruture uma mecânica com Luau.',
      text:'Quero planejar um sistema para meu jogo Roblox em Luau. Ajude a definir requisitos, estrutura dos scripts e etapas de implementação.'
    },
    {
      icon:'photo', title:'Criar uma thumbnail',
      description:'Defina conceito, composição e estilo.',
      text:'Quero criar uma thumbnail profissional para um jogo Roblox. Me ajude com o conceito, composição, direção de arte e um prompt detalhado.'
    },
    {
      icon:'layers-subtract', title:'Planejar meu jogo',
      description:'Organize tarefas e prioridades.',
      text:'Quero organizar o desenvolvimento do meu jogo Roblox. Me ajude a criar um plano com sistemas principais, prioridades e marcos.'
    }
  ];
  prompts.forEach(function (item) {
    var button = el('button', 'bs-shortcut');
    button.type = 'button';
    button.setAttribute('aria-label', item.title + ': inserir sugestão no chat');
    var iconBox = el('span', 'bs-shortcut-icon');
    var icon = el('i', 'ti ti-' + item.icon);
    icon.setAttribute('aria-hidden', 'true');
    iconBox.appendChild(icon);
    button.appendChild(iconBox);
    button.appendChild(el('strong', '', item.title));
    button.appendChild(el('small', '', item.description));
    button.addEventListener('click', function () {
      // Prepare a draft rather than pretending a provider is connected.
      var draft = editor.textContent.trim();
      editor.textContent = draft ? draft + '\n\n' + item.text : item.text;
      editor.dispatchEvent(new Event('input', {bubbles:true}));
      editor.focus();
    });
    shortcuts.appendChild(button);
  });
  welcome.appendChild(shortcuts);

  function manageWelcome() {
    var hasMessages = Array.prototype.some.call(messages.children, function (child) {
      return child !== welcome;
    });
    if (hasMessages) {
      if (welcome.parentNode === messages) messages.removeChild(welcome);
    } else if (welcome.parentNode !== messages) {
      messages.appendChild(welcome);
    }
  }
  var messagesObserver = new MutationObserver(function () { manageWelcome(); });
  messagesObserver.observe(messages, {childList:true});
  manageWelcome();

  var note = el('div', 'bs-composer-note');
  note.setAttribute('aria-hidden','true');
  note.appendChild(el('kbd', '', 'Enter'));
  note.appendChild(document.createTextNode(' envia · '));
  note.appendChild(el('kbd', '', 'Shift + Enter'));
  note.appendChild(document.createTextNode(' quebra linha'));
  composer.appendChild(note);
  app.setAttribute('data-workspace-design', 'professional');
})();