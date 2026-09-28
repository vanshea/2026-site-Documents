(() => {
  const root = document.documentElement;
  const themes = ['theme1', 'theme3', 'theme4', 'theme5'];
  const key = 'vsc-site-theme-v2';
  const buttons = [...document.querySelectorAll('.theme-link[data-theme]')];
  const applyTheme = value => {
    const theme = themes.includes(value) ? value : 'theme4';
    root.dataset.theme = theme;
    root.style.colorScheme = theme === 'theme3' ? 'dark' : 'light';
    buttons.forEach(button => {
      const selected = button.dataset.theme === theme;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-active', selected);
    });
  };
  let current = root.dataset.theme;
  try { current = [localStorage.getItem(key), localStorage.getItem('vsc-site-theme')].find(value => themes.includes(value)) || current; } catch (error) {}
  applyTheme(current);
  buttons.forEach(button => button.addEventListener('click', () => {
    applyTheme(button.dataset.theme);
    try { localStorage.setItem(key, root.dataset.theme); } catch (error) {}
  }));
  const menuButton = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#siteNav');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('is-open', open);
    menuButton.querySelector('[aria-hidden="true"]')?.replaceChildren(document.createTextNode(open ? 'Close' : 'Menu'));
  });
  nav?.addEventListener('click', event => {
    if (!event.target.closest('a')) return;
    nav.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
  const wave = document.querySelector('[data-footer-wave]');
  const toggle = wave?.querySelector('.footer-wave-toggle');
  const setPaused = paused => {
    wave?.classList.toggle('is-paused', paused);
    toggle?.setAttribute('aria-label', paused ? 'Play footer wave animation' : 'Pause footer wave animation');
    toggle?.setAttribute('aria-pressed', String(!paused));
    if (toggle) toggle.textContent = paused ? 'Play wave' : 'Pause wave';
  };
  let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setPaused(paused);
  toggle?.addEventListener('click', event => { event.stopPropagation(); paused = !paused; setPaused(paused); });
  wave?.addEventListener('click', event => {
    if (event.target.closest('.footer-wave-toggle')) return;
    paused = !paused;
    setPaused(paused);
  });
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) wave?.classList.add('is-paused');
})();
