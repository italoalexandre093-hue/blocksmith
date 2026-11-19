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
    ['#183565', 'Deep Navy'],
    ['#244783', 'Indigo Navy'],
    ['#315DA9', 'Midnight Blue'],
    ['#3D66AF', 'Blue Steel'],
    ['#294F90', 'Atlantic'],
    ['#152E58', 'Obsidian Blue'],
    ['#355A97', 'Cobalt Navy'],
    ['#284576', 'Ink Blue'],
    ['#4367A6', 'Glacier Navy'],
    ['#1E407B', 'Oxford Blue']
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
    button.setAttribute('aria-label', 'Azul: ' + item[1]);
    var dot = button.querySelector('span');
    if (dot) dot.style.background = item[0];
  });

  var themeNames = { dark: 'Midnight', white: 'Obsidian', gray: 'Navy' };
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
    if (heading) heading.textContent = 'Tons de azul';
    if (description) description.textContent = 'Selecione uma variação azul-marinho da identidade Midnight Forge.';
  }

  var applyPrimaryBlue = function () {
    if (typeof window.setAccent === 'function') {
      window.setAccent('#315DA9');
    } else {
      root.style.setProperty('--ac', '#315DA9');
      root.style.setProperty('--ac-rgb', '49,93,169');
      root.style.setProperty('--ac2', '#527BC5');
    }
  };

  // The stock reset action restores the obsolete orange theme.
  // Restore our navy primary after the existing action finishes.
  var reset = document.getElementById('appearanceReset');
  if (reset) reset.addEventListener('click', function () {
    queueMicrotask(applyPrimaryBlue);
  });

  applyPrimaryBlue();

  // Preserve user theme controls; all three choices now remain inside
  // the same black/white/navy family through the design CSS.
  root.setAttribute('data-design', 'midnight-forge');
})();
