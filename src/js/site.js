(() => {
  'use strict';
  document.querySelectorAll('[data-year]').forEach(element => element.textContent = new Date().getFullYear());

  const aliases = { '#about': '/about/', '#selected-work': '/art/', '#aidesign': '/#experiments', '#blog': '/#writing', '#experience': '/about/' };
  const redirectHash = () => { if (aliases[location.hash]) location.replace(aliases[location.hash]); };
  redirectHash();
  addEventListener('hashchange', redirectHash);

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.2 });
    document.querySelectorAll('[data-reveal-label]').forEach(label => {
      if (label.getBoundingClientRect().top > innerHeight) {
        label.classList.add('reveal-pending');
        observer.observe(label);
      }
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) {
        observer.disconnect();
        document.querySelectorAll('.reveal-pending').forEach(element => element.classList.remove('reveal-pending'));
      }
    });
  }

  const form = document.querySelector('#projectInquiryForm');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type=submit]');
    const status = document.querySelector('#projectInquiryStatus');
    const values = Object.fromEntries(new FormData(form));
    for (const [key, value] of Object.entries(values)) values[key] = value.trim();
    button.disabled = true;
    status.textContent = 'Sending your inquiry…';
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(values),
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Delivery unavailable');
      const result = await response.json();
      if (result.ok !== true) throw new Error('Delivery unavailable');
      status.textContent = 'Thank you. Your inquiry has been sent.';
      form.reset();
    } catch {
      status.textContent = 'The inquiry could not be sent. Your entries are still here. Please use the Google Form below.';
    } finally {
      button.disabled = false;
    }
  });

  const dialog = document.querySelector('#art-lightbox');
  if (dialog) {
    const links = [...document.querySelectorAll('.art-grid .work-link')];
    let current = 0;
    let opener;
    const show = index => {
      current = (index + links.length) % links.length;
      const item = links[current];
      const image = dialog.querySelector('#art-image');
      const caption = dialog.querySelector('#art-caption');
      image.src = item.dataset.fullscreenSrc || item.dataset.lightboxSrc;
      image.alt = item.dataset.lightboxTitle || item.querySelector('img').alt;
      caption.textContent = [item.dataset.lightboxTitle, item.dataset.lightboxDescription].filter(Boolean).join('. ');
      dialog.querySelector('[data-art-counter]').textContent = `${current + 1} / ${links.length}`;
    };
    links.forEach((link, index) => link.addEventListener('click', event => {
      event.preventDefault();
      opener = link;
      show(index);
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      dialog.querySelector('[data-art-close]').focus();
    }));
    dialog.querySelector('[data-art-prev]').addEventListener('click', () => show(current - 1));
    dialog.querySelector('[data-art-next]').addEventListener('click', () => show(current + 1));
    dialog.querySelector('[data-art-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-art-fullscreen]').addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await dialog.requestFullscreen();
      } catch {}
    });
    dialog.addEventListener('close', () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      document.body.style.overflow = '';
      opener?.focus();
    });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        show(current + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
  }
})();
