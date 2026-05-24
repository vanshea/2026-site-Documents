const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const rootEl = document.documentElement;
const themeButtons = document.querySelectorAll(".theme-link");
const themeStorageKey = "vsc-site-theme";
const availableThemes = new Set(["theme1", "theme2", "theme3"]);

function applyTheme(theme) {
  const fallbackTheme = availableThemes.has(rootEl.dataset.theme)
    ? rootEl.dataset.theme
    : "theme2";
  const resolvedTheme = availableThemes.has(theme) ? theme : fallbackTheme;
  rootEl.dataset.theme = resolvedTheme;
  rootEl.style.colorScheme = resolvedTheme === "theme3" ? "dark" : "";

  themeButtons.forEach((button) => {
    const isActive = button.dataset.theme === resolvedTheme;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

let initialTheme = availableThemes.has(rootEl.dataset.theme) ? rootEl.dataset.theme : "theme2";
try {
  const savedTheme = localStorage.getItem(themeStorageKey);
  if (savedTheme && availableThemes.has(savedTheme)) {
    initialTheme = savedTheme;
  }
} catch (error) {
  // Storage may be unavailable in restricted contexts.
}

applyTheme(initialTheme);

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTheme = button.dataset.theme;
    if (!availableThemes.has(selectedTheme)) return;

    applyTheme(selectedTheme);

    try {
      localStorage.setItem(themeStorageKey, selectedTheme);
    } catch (error) {
      // Ignore storage write errors.
    }
  });
});

const footerArtEls = document.querySelectorAll(".site-footer-art");

function buildFooterKaleidoscope(footerArt) {
  if (!footerArt.hasAttribute("data-footer-kaleidoscope")) return;

  const width = 1600;
  const height = 420;
  const centerX = width / 2;
  const centerY = height / 2;
  const wedgeCount = 12;
  const unitId = `footerKaleidoscopeUnit${Math.random().toString(36).slice(2)}`;
  const sphereId = `footerKaleidoscopeSphere${Math.random().toString(36).slice(2)}`;
  const rand = (min, max) => min + Math.random() * (max - min);
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const shapeTypes = ["circle", "sphere", "square", "triangle", "dot"];
  const unitShapes = [];
  const ringShapes = [];

  for (let i = 0; i < 44; i += 1) {
    const radius = rand(36, 515);
    const angle = rand(-11, 11) * (Math.PI / 180);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const size = rand(4, 20);
    const opacity = rand(0.2, 0.82).toFixed(2);
    const strokeWidth = rand(1, 3).toFixed(2);
    const type = i < shapeTypes.length ? shapeTypes[i] : pick(shapeTypes);

    if (type === "circle") {
      unitShapes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" opacity="${opacity}"/>`);
    } else if (type === "sphere") {
      unitShapes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${size.toFixed(1)}" fill="url(#${sphereId})" opacity="${opacity}"/>`);
    } else if (type === "square") {
      const offset = size / -2;
      const rotation = rand(0, 90).toFixed(1);
      unitShapes.push(`<rect x="${(x + offset).toFixed(1)}" y="${(y + offset).toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" opacity="${opacity}" transform="rotate(${rotation} ${x.toFixed(1)} ${y.toFixed(1)})"/>`);
    } else if (type === "triangle") {
      const p1 = `${x.toFixed(1)},${(y - size).toFixed(1)}`;
      const p2 = `${(x + size * 0.9).toFixed(1)},${(y + size * 0.72).toFixed(1)}`;
      const p3 = `${(x - size * 0.9).toFixed(1)},${(y + size * 0.72).toFixed(1)}`;
      unitShapes.push(`<polygon points="${p1} ${p2} ${p3}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" opacity="${opacity}"/>`);
    } else {
      unitShapes.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rand(1.4, 4.2).toFixed(1)}" fill="currentColor" opacity="${opacity}"/>`);
    }
  }

  for (let i = 0; i < 9; i += 1) {
    ringShapes.push(`<circle cx="${centerX}" cy="${centerY}" r="${rand(64, 505).toFixed(1)}" fill="none" stroke="currentColor" stroke-width="${rand(0.7, 1.7).toFixed(1)}" opacity="${rand(0.08, 0.24).toFixed(2)}"/>`);
  }

  const uses = Array.from({ length: wedgeCount }, (_, index) => {
    const rotation = (360 / wedgeCount) * index;
    return `
      <use href="#${unitId}" transform="translate(${centerX} ${centerY}) rotate(${rotation})"/>
      <use href="#${unitId}" transform="translate(${centerX} ${centerY}) rotate(${rotation}) scale(1 -1)"/>
    `;
  }).join("");

  footerArt.innerHTML = `
    <svg class="site-footer-kaleidoscope" viewBox="0 0 ${width} ${height}" role="img" focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="${sphereId}" cx="34%" cy="28%" r="74%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
          <stop offset="55%" stop-color="#ffffff" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.08"/>
        </radialGradient>
        <g id="${unitId}">
          ${unitShapes.join("")}
        </g>
      </defs>
      <rect width="${width}" height="${height}" fill="none"/>
      <g class="footer-kaleidoscope-orbit">${ringShapes.join("")}</g>
      <g class="footer-kaleidoscope-wheel">${uses}</g>
    </svg>
  `;
}

if (footerArtEls.length) {
  footerArtEls.forEach(buildFooterKaleidoscope);

  if ("IntersectionObserver" in window) {
    const footerArtObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    footerArtEls.forEach((footerArt) => footerArtObserver.observe(footerArt));
  } else {
    footerArtEls.forEach((footerArt) => footerArt.classList.add("is-visible"));
  }
}

const siteHeader = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".nav");
const mobileNavMedia = window.matchMedia("(max-width: 820px)");

function setMobileNavState(isOpen) {
  if (!siteHeader || !navToggle || !siteNav) return;

  siteHeader.classList.toggle("is-nav-open", isOpen);
  navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  navToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );

  if (mobileNavMedia.matches) {
    siteNav.hidden = !isOpen;
    siteNav.setAttribute("aria-hidden", isOpen ? "false" : "true");
  } else {
    siteNav.hidden = false;
    siteNav.setAttribute("aria-hidden", "false");
  }
}

function syncMobileNavMode() {
  if (!siteHeader || !navToggle || !siteNav) return;

  document.body.classList.add("nav-ready");

  if (mobileNavMedia.matches) {
    const isOpen = siteHeader.classList.contains("is-nav-open");
    siteNav.hidden = !isOpen;
    siteNav.setAttribute("aria-hidden", isOpen ? "false" : "true");
    navToggle.setAttribute("aria-hidden", "false");
    return;
  }

  siteHeader.classList.remove("is-nav-open");
  siteNav.hidden = false;
  siteNav.setAttribute("aria-hidden", "false");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open navigation menu");
  navToggle.setAttribute("aria-hidden", "true");
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    setMobileNavState(!siteHeader.classList.contains("is-nav-open"));
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a") && mobileNavMedia.matches) {
      setMobileNavState(false);
    }
  });

  if (mobileNavMedia.addEventListener) {
    mobileNavMedia.addEventListener("change", syncMobileNavMode);
  } else {
    mobileNavMedia.addListener(syncMobileNavMode);
  }

  syncMobileNavMode();
}
