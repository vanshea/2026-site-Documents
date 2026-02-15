const PROJECTS = [
  { id: "northline", label: "Northline Coffee" },
  { id: "atlas", label: "Atlas Wellness" },
  { id: "city_transit", label: "City Transit Posters" },
  { id: "wren", label: "Wren Studio" },
  { id: "hollow_creek", label: "Hollow Creek Cider" },
  { id: "field_notes", label: "Field Notes Covers" }
];

const state = {
  config: null,
  files: [],
  apiAvailable: true,
  apiOrigin: window.location.origin
};

const API_ORIGIN_CANDIDATES = (() => {
  const origins = [window.location.origin];
  const localhostOrigin = "http://localhost:3000";
  const loopbackOrigin = "http://127.0.0.1:3000";

  if (!origins.includes(localhostOrigin)) origins.push(localhostOrigin);
  if (!origins.includes(loopbackOrigin)) origins.push(loopbackOrigin);

  return origins;
})();

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function toAssetUrl(filePath) {
  if (!filePath) return "";
  if (/^(https?:)?\/\//.test(filePath)) return filePath;
  return filePath.startsWith("/") ? filePath : `/${filePath}`;
}

const uploadForm = document.getElementById("uploadForm");
const uploadMsg = document.getElementById("uploadMsg");
const generatedList = document.getElementById("generatedList");
const configForm = document.getElementById("configForm");
const configMsg = document.getElementById("configMsg");
const logoLightSelect = document.getElementById("logoLightSelect");
const logoDarkSelect = document.getElementById("logoDarkSelect");
const projectRows = document.getElementById("projectRows");
const previewGrid = document.getElementById("previewGrid");

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.classList.remove("ok", "error");
  if (type) element.classList.add(type);
}

async function fetchJson(url, options) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new Error(
      "Cannot reach VSCimage API. Start the app with npm run dev and reload this page."
    );
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload;
}

async function detectApiOrigin() {
  for (const origin of API_ORIGIN_CANDIDATES) {
    try {
      const response = await fetch(`${origin}/api/vscimage/config`);
      if (!response.ok) continue;
      await response.json();
      return origin;
    } catch (error) {
      continue;
    }
  }

  return null;
}

function collectConfigImagePaths(config) {
  const files = new Set();
  if (!config) return [];

  if (config.logos?.light) files.add(config.logos.light);
  if (config.logos?.dark) files.add(config.logos.dark);

  Object.values(config.projects || {}).forEach((project) => {
    if (!project) return;
    if (project.thumb) files.add(project.thumb);
    if (project.large) files.add(project.large);
    if (project.fullscreen) files.add(project.fullscreen);
  });

  return Array.from(files).sort((a, b) => a.localeCompare(b));
}

function ensureConfigShape(config) {
  const merged = cloneJson(config || {});
  merged.logos = merged.logos || {};
  merged.projects = merged.projects || {};

  if (!merged.logos.light) merged.logos.light = "";
  if (!merged.logos.dark) merged.logos.dark = "";

  PROJECTS.forEach((project) => {
    merged.projects[project.id] = merged.projects[project.id] || {};
    merged.projects[project.id].title =
      merged.projects[project.id].title || project.label;
    merged.projects[project.id].thumb = merged.projects[project.id].thumb || "";
    merged.projects[project.id].large = merged.projects[project.id].large || "";
    merged.projects[project.id].fullscreen =
      merged.projects[project.id].fullscreen || "";
  });

  return merged;
}

function renderSelect(selectElement, selectedValue) {
  selectElement.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select image...";
  selectElement.appendChild(placeholder);

  const files = [...new Set(state.files)];
  files.forEach((filePath) => {
    const option = document.createElement("option");
    option.value = filePath;
    option.textContent = filePath;
    selectElement.appendChild(option);
  });

  if (selectedValue && !files.includes(selectedValue)) {
    const extra = document.createElement("option");
    extra.value = selectedValue;
    extra.textContent = `${selectedValue} (missing)`;
    selectElement.appendChild(extra);
  }

  selectElement.value = selectedValue || "";
}

function buildProjectRows() {
  projectRows.innerHTML = "";
  PROJECTS.forEach((project) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${project.label}</td>
      <td><select data-project="${project.id}" data-field="thumb"></select></td>
      <td><select data-project="${project.id}" data-field="large"></select></td>
      <td><select data-project="${project.id}" data-field="fullscreen"></select></td>
    `;
    projectRows.appendChild(row);
  });
}

function renderConfigControls() {
  if (!state.config) return;

  renderSelect(logoLightSelect, state.config.logos.light);
  renderSelect(logoDarkSelect, state.config.logos.dark);

  const projectSelects = projectRows.querySelectorAll("select[data-project]");
  projectSelects.forEach((selectElement) => {
    const projectId = selectElement.dataset.project;
    const field = selectElement.dataset.field;
    const value = state.config.projects[projectId]?.[field] || "";
    renderSelect(selectElement, value);
  });
}

function renderPreview() {
  if (!state.config) return;

  const cards = [];
  cards.push({
    title: "Logo (Light Theme)",
    image: state.config.logos.light
  });
  cards.push({
    title: "Logo (Dark Theme)",
    image: state.config.logos.dark
  });

  PROJECTS.forEach((project) => {
    const projectConfig = state.config.projects[project.id];
    cards.push({
      title: `${project.label} Thumb`,
      image: projectConfig.thumb
    });
    cards.push({
      title: `${project.label} Large`,
      image: projectConfig.large
    });
    cards.push({
      title: `${project.label} Fullscreen`,
      image: projectConfig.fullscreen
    });
  });

  previewGrid.innerHTML = "";
  cards.forEach((card) => {
    const element = document.createElement("article");
    element.className = "preview-card";
    element.innerHTML = `
      <h3>${card.title}</h3>
      <img src="${toAssetUrl(card.image)}" alt="${card.title}" loading="lazy" />
      <p class="path">${card.image || "(not set)"}</p>
    `;
    previewGrid.appendChild(element);
  });
}

function collectConfigFromForm() {
  const nextConfig = cloneJson(state.config);

  nextConfig.logos.light = logoLightSelect.value;
  nextConfig.logos.dark = logoDarkSelect.value;

  const projectSelects = projectRows.querySelectorAll("select[data-project]");
  projectSelects.forEach((selectElement) => {
    const projectId = selectElement.dataset.project;
    const field = selectElement.dataset.field;
    nextConfig.projects[projectId][field] = selectElement.value;
  });

  return nextConfig;
}

function renderGeneratedOutputs(payload) {
  generatedList.innerHTML = "";
  const original = document.createElement("li");
  original.innerHTML = `Original saved: <a href="${toAssetUrl(payload.original)}" target="_blank" rel="noreferrer">${payload.original}</a>`;
  generatedList.appendChild(original);

  Object.entries(payload.outputs || {}).forEach(([key, filePath]) => {
    const item = document.createElement("li");
    item.innerHTML = `${key}: <a href="${toAssetUrl(filePath)}" target="_blank" rel="noreferrer">${filePath}</a>`;
    generatedList.appendChild(item);
  });
}

async function reloadData() {
  let config;
  let files = [];
  const apiOrigin = await detectApiOrigin();

  state.apiAvailable = Boolean(apiOrigin);
  state.apiOrigin = apiOrigin || window.location.origin;

  if (!state.apiAvailable) {
    config = await fetchJson("/assets/vscimage/config.json");
    setStatus(
      configMsg,
      "API unavailable. Running in read-only mode. Start backend server with npm run dev and open http://localhost:3000/vscimage.",
      "error"
    );
  } else {
    try {
      config = await fetchJson(`${state.apiOrigin}/api/vscimage/config`);
      const filesPayload = await fetchJson(`${state.apiOrigin}/api/vscimage/files`);
      files = Array.isArray(filesPayload.files) ? filesPayload.files : [];
    } catch (error) {
      state.apiAvailable = false;
      try {
        config = await fetchJson("/assets/vscimage/config.json");
      } catch (fallbackError) {
        config = {};
      }
      files = collectConfigImagePaths(config);
      setStatus(
        configMsg,
        "File list API unavailable. Running in read-only mode.",
        "error"
      );
    }
  }

  if (!files.length) {
    files = collectConfigImagePaths(config);
  }

  state.config = ensureConfigShape(config);
  state.files = files;

  buildProjectRows();
  renderConfigControls();
  renderPreview();

  const uploadButton = uploadForm?.querySelector('button[type="submit"]');
  const saveButton = configForm?.querySelector('button[type="submit"]');
  if (uploadButton) uploadButton.disabled = !state.apiAvailable;
  if (saveButton) saveButton.disabled = !state.apiAvailable;
}

if (uploadForm) {
  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(uploadMsg, "", "");
    generatedList.innerHTML = "";

    if (!state.apiAvailable) {
      setStatus(
        uploadMsg,
        "Upload is unavailable in read-only mode. Start backend server with npm run dev and open http://localhost:3000/vscimage.",
        "error"
      );
      return;
    }

    const fileInput = document.getElementById("imageFile");
    const nameInput = document.getElementById("assetName");
    const checked = Array.from(
      uploadForm.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => input.value);

    if (!fileInput.files?.[0]) {
      setStatus(uploadMsg, "Select an image to upload.", "error");
      return;
    }

    if (checked.length === 0) {
      setStatus(uploadMsg, "Select at least one output type.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", fileInput.files[0]);
    formData.append("name", nameInput.value.trim());
    formData.append("outputs", checked.join(","));

    try {
      setStatus(uploadMsg, "Generating image outputs...", "");
      const payload = await fetchJson(`${state.apiOrigin}/api/vscimage/upload`, {
        method: "POST",
        body: formData
      });
      renderGeneratedOutputs(payload);
      setStatus(uploadMsg, "Files generated successfully.", "ok");
      await reloadData();
    } catch (error) {
      setStatus(uploadMsg, error.message, "error");
    }
  });
}

if (configForm) {
  configForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!state.apiAvailable) {
      setStatus(
        configMsg,
        "Save is unavailable in read-only mode. Start backend server with npm run dev and open http://localhost:3000/vscimage.",
        "error"
      );
      return;
    }

    try {
      const nextConfig = collectConfigFromForm();
      await fetchJson(`${state.apiOrigin}/api/vscimage/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextConfig)
      });
      state.config = nextConfig;
      renderPreview();
      setStatus(configMsg, "Site image configuration saved.", "ok");
    } catch (error) {
      setStatus(configMsg, error.message, "error");
    }
  });
}

reloadData().catch((error) => {
  setStatus(configMsg, error.message, "error");
});
