/* Loaded synchronously in <head>, before CSS, to apply the saved theme before paint. */
(() => {
  'use strict';
  const names = ['clear', 'tinted', 'contrast', 'wild'];
  const aliases = { theme1: 'clear', theme2: 'tinted', theme3: 'contrast', theme4: 'wild' };
  const normalize = value => names.includes(value) ? value : aliases[value];
  const root = document.documentElement;
  const query = normalize(new URLSearchParams(location.search).get('theme'));
  let saved;
  try { saved = normalize(localStorage.getItem('vs-theme')) || normalize(localStorage.getItem('vsc-site-theme-v2')) || normalize(localStorage.getItem('vsc-site-theme')); } catch { /* Storage can be disabled. */ }
  function render() {
    const selected = normalize(root.dataset.theme) || 'clear';
    document.querySelectorAll('[data-set-theme]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.setTheme === selected));
    });
    document.querySelectorAll('[data-logo-light][data-logo-dark]').forEach(img => {
      img.src = selected === 'contrast' ? img.dataset.logoDark : img.dataset.logoLight;
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim());
    document.dispatchEvent(new CustomEvent('vs:themechange', { detail: { theme: selected } }));
  }
  function apply(theme, persist = false) {
    root.dataset.theme = normalize(theme) || 'clear';
    if (persist) {
      try { localStorage.setItem('vs-theme', root.dataset.theme); } catch {}
      // Keep an explicit theme preview URL consistent with the user's selection.
      const url = new URL(location.href);
      if (url.searchParams.has('theme')) { url.searchParams.set('theme', root.dataset.theme); history.replaceState(null, '', url); }
    }
    if (document.readyState !== 'loading') render();
  }
  apply(query || saved || normalize(root.dataset.theme) || 'clear');
  document.addEventListener('DOMContentLoaded', () => {
    render();
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-set-theme]');
      if (button) apply(button.dataset.setTheme, true);
    });
  });
  addEventListener('storage', event => { if (event.key === 'vs-theme') apply(event.newValue); });
})();
