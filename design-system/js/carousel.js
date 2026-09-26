(() => {
  'use strict';
  document.querySelectorAll('.vsx-carousel').forEach(carousel => {
    const track = carousel.querySelector('.vsx-carousel-track');
    const slides = [...track.querySelectorAll('.vsx-rec')];
    const controls = carousel.querySelector('.vsx-carousel-controls');
    if (!slides.length || !controls) return;
    const previous = controls.querySelector('[data-prev]'), next = controls.querySelector('[data-next]');
    const status = controls.querySelector('.vsx-carousel-status');
    const progress = controls.querySelector('.vsx-carousel-progress span');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let visibleCount = 1, frame;
    function update() {
      const view = track.getBoundingClientRect();
      // Count substantially visible cards, excluding the intentional mobile peek.
      const visible = slides.map((slide, index) => {
        const box = slide.getBoundingClientRect();
        const overlap = Math.max(0, Math.min(box.right, view.right) - Math.max(box.left, view.left));
        return overlap >= box.width * .5 ? index : -1;
      }).filter(index => index >= 0);
      visibleCount = Math.max(1, visible.length);
      const first = (visible[0] ?? 0) + 1, last = (visible.at(-1) ?? 0) + 1;
      const label = `${first === last ? first : `${first}–${last}`} of ${slides.length}`;
      if (status.textContent !== label) status.textContent = label;
      const max = Math.max(0, track.scrollWidth - track.clientWidth);
      previous.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max - 1;
      progress.style.transform = `scaleX(${max > 0 ? track.scrollLeft / max : 1})`;
    }
    function move(direction) {
      const width = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: direction * (width + gap) * visibleCount, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('keydown', event => {
      if (event.target !== track) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); }
      if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); track.scrollTo({ left: event.key === 'Home' ? 0 : track.scrollWidth, behavior: 'auto' }); }
    });
    track.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); }, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(update).observe(track);
    else addEventListener('resize', update);
    controls.hidden = false;
    update();
  });
})();
