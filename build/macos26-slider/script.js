const themes = [
  {
    id: "clear",
    label: "Clear Glass",
    title: "Clear Glass",
    copy: "Bright iOS-style translucency, soft refractions, and a cool floating surface."
  },
  {
    id: "tinted",
    label: "Tinted Glass",
    title: "Tinted Glass",
    copy: "Warm adaptive tint, saturated glow, and a lens-like pane over color."
  },
  {
    id: "aurora",
    label: "Aurora",
    title: "Liquid Aurora",
    copy: "Violet light, mint edges, and a vivid night-sky reflection."
  },
  {
    id: "ember",
    label: "Ember",
    title: "Liquid Ember",
    copy: "Warm glass, copper glow, and sunset color suspended in motion."
  }
];

const root = document.documentElement;
const slider = document.querySelector("#themeSlider");
const title = document.querySelector("#themeTitle");
const copy = document.querySelector("#themeCopy");
const badge = document.querySelector("#themeBadge");
const options = Array.from(document.querySelectorAll(".theme-option"));

function setTheme(index) {
  const nextIndex = Math.max(0, Math.min(themes.length - 1, Number(index)));
  const theme = themes[nextIndex];

  root.dataset.theme = theme.id;
  root.style.setProperty("--fill", String(nextIndex));
  slider.value = String(nextIndex);
  slider.setAttribute("aria-valuetext", theme.label);
  title.textContent = theme.title;
  copy.textContent = theme.copy;
  badge.textContent = theme.label;

  options.forEach((option, optionIndex) => {
    const isActive = optionIndex === nextIndex;
    option.classList.toggle("active", isActive);
    option.setAttribute("aria-selected", String(isActive));
    option.tabIndex = isActive ? 0 : -1;
  });
}

slider.addEventListener("input", (event) => {
  setTheme(event.target.value);
});

options.forEach((option) => {
  option.addEventListener("click", () => {
    setTheme(option.dataset.themeIndex);
  });

  option.addEventListener("keydown", (event) => {
    const currentIndex = Number(slider.value);

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setTheme(currentIndex + 1);
      options[Number(slider.value)].focus();
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setTheme(currentIndex - 1);
      options[Number(slider.value)].focus();
    }
  });
});

setTheme(0);
