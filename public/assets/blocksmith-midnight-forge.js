/*
 * Midnight Forge: synchronize the existing Appearance controls with
 * the new black, white and deep-blue design language.
 * No chat/provider/history data is read or changed by this module.
 */
(function () {
  'use strict';
  var root = document.getElementById('app');
  if (!root) return;

  var tones = [
    ['#FFFFFF', 'Branco'],
    ['#F2F2F2', 'Branco suave'],
    ['#E6E6E6', 'Prata clara'],
    ['#D9D9D9', 'Prata'],
    ['#CCCCCC', 'Cinza claro'],
    ['#BFBFBF', 'Cinza neutro'],
    ['#AAAAAA', 'Cinza médio'],
    ['#999999', 'Cinza acetinado'],
    ['#888888', 'Grafite claro'],
    ['#777777', 'Grafite']
  ];

  // The original palette uses mutable [hex, label] pairs. Its button
  // handlers retain those references, so changing each pair in-place
  // keeps the existing color controls functional.
  if (Array.isArray(window.ACCENTS)) {
    window.ACCENTS.forEach(function (entry, index) {
      var replacement = tones[index % tones.length];
      if (!Array.isArray(entry)) return;
      entry[0] = replacement[0];
      entry[1] = replacement[1];
    });
  }

  var buttons = Array.from(document.querySelectorAll('#accentGrid [data-accent-choice]'));
  buttons.forEach(function (button, index) {
    var item = tones[index % tones.length];
    button.setAttribute('data-accent-choice', item[0]);
    button.setAttribute('title', item[1]);
    button.setAttribute('aria-label', 'Monocromático: ' + item[1]);
    var dot = button.querySelector('span');
    if (dot) dot.style.background = item[0];
  });

  var themeNames = { dark: 'Preto', white: 'Preto e branco', gray: 'Grafite' };
  document.querySelectorAll('[data-theme-choice]').forEach(function (button) {
    var next = themeNames[button.getAttribute('data-theme-choice')];
    if (!next) return;
    button.childNodes.forEach(function (child) {
      if (child.nodeType === 3) child.nodeValue = next;
    });
    button.setAttribute('aria-label', 'Paleta ' + next);
  });

  var accentSection = document.querySelector('#accentGrid');
  if (accentSection) {
    var title = accentSection.closest('.settings-group');
    var heading = title && title.querySelector('.settings-group-title');
    var description = title && title.querySelector('.settings-group-sub');
    if (heading) heading.textContent = 'Destaques neutros';
    if (description) description.textContent = 'Tons de branco e cinza que mantêm a interface monocromática.';
  }

  var applyPrimaryWhite = function () {
    if (typeof window.setAccent === 'function') {
      window.setAccent('#FFFFFF');
    } else {
      root.style.setProperty('--ac', '#FFFFFF');
      root.style.setProperty('--ac-rgb', '255,255,255');
      root.style.setProperty('--ac2', '#F2F2F2');
    }
  };

  // The stock reset action restores the obsolete orange theme.
  // Restore our navy primary after the existing action finishes.
  var reset = document.getElementById('appearanceReset');
  if (reset) reset.addEventListener('click', function () {
    queueMicrotask(applyPrimaryWhite);
  });

  applyPrimaryWhite();

  // Preserve user theme controls; all three choices now remain inside
  // the same black/white/navy family through the design CSS.
  root.setAttribute('data-design', 'monochrome');
})();
