/* Documentation helper: reads the canonical CSS rather than maintaining a second token list. */
(() => {
  'use strict';
  const catalogue = document.getElementById('token-values');
  const palettes = document.getElementById('theme-palettes');
  const paletteNames = ['--paper','--panel','--surface','--ink','--ink-soft','--muted','--line','--accent','--accent-ink','--accent-2','--accent-3','--focus-ring','--headline'];
  let names = [];
  const swatch = document.createElement('span');
  swatch.hidden = true;
  document.body.append(swatch);
  function rgb(color) {
    swatch.style.color = color;
    return getComputedStyle(swatch).color.match(/[\d.]+/g)?.slice(0,3).map(Number);
  }
  function luminance(channels) {
    return channels.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126,.7152,.0722][i], 0);
  }
  function ratio(a,b) {
    const x = luminance(rgb(a)), y = luminance(rgb(b));
    return ((Math.max(x,y)+.05)/(Math.min(x,y)+.05)).toFixed(2);
  }
  function text(tag, value, className) {
    const node = document.createElement(tag); node.textContent = value;
    if (className) node.className = className;
    return node;
  }
  function renderValues() {
    if (!names.length) return;
    const computed = getComputedStyle(document.documentElement);
    const fragment = document.createDocumentFragment();
    names.forEach(name => {
      const card = text('div','','ds-value');
      const value = computed.getPropertyValue(name).trim();
      card.append(text('code',name),text('span',value || 'Theme-specific: not set'));
      if (value && CSS.supports('color',value)) {
        const sample = text('div','','ds-token-swatch');
        sample.style.backgroundColor = value;
        sample.setAttribute('aria-hidden','true');
        card.append(sample);
      }
      fragment.append(card);
    });
    catalogue.replaceChildren(fragment);
  }
  function renderPalettes() {
    palettes.replaceChildren();
    ['clear','tinted','contrast','wild'].forEach((theme,index) => {
      const section = document.createElement('details');
      section.dataset.theme = theme;
      const summary = text('summary', `${['Clear','Tinted','High Contrast','Wild'][index]} palette`);
      const grid = text('div','','ds-grid');
      section.append(summary,grid); palettes.append(section);
      section.open = theme === document.documentElement.dataset.theme;
      const computed = getComputedStyle(section);
      const paper = computed.getPropertyValue('--paper').trim();
      paletteNames.forEach(name => {
        const color = computed.getPropertyValue(name).trim();
        if (!color || !CSS.supports('color',color)) return;
        const figure = text('figure','','ds-token');
        const sample = text('div','','ds-token-swatch'); sample.style.backgroundColor = color; sample.setAttribute('aria-hidden','true');
        const caption = document.createElement('figcaption');
        caption.append(text('code',name),text('span',color),text('span',`${ratio(color,paper)}:1 against paper`));
        figure.append(sample,caption);grid.append(figure);
      });
    });
  }
  fetch(new URL('../tokens.css',document.currentScript.src)).then(response => {
    if (!response.ok) throw new Error('Could not load tokens.css');
    return response.text();
  }).then(css => {
    names = [...new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]))];
    renderValues();renderPalettes();
  }).catch(() => { catalogue.replaceChildren(text('p','Token inspection is unavailable. Open tokens.css directly to inspect the values.')); palettes.replaceChildren(); });
  document.addEventListener('vs:themechange',renderValues);
})();
