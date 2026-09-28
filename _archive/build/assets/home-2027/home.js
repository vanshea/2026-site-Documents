(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Close' : 'Menu';
    nav.classList.toggle('is-open', open);
  });
  nav?.addEventListener('click', event => {
    if (!event.target.closest('a')) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menu'; toggle.focus();
    }
  });
  customElements.whenDefined('ocean-wave-02').then(() => {
    const wave = document.querySelector('ocean-wave-02');
    const button = document.querySelector('.motion-toggle');
    if (!wave || !button) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = false, inView = true, elapsed = 0, previous = 0, frame = null;
    cancelAnimationFrame(wave.raf);
    const stop = () => { cancelAnimationFrame(frame); frame = null; previous = 0; };
    const tick = now => { if (previous) elapsed += (now - previous) / 1000; previous = now; wave.draw(elapsed); frame = requestAnimationFrame(tick); };
    const sync = () => {
      stop();
      button.disabled = reduce.matches;
      button.textContent = reduce.matches ? 'Reduced motion' : paused ? 'Play wave' : 'Pause wave';
      button.setAttribute('aria-pressed', String(paused || reduce.matches));
      if (!paused && !reduce.matches && !document.hidden && inView) frame = requestAnimationFrame(tick);
      else wave.draw(elapsed);
    };
    button.addEventListener('click', () => { paused = !paused; sync(); });
    reduce.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); }).observe(wave);
    sync();
  });
})();
