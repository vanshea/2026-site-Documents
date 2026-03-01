const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

const rootEl = document.documentElement;
const themeButtons = document.querySelectorAll(".theme-link");
const themeStorageKey = "vsc-site-theme";
const availableThemes = new Set(["theme1", "theme2", "theme3"]);

function applyTheme(theme) {
  const resolvedTheme = availableThemes.has(theme) ? theme : "theme2";
  rootEl.dataset.theme = resolvedTheme;

  themeButtons.forEach((button) => {
    const isActive = button.dataset.theme === resolvedTheme;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

let initialTheme = "theme2";
try {
  const savedTheme = localStorage.getItem(themeStorageKey);
  if (savedTheme && availableThemes.has(savedTheme)) {
    initialTheme = savedTheme;
  }
} catch (error) {
  // Ignore storage access errors and fall back to default theme.
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
      // Ignore storage write errors in restricted browsing contexts.
    }
  });
});

const brandLogoLightImage = document.getElementById("brandLogoLightImage");
const brandLogoDarkSource = document.getElementById("brandLogoDarkSource");
const workGrid = document.querySelector("#work .grid");
const FPO_ASSET_PATTERN = /(^|\/)assets\/fpo-(thumb|large)-/i;

function toSitePath(filePath) {
  if (!filePath) return "";
  if (/^(https?:)?\/\//.test(filePath)) return filePath;
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}

function getWorkCardElements() {
  if (!workGrid) return [];
  return Array.from(workGrid.children).filter((element) =>
    element.classList?.contains("card")
  );
}

function isPlaceholderAssetPath(filePath) {
  const normalized = String(filePath || "")
    .trim()
    .replace(/^\//, "");
  return FPO_ASSET_PATTERN.test(normalized);
}

function setWorkCardPlaceholderState(card, isPlaceholder) {
  if (!card || card.dataset.generated === "true") return;
  card.classList.toggle("is-placeholder", isPlaceholder);
  card.dataset.placeholder = isPlaceholder ? "true" : "false";
}

function sortWorkGridCards() {
  if (!workGrid) return;

  const orderedCards = getWorkCardElements()
    .map((card, index) => ({
      card,
      index,
      rank: card.classList.contains("is-featured")
        ? 0
        : card.classList.contains("is-placeholder")
          ? 2
          : 1
    }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index);

  orderedCards.forEach(({ card }) => {
    workGrid.appendChild(card);
  });
}

function refreshWorkCardState() {
  getWorkCardElements().forEach((card) => {
    if (card.dataset.generated === "true") {
      return;
    }

    const link = card.querySelector(".work-link");
    const thumbSource = link?.querySelector(".card-image")?.getAttribute("src") || "";
    const largeSource = link?.dataset?.lightboxSrc || link?.getAttribute("href") || "";
    const fullscreenSource = link?.dataset?.fullscreenSrc || "";
    const isPlaceholder = [thumbSource, largeSource, fullscreenSource].some(
      isPlaceholderAssetPath
    );

    setWorkCardPlaceholderState(card, isPlaceholder);
  });

  sortWorkGridCards();
}

async function readSiteImageConfig() {
  const sources = ["/api/vscimage/config", "/assets/vscimage/config.json"];

  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;
      return await response.json();
    } catch (error) {
      continue;
    }
  }

  return null;
}

async function loadSiteImageConfig() {
  try {
    const config = await readSiteImageConfig();
    if (!config) {
      refreshWorkCardState();
      applyActiveFilter();
      return;
    }

    if (config.logos?.light && brandLogoLightImage) {
      brandLogoLightImage.src = toSitePath(config.logos.light);
    }

    if (config.logos?.dark && brandLogoDarkSource) {
      brandLogoDarkSource.srcset = toSitePath(config.logos.dark);
    }

    Object.entries(config.projects || {}).forEach(([projectId, projectConfig]) => {
      const link = document.querySelector(
        `.work-link[data-project-id="${projectId}"]`
      );
      if (!link || !projectConfig) return;

      if (projectConfig.title) {
        link.dataset.lightboxTitle = projectConfig.title;
      }

      if (projectConfig.large) {
        const largePath = toSitePath(projectConfig.large);
        link.setAttribute("href", largePath);
        link.dataset.lightboxSrc = largePath;
      }

      if (projectConfig.fullscreen) {
        link.dataset.fullscreenSrc = toSitePath(projectConfig.fullscreen);
      }

      const normalizedDescription = String(projectConfig.description || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 320);
      if (normalizedDescription) {
        link.dataset.lightboxDescription = normalizedDescription;
        const descriptionElement = link.querySelector("p");
        if (descriptionElement) {
          descriptionElement.textContent = normalizedDescription;
        }
      }

      const thumb = link.querySelector(".card-image");
      if (thumb && projectConfig.thumb) {
        thumb.setAttribute("src", toSitePath(projectConfig.thumb));
        thumb.setAttribute(
          "alt",
          `Preview image for ${projectConfig.title || link.dataset.lightboxTitle || "portfolio project"}`
        );
      }
    });

    refreshWorkCardState();
    applyActiveFilter();
  } catch (error) {
    // Keep the site functional using default markup if config is unavailable.
    refreshWorkCardState();
    applyActiveFilter();
  }
}

const projectInquiryForm = document.getElementById("projectInquiryForm");
const projectInquiryStatus = document.getElementById("projectInquiryStatus");
const projectInquirySubmit = document.getElementById("projectInquirySubmit");

function isValidPublicEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseGoogleEntryMap(formEl) {
  const entryName = String(formEl?.dataset.googleEntryName || "").trim();
  const entryEmail = String(formEl?.dataset.googleEntryEmail || "").trim();
  const entryBrief = String(formEl?.dataset.googleEntryBrief || "").trim();
  const entryPattern = /^entry\.\d+$/;

  if (
    entryPattern.test(entryName) &&
    entryPattern.test(entryEmail) &&
    entryPattern.test(entryBrief)
  ) {
    return {
      name: entryName,
      email: entryEmail,
      brief: entryBrief
    };
  }

  const prefillUrl = String(formEl?.dataset.googlePrefillUrl || "").trim();
  if (!prefillUrl) return null;

  try {
    const parsed = new URL(prefillUrl);
    const keys = [];
    parsed.searchParams.forEach((value, key) => {
      if (!entryPattern.test(key)) return;
      if (keys.includes(key)) return;
      keys.push(key);
    });

    if (keys.length < 3) {
      return null;
    }

    return {
      name: keys[0],
      email: keys[1],
      brief: keys[2]
    };
  } catch (error) {
    return null;
  }
}

function setProjectInquiryStatus(message, state = "") {
  if (!projectInquiryStatus) return;
  projectInquiryStatus.textContent = message;

  if (state) {
    projectInquiryStatus.dataset.state = state;
    return;
  }

  delete projectInquiryStatus.dataset.state;
}

async function submitToGoogleForm(action, fieldMap, values) {
  const payload = new URLSearchParams();
  payload.set(fieldMap.name, values.name);
  payload.set(fieldMap.email, values.email);
  payload.set(fieldMap.brief, values.brief);
  payload.set("fvv", "1");
  payload.set("draftResponse", "[]");
  payload.set("pageHistory", "0");
  payload.set("fbzx", String(Date.now()));

  await fetch(action, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    },
    body: payload.toString()
  });
}

if (projectInquiryForm) {
  const googleFormAction = String(
    projectInquiryForm.dataset.googleFormAction || ""
  ).trim();
  const googleFormLink = String(projectInquiryForm.dataset.googleFormLink || "").trim();
  const googleEntryMap = parseGoogleEntryMap(projectInquiryForm);
  const contactLocation =
    window.siteAnalytics?.getElementLocation?.(projectInquiryForm) || "contact";

  if (!googleFormAction || !googleEntryMap) {
    setProjectInquiryStatus(
      googleFormLink
        ? "Form mapping is not configured yet. Add entry IDs or a prefill URL, or use the Google Form link below."
        : "Form mapping is not configured yet.",
      "error"
    );
  }

  projectInquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    window.siteAnalytics?.trackContactClick?.("form", contactLocation);

    const formData = new FormData(projectInquiryForm);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const brief = String(formData.get("brief") || "").trim();

    if (!name || !email || !brief) {
      setProjectInquiryStatus("Please complete all required fields.", "error");
      window.siteAnalytics?.trackContactFormSubmit?.(false);
      return;
    }

    if (!isValidPublicEmail(email)) {
      setProjectInquiryStatus("Please enter a valid email address.", "error");
      window.siteAnalytics?.trackContactFormSubmit?.(false);
      return;
    }

    if (!googleFormAction || !googleEntryMap) {
      setProjectInquiryStatus(
        googleFormLink
          ? "This page is not fully configured yet. Add entry IDs or a prefill URL, or use the Google Form link below."
          : "This page is not fully configured yet.",
        "error"
      );
      window.siteAnalytics?.trackContactFormSubmit?.(false);
      return;
    }

    if (projectInquirySubmit) {
      projectInquirySubmit.setAttribute("disabled", "true");
    }
    setProjectInquiryStatus("Submitting...", "loading");

    try {
      await submitToGoogleForm(googleFormAction, googleEntryMap, {
        name,
        email,
        brief
      });
      projectInquiryForm.reset();
      setProjectInquiryStatus("Thanks. Your inquiry was sent.", "success");
      window.siteAnalytics?.trackContactFormSubmit?.(true);
    } catch (error) {
      setProjectInquiryStatus(
        googleFormLink
          ? "Unable to submit from this page right now. Use the Google Form link below."
          : "Unable to submit from this page right now.",
        "error"
      );
      window.siteAnalytics?.trackContactFormSubmit?.(false);
    } finally {
      if (projectInquirySubmit) {
        projectInquirySubmit.removeAttribute("disabled");
      }
    }
  });
}

const filterButtons = document.querySelectorAll(".filter-btn");
const workLoadMoreButton = document.getElementById("workLoadMore");
const WORK_ROWS_PER_PAGE = 2;
let visibleWorkCards = 0;
let featuredCardHeightFrame = 0;

function getWorkCardsPerPage() {
  if (!workGrid) return 6;

  const computed = window.getComputedStyle(workGrid);
  const template = String(computed.gridTemplateColumns || "").trim();
  const columns = template ? template.split(/\s+/).filter(Boolean).length : 3;
  return Math.max(1, columns) * WORK_ROWS_PER_PAGE;
}

function getFilteredCards() {
  const activeButton = document.querySelector(".filter-btn.active");
  const target = activeButton?.dataset?.filter || "all";
  const cards = getWorkCardElements().filter(
    (card) => !card.classList.contains("is-placeholder")
  );

  return cards.filter((card) => {
    const category = card.dataset.category;
    return target === "all" || category === target;
  });
}

function updateFeaturedCardHeight() {
  if (!workGrid) return;

  const featuredImages = Array.from(
    workGrid.querySelectorAll(".card.is-featured:not(.hide) .card-image")
  );
  if (!featuredImages.length) {
    workGrid.style.removeProperty("--featured-card-image-height");
    return;
  }

  const referenceImage = Array.from(
    workGrid.querySelectorAll(".card:not(.hide):not(.is-featured) .card-image")
  ).find((image) => image.getBoundingClientRect().height > 0);

  if (!referenceImage) {
    workGrid.style.removeProperty("--featured-card-image-height");
    return;
  }

  const referenceHeight = Math.round(referenceImage.getBoundingClientRect().height);
  if (referenceHeight > 0) {
    workGrid.style.setProperty("--featured-card-image-height", `${referenceHeight}px`);
  } else {
    workGrid.style.removeProperty("--featured-card-image-height");
  }
}

function scheduleFeaturedCardHeightUpdate() {
  if (!workGrid) return;
  if (featuredCardHeightFrame) {
    window.cancelAnimationFrame(featuredCardHeightFrame);
  }

  featuredCardHeightFrame = window.requestAnimationFrame(() => {
    featuredCardHeightFrame = 0;
    updateFeaturedCardHeight();
  });
}

function applyActiveFilter() {
  const cards = Array.from(document.querySelectorAll(".card"));
  const filteredCards = getFilteredCards();
  const maxVisible = Math.max(0, visibleWorkCards || getWorkCardsPerPage());
  const visibleSet = new Set(filteredCards.slice(0, maxVisible));

  cards.forEach((card) => {
    const show = visibleSet.has(card);
    card.classList.toggle("hide", !show);
    card.setAttribute("aria-hidden", show ? "false" : "true");
  });

  if (workLoadMoreButton) {
    const hasMore = filteredCards.length > maxVisible;
    workLoadMoreButton.hidden = !hasMore;
    workLoadMoreButton.setAttribute("aria-hidden", hasMore ? "false" : "true");
  }

  scheduleFeaturedCardHeightUpdate();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    visibleWorkCards = getWorkCardsPerPage();
    applyActiveFilter();
  });
});

if (workLoadMoreButton) {
  workLoadMoreButton.addEventListener("click", () => {
    visibleWorkCards += getWorkCardsPerPage();
    applyActiveFilter();
  });
}

if (workGrid) {
  workGrid.addEventListener(
    "load",
    (event) => {
      if (!event.target?.classList?.contains("card-image")) return;
      scheduleFeaturedCardHeightUpdate();
    },
    true
  );
}

let workResizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(workResizeTimer);
  workResizeTimer = setTimeout(() => {
    const perPage = getWorkCardsPerPage();
    const currentPages = Math.max(1, Math.ceil((visibleWorkCards || perPage) / perPage));
    visibleWorkCards = currentPages * perPage;
    applyActiveFilter();
  }, 100);
});

const revealItems = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -8% 0px"
  }
);

revealItems.forEach((item, index) => {
  item.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;
  observer.observe(item);
});

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxFullscreen = document.getElementById("lightboxFullscreen");
const lightboxFullscreenIcon = document.getElementById("lightboxFullscreenIcon");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
let activeLightboxIndex = 0;
let useFullscreenAssets = false;

function getWorkLinks() {
  return Array.from(document.querySelectorAll(".card:not(.hide) .work-link"));
}

function isFullscreenActive() {
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function exitFullscreenSafely() {
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
    return;
  }

  if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  }
}

function updateLightboxFullscreenButton() {
  if (!lightboxFullscreen) return;

  const active = isFullscreenActive();
  lightboxFullscreen.setAttribute(
    "aria-label",
    active ? "Exit fullscreen" : "Enter fullscreen"
  );
  lightboxFullscreen.setAttribute("aria-pressed", active ? "true" : "false");

  if (lightboxFullscreenIcon) {
    lightboxFullscreenIcon.textContent = "⤢";
  }
}

function renderLightboxImage(index) {
  const workLinks = getWorkLinks();
  if (workLinks.length === 0) return;

  const safeIndex = ((index % workLinks.length) + workLinks.length) % workLinks.length;
  const link = workLinks[safeIndex];
  if (!link || !lightboxImage || !lightboxCaption) return;

  const standardSource = link.dataset.lightboxSrc || link.getAttribute("href");
  const fullscreenSource = link.dataset.fullscreenSrc || standardSource;
  const source = useFullscreenAssets ? fullscreenSource : standardSource;
  const title = link.dataset.lightboxTitle || "Selected work sample";
  const inlineDescription = link.querySelector("p")?.textContent || "";
  const description =
    String(link.dataset.lightboxDescription || inlineDescription || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 320) || "";

  activeLightboxIndex = safeIndex;
  lightboxImage.setAttribute("src", source);
  lightboxImage.setAttribute("alt", `Large FPO image for ${title}`);
  if (description) {
    lightboxCaption.textContent = `${title}: ${description} (${safeIndex + 1}/${workLinks.length})`;
  } else {
    lightboxCaption.textContent = `${title} (${safeIndex + 1}/${workLinks.length})`;
  }
}

function openLightbox(index, useFullscreenVersion = false) {
  const workLinks = getWorkLinks();
  if (workLinks.length === 0) return;
  if (!lightbox) return;
  useFullscreenAssets = useFullscreenVersion;
  activeLightboxIndex =
    ((index % workLinks.length) + workLinks.length) % workLinks.length;
  renderLightboxImage(activeLightboxIndex);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  updateLightboxFullscreenButton();
}

function requestElementFullscreen(element) {
  if (!element) return;

  if (element.requestFullscreen) {
    element.requestFullscreen().catch(() => {});
    return;
  }

  if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
}

function closeLightbox() {
  if (!lightbox) return;

  if (isFullscreenActive()) {
    exitFullscreenSafely();
  }

  useFullscreenAssets = false;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  updateLightboxFullscreenButton();
}

if (lightbox && lightboxImage && lightboxCaption) {
  if (workGrid) {
    workGrid.addEventListener("click", (event) => {
      const fullscreenButton = event.target.closest(".card-fullscreen");
      if (fullscreenButton && workGrid.contains(fullscreenButton)) {
        event.preventDefault();
        event.stopPropagation();

        const card = fullscreenButton.closest(".card");
        const link = card ? card.querySelector(".work-link") : null;
        const workLinks = getWorkLinks();
        const index = workLinks.indexOf(link);
        if (index < 0) return;

        openLightbox(index, true);
        requestElementFullscreen(lightbox);
        return;
      }

      const link = event.target.closest(".work-link");
      if (!link || !workGrid.contains(link)) return;
      event.preventDefault();
      const workLinks = getWorkLinks();
      const index = workLinks.indexOf(link);
      if (index < 0) return;
      openLightbox(index, false);
    });
  }

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightboxFullscreen) {
    lightboxFullscreen.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!lightbox.classList.contains("is-open")) return;

      if (isFullscreenActive()) {
        exitFullscreenSafely();
        return;
      }

      useFullscreenAssets = true;
      renderLightboxImage(activeLightboxIndex);
      requestElementFullscreen(lightbox);
      updateLightboxFullscreenButton();
    });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", () => {
      const workLinks = getWorkLinks();
      if (workLinks.length === 0) return;
      activeLightboxIndex =
        (activeLightboxIndex - 1 + workLinks.length) % workLinks.length;
      renderLightboxImage(activeLightboxIndex);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", () => {
      const workLinks = getWorkLinks();
      if (workLinks.length === 0) return;
      activeLightboxIndex = (activeLightboxIndex + 1) % workLinks.length;
      renderLightboxImage(activeLightboxIndex);
    });
  }

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    const workLinks = getWorkLinks();
    const isOpen = lightbox.classList.contains("is-open");
    if (event.key === "Escape" && isOpen) {
      if (isFullscreenActive()) return;
      closeLightbox();
    }
    if (event.key === "ArrowLeft" && isOpen && workLinks.length > 0) {
      activeLightboxIndex =
        (activeLightboxIndex - 1 + workLinks.length) % workLinks.length;
      renderLightboxImage(activeLightboxIndex);
    }
    if (event.key === "ArrowRight" && isOpen && workLinks.length > 0) {
      activeLightboxIndex = (activeLightboxIndex + 1) % workLinks.length;
      renderLightboxImage(activeLightboxIndex);
    }
  });

  document.addEventListener("fullscreenchange", () => {
    if (!lightbox.classList.contains("is-open")) {
      updateLightboxFullscreenButton();
      return;
    }

    useFullscreenAssets = isFullscreenActive();
    renderLightboxImage(activeLightboxIndex);
    updateLightboxFullscreenButton();
  });

  document.addEventListener("webkitfullscreenchange", () => {
    if (!lightbox.classList.contains("is-open")) {
      updateLightboxFullscreenButton();
      return;
    }

    useFullscreenAssets = isFullscreenActive();
    renderLightboxImage(activeLightboxIndex);
    updateLightboxFullscreenButton();
  });
}

refreshWorkCardState();
visibleWorkCards = getWorkCardsPerPage();
applyActiveFilter();
loadSiteImageConfig();
