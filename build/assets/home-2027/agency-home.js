(() => {
  'use strict';
  const root = document.documentElement;
  const themes = ['theme1', 'theme2', 'theme3', 'theme4'];
  const key = 'vsc-site-theme-v2';
  const dark = matchMedia('(prefers-color-scheme: dark)');
  let theme = 'theme4';
  try { theme = [localStorage.getItem(key), localStorage.getItem('vsc-site-theme')].find(value => themes.includes(value)) || theme; } catch {}
  const applyTheme = value => {
    theme = themes.includes(value) ? value : 'theme4';
    root.dataset.theme = theme;
    document.querySelectorAll('input[name="color-theme"]').forEach(input => {
      input.checked = input.value === theme;
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim());
  };
  applyTheme(theme);
  dark.addEventListener('change', () => applyTheme(theme));
  addEventListener('storage', event => { if (event.key === key) applyTheme(event.newValue); });

  const initialize = () => {
    root.classList.add('js');
    applyTheme(theme);
    const header = document.querySelector('.home-header');
    const syncHeader = () => header?.classList.toggle('is-scrolled', scrollY > 24);
    addEventListener('scroll', syncHeader, { passive: true });
    syncHeader();
    document.querySelector('.theme-control')?.addEventListener('change', event => {
      if (event.target.matches('input[name="color-theme"]')) {
        applyTheme(event.target.value);
        try { localStorage.setItem(key, theme); } catch {}
      }
    });
    const menu = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.home-nav');
    const closeMenu = () => { nav?.classList.remove('is-open'); menu?.setAttribute('aria-expanded', 'false'); if (menu) menu.textContent = 'Menu'; };
    menu?.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      nav.classList.toggle('is-open', open);
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? 'Close' : 'Menu';
    });
    nav?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
    });
    matchMedia('(min-width:701px)').addEventListener('change', closeMenu);

    const wave = document.querySelector('#case-morph-wave');
    const stage = document.querySelector('.case-wave-stage');
    const control = document.querySelector('.case-motion-toggle');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let playing = false, inView = true, svg = null;
    const syncMotion = () => {
      const stop = !playing || reduce.matches || document.hidden || !inView;
      const label = reduce.matches ? 'Reduced motion' : playing ? 'Pause wave' : 'Play wave';
      if (control) {
        control.textContent = label;
        control.setAttribute('aria-label', label);
        control.setAttribute('aria-pressed', String(playing && !reduce.matches));
        control.disabled = reduce.matches;
      }
      if (!svg) return;
      if (stop) svg.pauseAnimations(); else svg.unpauseAnimations();
      svg.querySelectorAll('.z').forEach(layer => { layer.style.animationPlayState = stop ? 'paused' : 'running'; });
    };
    const connectWave = () => {
      if (!wave || !stage || !control) return;
      svg = wave.contentDocument?.querySelector('svg');
      if (!svg) return;
      syncMotion();
      stage.classList.add('is-ready');
      control.hidden = false;
    };
    wave?.addEventListener('load', connectWave);
    connectWave();
    control?.addEventListener('click', () => { playing = !playing; syncMotion(); });
    reduce.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncMotion);
    if (stage) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; syncMotion(); }).observe(stage);
    syncMotion();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
