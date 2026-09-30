(() => {
  const root = document.documentElement;
  const themes = new Set(["theme1", "theme3", "theme4", "theme5"]);
  const storageKey = "vsc-site-theme-v2";
  const themeColors = {
    theme1: "#eef7ff",
    theme3: "#090909",
    theme4: "#fffcf3",
    theme5: "#fff7eb",
  };
  const darkBrowser = window.matchMedia("(prefers-color-scheme: dark)");

  function isDarkTheme(theme) {
    return theme === "theme3" || (theme === "theme1" && darkBrowser.matches);
  }

  function applyTheme(theme, persist = false) {
    const resolvedTheme = themes.has(theme) ? theme : "theme4";
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = isDarkTheme(resolvedTheme) ? "dark" : "light";

    document.querySelectorAll('input[name="color-theme"]').forEach((input) => {
      input.checked = input.value === resolvedTheme;
    });

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = isDarkTheme(resolvedTheme) ? "#090909" : themeColors[resolvedTheme];
    }

    if (persist) {
      try {
        window.localStorage.setItem(storageKey, resolvedTheme);
      } catch (error) {
        // The selected theme still applies when storage is unavailable.
      }
    }
  }

  let initialTheme = themes.has(root.dataset.theme) ? root.dataset.theme : "theme4";
  try {
    const savedTheme = [storageKey, "vsc-site-theme"]
      .map((key) => window.localStorage.getItem(key))
      .find((theme) => themes.has(theme));
    if (savedTheme) initialTheme = savedTheme;
  } catch (error) {
    // Keep the WordPress default when storage is unavailable.
  }
  applyTheme(initialTheme);

  document.querySelectorAll('input[name="color-theme"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) applyTheme(input.value, true);
    });
  });

  const updateClearTheme = () => {
    if (root.dataset.theme === "theme1") applyTheme("theme1");
  };
  if (darkBrowser.addEventListener) {
    darkBrowser.addEventListener("change", updateClearTheme);
  } else if (darkBrowser.addListener) {
    darkBrowser.addListener(updateClearTheme);
  }

  const siteHeader = document.querySelector(".site-header");
  const navToggle = document.querySelector(".nav-toggle");
  const siteNav = document.querySelector(".nav");
  const mobileBreakpoint = window.matchMedia("(max-width: 820px)");

  function setMobileNav(open) {
    if (!siteHeader || !navToggle || !siteNav) return;
    siteHeader.classList.toggle("is-nav-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    siteNav.hidden = mobileBreakpoint.matches && !open;
  }

  function syncNavigation() {
    if (!siteHeader || !navToggle || !siteNav) return;
    document.body.classList.add("nav-ready");
    if (mobileBreakpoint.matches) {
      setMobileNav(siteHeader.classList.contains("is-nav-open"));
    } else {
      siteHeader.classList.remove("is-nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
      siteNav.hidden = false;
    }
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", () => {
      setMobileNav(!siteHeader.classList.contains("is-nav-open"));
    });
    siteNav.addEventListener("click", (event) => {
      if (event.target.closest("a") && mobileBreakpoint.matches) setMobileNav(false);
    });
    mobileBreakpoint.addEventListener?.("change", syncNavigation);
    syncNavigation();
  }

  const footerWave = document.querySelector("[data-footer-wave]");
  const waveToggle = footerWave?.querySelector(".footer-wave-toggle");
  function toggleWave() {
    if (!footerWave || !waveToggle) return;
    const isPaused = footerWave.classList.toggle("is-paused");
    waveToggle.textContent = isPaused ? "Play wave" : "Pause wave";
    waveToggle.setAttribute("aria-label", isPaused ? "Play footer wave animation" : "Pause footer wave animation");
    waveToggle.setAttribute("aria-pressed", isPaused ? "false" : "true");
  }
  waveToggle?.addEventListener("click", toggleWave);
  footerWave?.addEventListener("click", (event) => {
    if (!event.target.closest("button")) toggleWave();
  });

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
