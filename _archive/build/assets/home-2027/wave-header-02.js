/**
 * <ocean-wave-02> — animated wave header, built from the ORIGINAL artwork geometry.
 *
 * Unlike wave-header.js (which evenly distributes N lines by a `spread` value),
 * this version hard-codes the 9 stacked lines exactly as they sit in the source
 * file — same class names, same Y offsets. The source's tiny X offsets (1.68px /
 * 6.31px on cls-5, cls-7, cls-6) are converted into phase offsets, since X must
 * never move.
 *
 * NOTE: the source SVG references cls-1…cls-9 but contains no <style> block, so
 * the colors below come from the palette you supplied (5 values cycled across the
 * 9 lines) and stroke widths vary 1/3/5px per line. Edit the LINES table to change either.
 *
 * Usage:
 *   <script src="wave-header-02.js" defer></script>
 *   <ocean-wave-02></ocean-wave-02>
 *
 * Optional attributes:
 *   amplitude    peak vertical displacement, px   (default 22)
 *   wavelength   swell length along X, px         (default 620)
 *   speed        swells per second                (default 0.55)
 *   height       CSS height (default clamp(140px,22vw,260px))
 *   colors       comma-separated overrides, in LINES order
 *   stroke       single stroke-width override for every line
 */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const BASE_D =
    'M35.54,305.71c46.87,42.26,152.87,125.2,308.27,146.65,116.1,16.03,207.56-9.47,232.45-16.96,' +
    '160.17-48.22,184.46-139.89,296.29-166.6,68.01-16.24,176.29-10.34,338.19,114.73';
  const SAMPLES = 220;

  // Straight from the artwork. dy measured against cls-2 (the reference line);
  // dx is the source's horizontal nudge, re-expressed as phase.
  const LINES = [
    { cls: 'cls-2', dy:   0.00, dx: 0.00, color: '#cfbead', width: 3 },
    { cls: 'cls-1', dy:   3.75, dx: 0.00, color: '#d9ff00', width: 1 },
    { cls: 'cls-8', dy: -14.21, dx: 0.00, color: '#00d6ff', width: 5 },
    { cls: 'cls-5', dy: -12.44, dx: -1.68, color: '#f36070', width: 1 },
    { cls: 'cls-9', dy: -16.43, dx: 0.00, color: '#ffffff', width: 3 },
    { cls: 'cls-3', dy: -30.47, dx: 0.00, color: '#cfbead', width: 5 },
    { cls: 'cls-4', dy: -21.11, dx: 0.00, color: '#d9ff00', width: 1 },
    { cls: 'cls-7', dy:  -9.69, dx: -1.68, color: '#00d6ff', width: 3 },
    { cls: 'cls-6', dy:  -9.69, dx: 6.31, color: '#f36070', width: 5 }
  ];

  class OceanWave02 extends HTMLElement {
    connectedCallback() {
      const num = (a, f) => (this.hasAttribute(a) ? parseFloat(this.getAttribute(a)) : f);
      this.amplitude = num('amplitude', 22);
      this.wavelength = num('wavelength', 620);
      this.speed = num('speed', 0.55);

      const overrides = (this.getAttribute('colors') || '').split(',').map(s => s.trim()).filter(Boolean);
      const strokeAll = this.hasAttribute('stroke') ? parseFloat(this.getAttribute('stroke')) : null;

      this.style.display = 'block';
      this.style.width = '100%';
      this.style.lineHeight = '0';

      this.svg = document.createElementNS(NS, 'svg');
      this.svg.setAttribute('preserveAspectRatio', 'none');
      this.svg.setAttribute('aria-hidden', 'true');
      this.svg.style.display = 'block';
      this.svg.style.width = '100%';
      this.svg.style.height = this.getAttribute('height') || 'clamp(140px, 22vw, 260px)';
      this.appendChild(this.svg);

      this.sample();

      const k = (Math.PI * 2) / this.wavelength;
      this.lines = LINES.map((L, i) => {
        const el = document.createElementNS(NS, 'path');
        el.setAttribute('class', L.cls);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', overrides[i] || L.color);
        el.setAttribute('stroke-width', strokeAll != null ? strokeAll : L.width);
        el.setAttribute('stroke-linecap', 'round');
        this.svg.appendChild(el);
        return { el, dy: L.dy, phase: (L.dx / this.wavelength) * Math.PI * 2 };
      });

      this.frameBox(strokeAll);

      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return this.draw(0);
      const t0 = performance.now();
      const tick = () => {
        this.draw((performance.now() - t0) / 1000);
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
    }

    disconnectedCallback() { cancelAnimationFrame(this.raf); }

    sample() {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', BASE_D);
      this.svg.appendChild(p);
      const len = p.getTotalLength();
      this.pts = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const q = p.getPointAtLength((i / SAMPLES) * len);
        this.pts.push([q.x, q.y]);
      }
      this.svg.removeChild(p);
    }

    frameBox(strokeAll) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [x, y] of this.pts) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      const dys = LINES.map(l => l.dy);
      const maxStroke = strokeAll != null ? strokeAll : Math.max(...LINES.map(l => l.width));
      const pad = this.amplitude * 1.45 + maxStroke;
      const top = minY + Math.min(...dys, 0) - pad;
      const bottom = maxY + Math.max(...dys, 0) + pad;
      this.svg.setAttribute('viewBox', `${minX} ${top} ${maxX - minX} ${bottom - top}`);
    }

    // Y-only displacement: a travelling sine plus a half-strength second
    // harmonic, tapered at both ends so the line stays anchored.
    draw(t) {
      const k = (Math.PI * 2) / this.wavelength;
      const w = t * this.speed * Math.PI * 2;
      const last = this.pts.length - 1;
      for (const L of this.lines) {
        let d = '';
        for (let i = 0; i <= last; i++) {
          const x = this.pts[i][0];
          const taper = Math.min(1, Math.sin(Math.PI * (i / last)) * 1.6);
          const a = this.amplitude * taper;
          const y = this.pts[i][1] + L.dy
            + a * Math.sin(k * x - w + L.phase)
            + a * 0.38 * Math.sin(2 * k * x - 2 * w + L.phase * 1.6);
          d += (i ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2);
        }
        L.el.setAttribute('d', d);
      }
    }
  }

  customElements.define('ocean-wave-02', OceanWave02);
})();
