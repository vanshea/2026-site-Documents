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

const THUMB_CARD_MIN_WIDTH = 210;
const THUMB_ROWS_PER_BATCH = 3;

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

const IMAGE_FILE_EXT_PATTERN = /\.(png|jpe?g|webp|gif|svg|avif)$/i;

const uploadForm = document.getElementById("uploadForm");
const uploadMsg = document.getElementById("uploadMsg");
const generatedList = document.getElementById("generatedList");
const imageFileInput = document.getElementById("imageFile");
const imageFolderInput = document.getElementById("imageFolder");
const assetNameInput = document.getElementById("assetName");
const configForm = document.getElementById("configForm");
const configMsg = document.getElementById("configMsg");
const logoLightSelect = document.getElementById("logoLightSelect");
const logoDarkSelect = document.getElementById("logoDarkSelect");
const projectRows = document.getElementById("projectRows");
const previewGrid = document.getElementById("previewGrid");
const thumbAccordion = document.getElementById("thumbAccordion");

if (imageFileInput && imageFolderInput) {
  imageFileInput.addEventListener("change", () => {
    if (imageFileInput.files?.length) {
      imageFolderInput.value = "";
    }
  });

  imageFolderInput.addEventListener("change", () => {
    if (imageFolderInput.files?.length) {
      imageFileInput.value = "";
    }
  });
}

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.classList.remove("ok", "error");
  if (type) element.classList.add(type);
}

function sanitizeAssetName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizeDescription(value, maxLength = 320) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function stripExtension(fileName) {
  return String(fileName || "").replace(/\.[^.]+$/, "");
}

function isImageFile(file) {
  if (!file) return false;
  const mime = String(file.type || "").trim().toLowerCase();
  if (mime.startsWith("image/")) return true;
  return IMAGE_FILE_EXT_PATTERN.test(String(file.name || ""));
}

function toDisplaySourceName(file, index = 0) {
  if (!file) return `image-${index + 1}`;
  return String(file.webkitRelativePath || file.name || `image-${index + 1}`).trim();
}

function collectUploadFiles() {
  const folderFiles = Array.from(imageFolderInput?.files || []).filter(isImageFile);
  if (folderFiles.length) {
    return folderFiles.sort((left, right) =>
      toDisplaySourceName(left).localeCompare(toDisplaySourceName(right))
    );
  }

  const singleFile = imageFileInput?.files?.[0];
  if (isImageFile(singleFile)) {
    return [singleFile];
  }

  return [];
}

function buildAssetNameForFile(file, namePrefix, index, totalFiles = 1) {
  if (namePrefix && totalFiles === 1) {
    return namePrefix;
  }

  const rawName = toDisplaySourceName(file, index)
    .replaceAll("\\", "/")
    .split("/")
    .join("-");
  const stem = sanitizeAssetName(stripExtension(rawName)) || `image-${index + 1}`;
  return namePrefix ? sanitizeAssetName(`${namePrefix}-${stem}`) : stem;
}

function appendGeneratedOutputLine(label, value, className = "", isLink = true) {
  const item = document.createElement("li");
  if (className) item.className = className;

  const prefix = document.createElement("span");
  prefix.textContent = `${label}: `;
  item.appendChild(prefix);

  if (value && isLink) {
    const link = document.createElement("a");
    link.href = toAssetUrl(value);
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = value;
    item.appendChild(link);
  } else {
    const fallback = document.createElement("span");
    fallback.textContent = value || "(none)";
    item.appendChild(fallback);
  }

  generatedList.appendChild(item);
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

  (config.gallery || []).forEach((item) => {
    if (!item) return;
    if (item.thumb) files.add(item.thumb);
    if (item.large) files.add(item.large);
    if (item.fullscreen) files.add(item.fullscreen);
  });

  return Array.from(files).sort((a, b) => a.localeCompare(b));
}

function normalizeGalleryEntries(entries) {
  const rows = Array.isArray(entries) ? entries : [];
  const seen = new Set();

  return rows
    .map((entry, index) => {
      const thumb = String(entry?.thumb || "").trim();
      if (!thumb) return null;

      const id = String(entry?.id || `gallery-${index + 1}`).trim();
      const title = String(entry?.title || id)
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120);
      const description = normalizeDescription(
        entry?.description || "Generated in VSCimage."
      );
      const large = String(entry?.large || thumb).trim() || thumb;
      const fullscreen = String(entry?.fullscreen || large || thumb).trim() || large;
      const createdAt = String(entry?.createdAt || "").trim();

      const dedupeKey = `${thumb}::${large}::${fullscreen}`;
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);

      return {
        id,
        title: title || id,
        description,
        thumb,
        large,
        fullscreen,
        createdAt
      };
    })
    .filter(Boolean);
}

function ensureConfigShape(config) {
  const merged = cloneJson(config || {});
  merged.logos = merged.logos || {};
  merged.projects = merged.projects || {};
  merged.gallery = normalizeGalleryEntries(merged.gallery);

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
    merged.projects[project.id].description = normalizeDescription(
      merged.projects[project.id].description || ""
    );
  });

  return merged;
}

function buildThumbnailCard(entry) {
  const card = document.createElement("article");
  card.className = "thumb-card";

  const image = document.createElement("img");
  image.src = toAssetUrl(entry.thumb);
  image.alt = entry.title;
  image.loading = "lazy";

  const title = document.createElement("h3");
  title.textContent = entry.title;

  const path = document.createElement("p");
  path.className = "path";
  path.textContent = entry.thumb;

  const link = document.createElement("a");
  link.href = toAssetUrl(entry.large || entry.thumb);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Open large image";

  card.appendChild(image);
  card.appendChild(title);
  card.appendChild(path);
  card.appendChild(link);
  return card;
}

function getThumbBatchSize() {
  if (!thumbAccordion) return 12;

  const availableWidth =
    thumbAccordion.clientWidth ||
    thumbAccordion.parentElement?.clientWidth ||
    window.innerWidth ||
    1024;
  const columnCount = Math.max(1, Math.floor(availableWidth / THUMB_CARD_MIN_WIDTH));
  return columnCount * THUMB_ROWS_PER_BATCH;
}

function renderThumbAccordion() {
  if (!thumbAccordion || !state.config) return;

  const entries = normalizeGalleryEntries(state.config.gallery);
  thumbAccordion.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "thumb-empty";
    empty.textContent = "No generated thumbnails yet. Upload an image to start the gallery.";
    thumbAccordion.appendChild(empty);
    return;
  }

  const batchSize = Math.max(1, getThumbBatchSize());

  const batches = [];
  for (let i = 0; i < entries.length; i += batchSize) {
    batches.push(entries.slice(i, i + batchSize));
  }

  const firstBatch = document.createElement("div");
  firstBatch.className = "thumb-grid";
  batches[0].forEach((entry) => {
    firstBatch.appendChild(buildThumbnailCard(entry));
  });
  thumbAccordion.appendChild(firstBatch);

  batches.slice(1).forEach((batch, index) => {
    const start = index * batchSize + batchSize + 1;
    const end = start + batch.length - 1;

    const details = document.createElement("details");
    details.className = "thumb-batch";
    details.innerHTML = `
      <summary>Show thumbnails ${start}-${end}</summary>
    `;

    const grid = document.createElement("div");
    grid.className = "thumb-grid";
    batch.forEach((entry) => {
      grid.appendChild(buildThumbnailCard(entry));
    });

    details.appendChild(grid);
    thumbAccordion.appendChild(details);
  });
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
      <td>
        <textarea
          class="project-description"
          data-project="${project.id}"
          data-field="description"
          rows="3"
          placeholder="Description for fullscreen image"
        ></textarea>
      </td>
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

  const projectDescriptions = projectRows.querySelectorAll("textarea[data-project]");
  projectDescriptions.forEach((textareaElement) => {
    const projectId = textareaElement.dataset.project;
    const value = state.config.projects[projectId]?.description || "";
    textareaElement.value = value;
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

  const projectDescriptions = projectRows.querySelectorAll("textarea[data-project]");
  projectDescriptions.forEach((textareaElement) => {
    const projectId = textareaElement.dataset.project;
    nextConfig.projects[projectId].description = normalizeDescription(
      textareaElement.value,
      320
    );
  });

  return nextConfig;
}

function renderGeneratedOutputs(successfulEntries, failedEntries = []) {
  generatedList.innerHTML = "";

  successfulEntries.forEach((entry, index) => {
    const header = document.createElement("li");
    header.className = "generated-heading";
    if (successfulEntries.length > 1) {
      header.textContent = `${index + 1}. ${entry.sourceName}`;
    } else {
      header.textContent = entry.sourceName;
    }
    generatedList.appendChild(header);

    appendGeneratedOutputLine("Original saved", entry.payload.original);

    Object.entries(entry.payload.outputs || {}).forEach(([key, filePath]) => {
      appendGeneratedOutputLine(key, filePath);
    });
  });

  failedEntries.forEach((failedEntry) => {
    appendGeneratedOutputLine(
      failedEntry.sourceName,
      failedEntry.error,
      "generated-error",
      false
    );
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
  renderThumbAccordion();

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

    const submitButton = uploadForm.querySelector('button[type="submit"]');
    const selectedFiles = collectUploadFiles();
    const namePrefix = sanitizeAssetName(assetNameInput?.value || "");
    const checked = Array.from(
      uploadForm.querySelectorAll('input[type="checkbox"]:checked')
    ).map((input) => input.value);

    if (!selectedFiles.length) {
      setStatus(uploadMsg, "Select a source image or folder to upload.", "error");
      return;
    }

    if (checked.length === 0) {
      setStatus(uploadMsg, "Select at least one output type.", "error");
      return;
    }

    const successfulEntries = [];
    const failedEntries = [];

    try {
      if (submitButton) submitButton.disabled = true;

      for (let index = 0; index < selectedFiles.length; index += 1) {
        const currentFile = selectedFiles[index];
        const sourceName = toDisplaySourceName(currentFile, index);
        const generatedName = buildAssetNameForFile(
          currentFile,
          namePrefix,
          index,
          selectedFiles.length
        );

        const formData = new FormData();
        formData.append("image", currentFile);
        formData.append("name", generatedName);
        formData.append("outputs", checked.join(","));

        setStatus(
          uploadMsg,
          `Generating ${index + 1}/${selectedFiles.length}: ${sourceName}`,
          ""
        );

        try {
          const payload = await fetchJson(`${state.apiOrigin}/api/vscimage/upload`, {
            method: "POST",
            body: formData
          });
          successfulEntries.push({ sourceName, payload });
        } catch (error) {
          failedEntries.push({ sourceName, error: error.message });
        }

        renderGeneratedOutputs(successfulEntries, failedEntries);
      }

      if (successfulEntries.length) {
        await reloadData();
      }

      if (successfulEntries.length && !failedEntries.length) {
        const label = successfulEntries.length === 1 ? "image" : "images";
        setStatus(
          uploadMsg,
          `Batch complete. ${successfulEntries.length} ${label} generated successfully.`,
          "ok"
        );
      } else if (successfulEntries.length && failedEntries.length) {
        setStatus(
          uploadMsg,
          `Batch complete with errors. ${successfulEntries.length} succeeded, ${failedEntries.length} failed.`,
          "error"
        );
      } else {
        setStatus(uploadMsg, "Batch failed. No images were generated.", "error");
      }
    } catch (error) {
      setStatus(uploadMsg, error.message, "error");
    } finally {
      if (submitButton) submitButton.disabled = !state.apiAvailable;
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
      renderThumbAccordion();
      setStatus(configMsg, "Site image configuration saved.", "ok");
    } catch (error) {
      setStatus(configMsg, error.message, "error");
    }
  });
}

let thumbResizeTimer = null;
window.addEventListener("resize", () => {
  if (!state.config) return;
  clearTimeout(thumbResizeTimer);
  thumbResizeTimer = setTimeout(() => {
    renderThumbAccordion();
  }, 120);
});

reloadData().catch((error) => {
  setStatus(configMsg, error.message, "error");
});
