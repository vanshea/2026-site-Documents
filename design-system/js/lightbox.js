/* Links remain ordinary image links without JavaScript or native dialog support. */
(() => {
  'use strict';
  if (!window.HTMLDialogElement || typeof HTMLDialogElement.prototype.showModal !== 'function') return;
  const triggers = [...document.querySelectorAll('a.vsx-zoom[data-lightbox]')];
  if (!triggers.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'vsx-lightbox';
  dialog.setAttribute('aria-label', 'Image viewer');
  dialog.innerHTML = `<div class="vsx-lightbox-inner"><div class="vsx-lightbox-bar"><span class="vsx-lightbox-counter" aria-live="polite" aria-atomic="true"></span><button type="button" class="vsx-icon-btn" data-close autofocus>Close <span aria-hidden="true">×</span></button></div><figure class="vsx-lightbox-figure"><img alt=""><figcaption><strong></strong><span></span></figcaption></figure><div class="vsx-lightbox-nav"><button type="button" class="vsx-icon-btn" data-prev aria-label="Previous image">← Previous</button><button type="button" class="vsx-icon-btn" data-next aria-label="Next image">Next →</button></div></div>`;
  document.body.append(dialog);
  const image = dialog.querySelector('img');
  image.draggable = false;
  const caption = dialog.querySelector('figcaption');
  const close = dialog.querySelector('[data-close]');
  const nav = dialog.querySelector('.vsx-lightbox-nav');
  let group = [], index = 0, opener, previousOverflow = '', pointer;
  function show(next) {
    index = (next + group.length) % group.length;
    const source = group[index];
    image.src = source.dataset.src || source.href;
    image.alt = source.dataset.alt || source.querySelector('img')?.alt || '';
    caption.querySelector('strong').textContent = source.dataset.title || image.alt;
    caption.querySelector('span').textContent = source.dataset.caption || '';
    dialog.querySelector('.vsx-lightbox-counter').textContent = `${index + 1} / ${group.length}`;
    nav.hidden = group.length < 2;
  }
  triggers.forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = trigger;
      group = triggers.filter(item => item.dataset.lightbox === trigger.dataset.lightbox);
      previousOverflow = document.body.style.overflow;
      show(group.indexOf(trigger));
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      close.focus();
    });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    pointer = null;
    opener?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
  dialog.querySelector('[data-next]').addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      const controls = [...dialog.querySelectorAll('button:not(:disabled)')].filter(button => button.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); show(index + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  const figure = dialog.querySelector('figure');
  figure.addEventListener('pointerdown', event => { if (event.isPrimary) pointer = { x: event.clientX, y: event.clientY }; });
  figure.addEventListener('pointercancel', () => { pointer = null; });
  figure.addEventListener('pointerup', event => {
    if (!pointer) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
  });
})();
