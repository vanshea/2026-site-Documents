(() => {
  const root = document.documentElement;
  const themes = ['theme1', 'theme2', 'theme3', 'theme4'];
  const labels = ['Clear', 'Tinted', 'High Contrast', 'Wild'];
  const dark = matchMedia('(prefers-color-scheme: dark)');
  let theme = 'theme1';
  try { theme = [localStorage.getItem('vsc-site-theme-v2'), localStorage.getItem('vsc-site-theme')].find(value => themes.includes(value)) || theme; } catch {}
  function apply(value, persist = false) {
    if (!themes.includes(value)) return;
    theme = value;
    root.dataset.theme = theme;
    const isDark = theme === 'theme3' || (['theme1', 'theme2'].includes(theme) && dark.matches);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    document.querySelectorAll('.theme-switcher button[data-theme]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === theme)));
    const slider = document.querySelector('#theme-range');
    if (slider) { slider.value = String(themes.indexOf(theme) + 1); slider.setAttribute('aria-valuetext', labels[themes.indexOf(theme)]); }
    const cycleButton = document.querySelector('[data-theme-cycle]');
    if (cycleButton) {
      cycleButton.textContent = `Theme: ${labels[themes.indexOf(theme)]}`;
      cycleButton.setAttribute('aria-label', `Color theme: ${labels[themes.indexOf(theme)]}. Activate to change theme.`);
    }
    const logo = document.querySelector('.brand img');
    if (logo) logo.src = isDark ? '/assets/new-logo-mark-lite.svg' : '/assets/new-logo-mark.svg';
    if (persist) try { localStorage.setItem('vsc-site-theme-v2', theme); } catch {}
  }
  apply(theme);
  dark.addEventListener('change', () => apply(theme));
  addEventListener('storage', event => { if (event.key === 'vsc-site-theme-v2') apply(event.newValue || 'theme1'); });
  document.addEventListener('DOMContentLoaded', () => {
    apply(theme);
    document.querySelectorAll('.theme-switcher button[data-theme]').forEach(button => button.addEventListener('click', () => apply(button.dataset.theme, true)));
    document.querySelector('#theme-range')?.addEventListener('input', event => apply(themes[Number(event.target.value) - 1], true));
    document.querySelector('[data-theme-cycle]')?.addEventListener('click', () => {
      apply(themes[(themes.indexOf(theme) + 1) % themes.length], true);
    });
  });
})();
