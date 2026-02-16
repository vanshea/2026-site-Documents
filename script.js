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

function toSitePath(filePath) {
  if (!filePath) return "";
  if (/^(https?:)?\/\//.test(filePath)) return filePath;
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
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
    if (!config) return;

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

      const thumb = link.querySelector(".card-image");
      if (thumb && projectConfig.thumb) {
        thumb.setAttribute("src", toSitePath(projectConfig.thumb));
        thumb.setAttribute(
          "alt",
          `Preview image for ${projectConfig.title || link.dataset.lightboxTitle || "portfolio project"}`
        );
      }
    });
  } catch (error) {
    // Keep the site functional using default markup if config is unavailable.
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
const cards = document.querySelectorAll(".card");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.filter;

    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    cards.forEach((card) => {
      const category = card.dataset.category;
      const show = target === "all" || category === target;
      card.classList.toggle("hide", !show);
      card.setAttribute("aria-hidden", show ? "false" : "true");
    });
  });
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
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const workLinks = document.querySelectorAll(".work-link");
const cardFullscreenButtons = document.querySelectorAll(".card-fullscreen");
let activeLightboxIndex = 0;
let useFullscreenAssets = false;

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

function renderLightboxImage(index) {
  const link = workLinks[index];
  if (!link || !lightboxImage || !lightboxCaption) return;

  const standardSource = link.dataset.lightboxSrc || link.getAttribute("href");
  const fullscreenSource = link.dataset.fullscreenSrc || standardSource;
  const source = useFullscreenAssets ? fullscreenSource : standardSource;
  const title = link.dataset.lightboxTitle || "Selected work sample";

  lightboxImage.setAttribute("src", source);
  lightboxImage.setAttribute("alt", `Large FPO image for ${title}`);
  lightboxCaption.textContent = `${title} (${index + 1}/${workLinks.length})`;
}

function openLightbox(index, useFullscreenVersion = false) {
  if (!lightbox) return;
  useFullscreenAssets = useFullscreenVersion;
  activeLightboxIndex = index;
  renderLightboxImage(activeLightboxIndex);
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
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
}

if (lightbox && lightboxImage && lightboxCaption) {
  workLinks.forEach((link, index) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openLightbox(index, false);
    });
  });

  cardFullscreenButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const card = button.closest(".card");
      const link = card ? card.querySelector(".work-link") : null;
      const index = Array.from(workLinks).indexOf(link);

      if (index < 0) return;
      openLightbox(index, true);
      requestElementFullscreen(lightbox);
    });
  });

  if (lightboxClose) {
    lightboxClose.addEventListener("click", closeLightbox);
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener("click", () => {
      activeLightboxIndex =
        (activeLightboxIndex - 1 + workLinks.length) % workLinks.length;
      renderLightboxImage(activeLightboxIndex);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener("click", () => {
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
}

loadSiteImageConfig();
