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
  apiOrigin: window.location.origin,
  editorEntryId: "",
  editorMode: "single",
  editorBatchIds: [],
  editorPreviewUrl: "",
  galleryBusyId: "",
  galleryBusyAction: "",
  thumbSectionOpen: {
    process: false
  },
  thumbBatchOpen: {},
  selectedEntryIds: new Set()
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
const uploadCardDescriptionInput = document.getElementById("uploadCardDescription");
const uploadCategoryInput = document.getElementById("uploadCategory");
const uploadHomepageVisibleInput = document.getElementById("uploadHomepageVisible");
const uploadButton = document.getElementById("uploadButton");
const configForm = document.getElementById("configForm");
const configMsg = document.getElementById("configMsg");
const logoLightSelect = document.getElementById("logoLightSelect");
const logoDarkSelect = document.getElementById("logoDarkSelect");
const projectRows = document.getElementById("projectRows");
const previewGrid = document.getElementById("previewGrid");
const thumbAccordion = document.getElementById("thumbAccordion");
const thumbMsg = document.getElementById("thumbMsg");
const thumbEditorDialog = document.getElementById("thumbEditorDialog");
const thumbEditorForm = document.getElementById("thumbEditorForm");
const thumbEditorKicker = document.getElementById("thumbEditorKicker");
const thumbEditorHeading = document.getElementById("thumbEditorHeading");
const thumbEditorModeNote = document.getElementById("thumbEditorModeNote");
const thumbEditorClose = document.getElementById("thumbEditorClose");
const thumbEditorSave = document.getElementById("thumbEditorSave");
const thumbEditorDelete = document.getElementById("thumbEditorDelete");
const thumbEditorImage = document.getElementById("thumbEditorImage");
const thumbEditorThumbImage = document.getElementById("thumbEditorThumbImage");
const thumbEditorLargeImage = document.getElementById("thumbEditorLargeImage");
const thumbEditorFullscreenImage = document.getElementById("thumbEditorFullscreenImage");
const thumbEditorLogoImage = document.getElementById("thumbEditorLogoImage");
const thumbEditorName = document.getElementById("thumbEditorName");
const thumbEditorTitle = document.getElementById("thumbEditorTitle");
const thumbEditorCardDescription = document.getElementById("thumbEditorCardDescription");
const thumbEditorCategory = document.getElementById("thumbEditorCategory");
const thumbEditorDescription = document.getElementById("thumbEditorDescription");
const thumbEditorHomepageVisible = document.getElementById("thumbEditorHomepageVisible");
const thumbEditorFeatured = document.getElementById("thumbEditorFeatured");
const thumbEditorUseBg = document.getElementById("thumbEditorUseBg");
const thumbEditorBgColor = document.getElementById("thumbEditorBgColor");
const thumbEditorPreviewFrame = document.getElementById("thumbEditorPreviewFrame");
const thumbEditorPreviewImage = document.getElementById("thumbEditorPreviewImage");
const thumbEditorPreviewLabel = document.getElementById("thumbEditorPreviewLabel");
const thumbEditorAssetList = document.getElementById("thumbEditorAssetList");
const thumbEditorMsg = document.getElementById("thumbEditorMsg");
const thumbEditorSingleOnlyElements = Array.from(
  thumbEditorForm?.querySelectorAll("[data-editor-single-only]") || []
);
const uploadOutputInputs = Array.from(
  uploadForm?.querySelectorAll('.output-set input[type="checkbox"]') || []
);
const thumbEditorReplacementInputs = [
  { key: "image", label: "Source", element: thumbEditorImage },
  { key: "large", label: "Large", element: thumbEditorLargeImage },
  { key: "fullscreen", label: "Fullscreen", element: thumbEditorFullscreenImage },
  { key: "thumb", label: "Thumb", element: thumbEditorThumbImage },
  { key: "logo", label: "Logo", element: thumbEditorLogoImage }
].filter((item) => item.element);

function collectSelectedOutputs() {
  return uploadOutputInputs.filter((input) => input.checked).map((input) => input.value);
}

function updateUploadButtonState() {
  if (!uploadButton) return;

  const hasFiles = collectUploadFiles().length > 0;
  const hasOutputs = collectSelectedOutputs().length > 0;
  uploadButton.disabled = !state.apiAvailable || !hasFiles || !hasOutputs;
}

if (imageFileInput && imageFolderInput) {
  imageFileInput.addEventListener("change", () => {
    if (imageFileInput.files?.length) {
      imageFolderInput.value = "";
    }
    updateUploadButtonState();
  });

  imageFolderInput.addEventListener("change", () => {
    if (imageFolderInput.files?.length) {
      imageFileInput.value = "";
    }
    updateUploadButtonState();
  });
}

uploadOutputInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateUploadButtonState();
  });
});

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

function normalizeCardDescription(value, maxLength = 120) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalizeGalleryCategory(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ["branding", "web", "illustration", "all"].includes(normalized)
    ? normalized
    : "all";
}

function normalizeHomepageVisible(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  return ["1", "true", "yes", "on"].includes(
    String(value)
      .trim()
      .toLowerCase()
  );
}

function normalizeHexColor(value) {
  let raw = String(value || "").trim();
  if (!raw) return "";
  if (!raw.startsWith("#")) raw = `#${raw}`;

  if (/^#[0-9a-f]{3}$/i.test(raw)) {
    raw = `#${raw
      .slice(1)
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`;
  }

  return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : "";
}

function getSelectedEntryIds() {
  return Array.from(state.selectedEntryIds);
}

function isEntrySelected(entryId) {
  return state.selectedEntryIds.has(String(entryId || ""));
}

function syncSelectedEntriesWithConfig() {
  const availableIds = new Set(
    normalizeGalleryEntries(state.config?.gallery).map((entry) => String(entry.id || "").trim())
  );

  state.selectedEntryIds.forEach((entryId) => {
    if (!availableIds.has(entryId)) {
      state.selectedEntryIds.delete(entryId);
    }
  });
}

function clearSelectedEntries({ rerender = true } = {}) {
  if (!state.selectedEntryIds.size) return;
  state.selectedEntryIds.clear();
  if (rerender) {
    renderThumbAccordion();
  }
}

function setEntrySelected(entryId, nextSelected) {
  const normalizedId = String(entryId || "").trim();
  if (!normalizedId) return;

  if (nextSelected) {
    state.selectedEntryIds.add(normalizedId);
  } else {
    state.selectedEntryIds.delete(normalizedId);
  }

  renderThumbAccordion();
}

function getSelectedEntries() {
  const selectedIds = new Set(getSelectedEntryIds());
  if (!selectedIds.size) return [];

  return normalizeGalleryEntries(state.config?.gallery).filter((entry) => selectedIds.has(entry.id));
}

function getActionTargetEntries(entryId) {
  const clickedEntry = getGalleryEntryById(entryId);
  if (!clickedEntry) {
    return [];
  }

  const selectedEntries = getSelectedEntries();
  if (selectedEntries.length && isEntrySelected(entryId)) {
    return selectedEntries;
  }

  return [clickedEntry];
}

function getEntryLabelList(entries) {
  return (Array.isArray(entries) ? entries : [])
    .map((entry) => entry?.title || entry?.id || "image")
    .filter(Boolean);
}

function ensureBatchCategoryOption() {
  if (!thumbEditorCategory) return;
  const keepValue = "__keep__";
  const existing = Array.from(thumbEditorCategory.options).find((option) => option.value === keepValue);
  if (existing) return;

  const option = document.createElement("option");
  option.value = keepValue;
  option.textContent = "Keep current categories";
  thumbEditorCategory.insertBefore(option, thumbEditorCategory.firstChild);
}

function removeBatchCategoryOption() {
  if (!thumbEditorCategory) return;
  const keepOption = Array.from(thumbEditorCategory.options).find(
    (option) => option.value === "__keep__"
  );
  if (keepOption) {
    keepOption.remove();
  }
}

function setBatchCheckboxState(element, mode) {
  if (!element) return;

  if (mode === "keep") {
    element.checked = false;
    element.indeterminate = true;
    return;
  }

  element.indeterminate = false;
  element.checked = mode === "on";
}

function getBatchCheckboxValue(element) {
  if (!element || element.indeterminate) {
    return undefined;
  }

  return element.checked;
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

function appendGeneratedOutputLine(
  label,
  value,
  className = "",
  isLink = true,
  listElement = generatedList
) {
  if (!listElement) return;

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

  listElement.appendChild(item);
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
    if (item.featuredThumb) files.add(item.featuredThumb);
    if (item.large) files.add(item.large);
    if (item.fullscreen) files.add(item.fullscreen);
    if (item.logo) files.add(item.logo);
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
      const cardDescription = normalizeCardDescription(entry?.cardDescription || "");
      const category = normalizeGalleryCategory(entry?.category);
      const homepageVisible = normalizeHomepageVisible(entry?.homepageVisible);
      const featured =
        ["1", "true", "yes", "on"].includes(
          String(entry?.featured || "")
            .trim()
            .toLowerCase()
        ) || Boolean(entry?.featuredThumb);
      const large = String(entry?.large || thumb).trim() || thumb;
      const fullscreen = String(entry?.fullscreen || large || thumb).trim() || large;
      const featuredThumb = String(entry?.featuredThumb || "").trim();
      const logo = String(entry?.logo || "").trim();
      const original = String(entry?.original || "").trim();
      const assetBaseName = sanitizeAssetName(entry?.assetBaseName || "");
      const backgroundColor = normalizeHexColor(entry?.backgroundColor);
      const createdAt = String(entry?.createdAt || "").trim();
      const updatedAt = String(entry?.updatedAt || "").trim();

      const dedupeKey = `${thumb}::${large}::${fullscreen}`;
      if (seen.has(dedupeKey)) return null;
      seen.add(dedupeKey);

      return {
        id,
        title: title || id,
        description,
        cardDescription,
        category,
        homepageVisible,
        featured,
        thumb,
        featuredThumb,
        large,
        fullscreen,
        logo,
        original,
        assetBaseName,
        backgroundColor,
        createdAt,
        updatedAt
      };
    })
    .filter(Boolean);
}

function isGalleryEntryHomepageVisible(entry) {
  return normalizeHomepageVisible(entry?.homepageVisible);
}

function isGalleryEntryHomepageFeatured(entry) {
  return isGalleryEntryHomepageVisible(entry) && Boolean(entry?.featured || entry?.featuredThumb);
}

function splitGalleryEntriesBySection(entries) {
  const homepageFeaturedEntries = [];
  const homepageStandardEntries = [];
  const processEntries = [];

  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (!isGalleryEntryHomepageVisible(entry)) {
      processEntries.push(entry);
      return;
    }

    if (isGalleryEntryHomepageFeatured(entry)) {
      homepageFeaturedEntries.push(entry);
      return;
    }

    homepageStandardEntries.push(entry);
  });

  return { homepageFeaturedEntries, homepageStandardEntries, processEntries };
}

function sortGalleryEntriesForDisplay(entries) {
  const { homepageFeaturedEntries, homepageStandardEntries } = splitGalleryEntriesBySection(entries);
  return [...homepageFeaturedEntries, ...homepageStandardEntries];
}

function compareIsoDateDesc(left, right) {
  const leftTime = Date.parse(left?.updatedAt || left?.createdAt || "") || 0;
  const rightTime = Date.parse(right?.updatedAt || right?.createdAt || "") || 0;

  if (leftTime !== rightTime) {
    return rightTime - leftTime;
  }

  return String(left?.title || left?.id || "").localeCompare(String(right?.title || right?.id || ""));
}

function sortProcessEntries(entries) {
  return [...(Array.isArray(entries) ? entries : [])].sort(compareIsoDateDesc);
}

function getGalleryEntryBaseName(entry) {
  const explicitName = sanitizeAssetName(entry?.assetBaseName || "");
  if (explicitName) {
    return explicitName;
  }

  const sourcePath = String(entry?.thumb || entry?.large || entry?.fullscreen || "").trim();
  const fileName = sourcePath.split("/").pop() || "";
  const match = fileName.match(
    /^(.*?)-(?:thumb-\d+x\d+|featured-thumb-\d+x\d+|large-\d+x\d+|fullscreen-\d+x\d+|logo-\d+)\.[^.]+$/i
  );
  return sanitizeAssetName(match?.[1] || "");
}

function getGalleryEntryLogoPath(entry) {
  const explicitLogo = String(entry?.logo || "").trim();
  if (explicitLogo) {
    return explicitLogo;
  }

  const baseName = getGalleryEntryBaseName(entry);
  return baseName ? `assets/vscimage/generated/${baseName}-logo-240.png` : "";
}

function getGalleryEntryFeaturedThumbPath(entry) {
  const explicitFeaturedThumb = String(entry?.featuredThumb || "").trim();
  if (explicitFeaturedThumb) {
    return explicitFeaturedThumb;
  }

  if (!entry?.featured) {
    return "";
  }

  const baseName = getGalleryEntryBaseName(entry);
  return baseName
    ? "assets/vscimage/generated/" +
        `${baseName}-featured-thumb-2400x570.webp`
    : "";
}

function getGalleryEntryById(entryId) {
  return normalizeGalleryEntries(state.config?.gallery).find((entry) => entry.id === entryId) || null;
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

function createThumbBadge(label, className = "") {
  const badge = document.createElement("span");
  badge.className = `thumb-card-badge${className ? ` ${className}` : ""}`;
  badge.textContent = label;
  return badge;
}

function buildThumbnailCard(entry, options = {}) {
  const card = document.createElement("article");
  card.className = "thumb-card";
  if (options.section === "process") {
    card.classList.add("thumb-card-compact");
  }
  if (isEntrySelected(entry.id)) {
    card.classList.add("is-selected");
  }
  card.dataset.entryId = entry.id;

  const actionsDisabled = !state.apiAvailable || Boolean(state.galleryBusyId);
  const isBusy = state.galleryBusyId === entry.id;
  const busyAction = isBusy ? state.galleryBusyAction : "";
  const homepageVisible = isGalleryEntryHomepageVisible(entry);
  const homepageFeatured = isGalleryEntryHomepageFeatured(entry);
  const hasSelection = state.selectedEntryIds.size > 0;

  const selectionRow = document.createElement("label");
  selectionRow.className = "thumb-card-selection";

  const selectionInput = document.createElement("input");
  selectionInput.type = "checkbox";
  selectionInput.checked = isEntrySelected(entry.id);
  selectionInput.dataset.thumbSelect = "true";
  selectionInput.dataset.entryId = entry.id;
  selectionInput.setAttribute("aria-label", `Select ${entry.title}`);

  const selectionText = document.createElement("span");
  selectionText.textContent = selectionInput.checked ? "Selected" : "Select";

  selectionRow.appendChild(selectionInput);
  selectionRow.appendChild(selectionText);

  const image = document.createElement("img");
  image.src = toAssetUrl(entry.thumb);
  image.alt = entry.title;
  image.loading = "lazy";

  const badges = document.createElement("div");
  badges.className = "thumb-card-badges";
  badges.appendChild(
    createThumbBadge(
      homepageVisible ? "Homepage live" : "Process thumbnail",
      homepageVisible ? "is-live" : "is-process"
    )
  );
  badges.appendChild(createThumbBadge(`Category: ${entry.category || "all"}`));
  if (homepageFeatured) {
    badges.appendChild(createThumbBadge("Featured", "is-featured"));
  } else if (entry.featured || entry.featuredThumb) {
    badges.appendChild(createThumbBadge("Featured when shown", "is-featured"));
  }

  const title = document.createElement("h3");
  title.textContent = entry.title;

  const description = document.createElement("p");
  description.className = "thumb-card-description";
  description.textContent = entry.description || "Generated in VSCimage.";

  const path = document.createElement("p");
  path.className = "path";
  path.textContent = entry.thumb;

  const link = document.createElement("a");
  link.href = toAssetUrl(entry.large || entry.thumb);
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = "Open large image";

  const actions = document.createElement("div");
  actions.className = "thumb-card-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "btn btn-secondary";
  editButton.textContent = busyAction === "edit" ? "Opening..." : "Edit";
  editButton.dataset.thumbAction = "edit";
  editButton.dataset.entryId = entry.id;
  editButton.disabled = actionsDisabled;

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "btn btn-danger";
  deleteButton.textContent = busyAction === "delete" ? "Deleting..." : "Delete";
  deleteButton.dataset.thumbAction = "delete";
  deleteButton.dataset.entryId = entry.id;
  deleteButton.disabled = actionsDisabled;

  const visibilityButton = document.createElement("button");
  visibilityButton.type = "button";
  visibilityButton.className = "btn btn-secondary";
  visibilityButton.textContent = homepageVisible
    ? busyAction === "hide-homepage"
      ? "Moving..."
      : "Hide"
    : busyAction === "show-homepage"
      ? "Publishing..."
      : "Show On Homepage";
  visibilityButton.dataset.thumbAction = homepageVisible ? "hide-homepage" : "show-homepage";
  visibilityButton.dataset.entryId = entry.id;
  visibilityButton.disabled = actionsDisabled;

  if (homepageFeatured) {
    const pinnedLabel = document.createElement("span");
    pinnedLabel.className = "thumb-card-order-label";
    pinnedLabel.textContent = "Featured card stays pinned";
    actions.appendChild(pinnedLabel);
  } else if (homepageVisible && options.standardCount > 1) {
    const orderLabel = document.createElement("span");
    orderLabel.className = "thumb-card-order-label";
    orderLabel.textContent = `Homepage order: ${options.standardIndex + 1}`;

    const moveEarlierButton = document.createElement("button");
    moveEarlierButton.type = "button";
    moveEarlierButton.className = "btn btn-secondary thumb-card-move";
    moveEarlierButton.textContent = "-";
    moveEarlierButton.dataset.thumbAction = "move-up";
    moveEarlierButton.dataset.entryId = entry.id;
    moveEarlierButton.setAttribute("aria-label", "Move earlier");
    moveEarlierButton.title = "Move earlier";
    moveEarlierButton.disabled = actionsDisabled || hasSelection || !options.canMoveUp;

    const moveLaterButton = document.createElement("button");
    moveLaterButton.type = "button";
    moveLaterButton.className = "btn btn-secondary thumb-card-move";
    moveLaterButton.textContent = "+";
    moveLaterButton.dataset.thumbAction = "move-down";
    moveLaterButton.dataset.entryId = entry.id;
    moveLaterButton.setAttribute("aria-label", "Move later");
    moveLaterButton.title = "Move later";
    moveLaterButton.disabled = actionsDisabled || hasSelection || !options.canMoveDown;

    actions.appendChild(orderLabel);
    actions.appendChild(moveEarlierButton);
    actions.appendChild(moveLaterButton);
  } else if (homepageVisible) {
    const orderLabel = document.createElement("span");
    orderLabel.className = "thumb-card-order-label";
    orderLabel.textContent = "Homepage order: 1";
    actions.appendChild(orderLabel);
  } else {
    const storedLabel = document.createElement("span");
    storedLabel.className = "thumb-card-order-label";
    storedLabel.textContent = "Stored only. This image is hidden from the homepage.";
    actions.appendChild(storedLabel);
  }

  actions.appendChild(visibilityButton);
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);

  card.appendChild(selectionRow);
  card.appendChild(image);
  card.appendChild(badges);
  card.appendChild(title);
  card.appendChild(description);
  card.appendChild(path);
  card.appendChild(link);
  card.appendChild(actions);
  return card;
}

function setThumbStatus(message, type = "") {
  if (!thumbMsg) return;
  setStatus(thumbMsg, message, type);
}

function setThumbEditorStatus(message, type = "") {
  if (!thumbEditorMsg) return;
  setStatus(thumbEditorMsg, message, type);
}

function cleanupEditorPreviewUrl() {
  if (!state.editorPreviewUrl) return;
  URL.revokeObjectURL(state.editorPreviewUrl);
  state.editorPreviewUrl = "";
}

function updateThumbEditorBackgroundState() {
  const useBackground = Boolean(thumbEditorUseBg?.checked);
  if (thumbEditorBgColor) {
    thumbEditorBgColor.disabled = !useBackground;
    thumbEditorBgColor
      .closest(".editor-background-controls")
      ?.classList.toggle("is-disabled", !useBackground);
  }

  if (thumbEditorPreviewFrame) {
    const previewColor = useBackground
      ? normalizeHexColor(thumbEditorBgColor?.value || "#ffffff") || "#ffffff"
      : "rgba(255, 255, 255, 0.4)";
    thumbEditorPreviewFrame.style.setProperty("--editor-preview-bg", previewColor);
  }
}

function updateThumbEditorPreview(entry) {
  if (!thumbEditorPreviewImage || !thumbEditorPreviewLabel) return;

  const replacement = thumbEditorReplacementInputs.find((item) => item.element?.files?.[0]);
  const replacementFile = replacement?.element?.files?.[0];
  cleanupEditorPreviewUrl();

  if (replacementFile) {
    state.editorPreviewUrl = URL.createObjectURL(replacementFile);
    thumbEditorPreviewImage.src = state.editorPreviewUrl;
    thumbEditorPreviewImage.alt = replacementFile.name;
    thumbEditorPreviewLabel.textContent = `${replacement?.label || "Replacement"} preview: ${replacementFile.name}`;
  } else {
    thumbEditorPreviewImage.src = toAssetUrl(entry.large || entry.thumb);
    thumbEditorPreviewImage.alt = entry.title;
    thumbEditorPreviewLabel.textContent = entry.original
      ? `Source: ${entry.original}`
      : "No stored original source path. Upload a replacement image if regeneration is needed.";
  }

  updateThumbEditorBackgroundState();
}

function renderThumbEditorAssetList(entry) {
  if (!thumbEditorAssetList) return;

  thumbEditorAssetList.innerHTML = "";
  if (entry.original) {
    appendGeneratedOutputLine("Original", entry.original, "", true, thumbEditorAssetList);
  }
  appendGeneratedOutputLine("Thumb", entry.thumb, "", true, thumbEditorAssetList);
  if (entry.featured || entry.featuredThumb) {
    appendGeneratedOutputLine(
      "Featured",
      getGalleryEntryFeaturedThumbPath(entry),
      "",
      true,
      thumbEditorAssetList
    );
  }
  appendGeneratedOutputLine("Large", entry.large, "", true, thumbEditorAssetList);
  appendGeneratedOutputLine("Fullscreen", entry.fullscreen, "", true, thumbEditorAssetList);

  const logoPath = getGalleryEntryLogoPath(entry);
  if (logoPath) {
    appendGeneratedOutputLine("Logo", logoPath, "", true, thumbEditorAssetList);
  }
}

function setGalleryEditorMode(mode, entries = []) {
  const isBatchMode = mode === "batch";
  state.editorMode = isBatchMode ? "batch" : "single";
  state.editorBatchIds = isBatchMode ? entries.map((entry) => entry.id) : [];

  thumbEditorSingleOnlyElements.forEach((element) => {
    element.classList.toggle("is-hidden", isBatchMode);
  });

  thumbEditorDelete.classList.toggle("is-hidden", isBatchMode);

  if (isBatchMode) {
    thumbEditorKicker.textContent = "Processed Thumbnails";
    thumbEditorHeading.textContent = `Edit ${entries.length} Images`;
    thumbEditorModeNote.hidden = false;
    thumbEditorModeNote.textContent =
      "Blank text fields keep their current values. Homepage, feature, and background toggles start in a neutral keep-current state.";
    thumbEditorCardDescription.value = "";
    thumbEditorCardDescription.placeholder = "Leave blank to keep current card descriptions";
    ensureBatchCategoryOption();
    thumbEditorCategory.value = "__keep__";
    thumbEditorDescription.value = "";
    thumbEditorDescription.placeholder = "Leave blank to keep current descriptions";
    setBatchCheckboxState(thumbEditorHomepageVisible, "keep");
    setBatchCheckboxState(thumbEditorFeatured, "keep");
    setBatchCheckboxState(thumbEditorUseBg, "keep");
    thumbEditorBgColor.value = "#ffffff";
    thumbEditorName.value = "";
    thumbEditorTitle.value = "";
    thumbEditorPreviewLabel.textContent = `${entries.length} selected images`;
    thumbEditorAssetList.innerHTML = "";
    updateThumbEditorBackgroundState();
    return;
  }

  thumbEditorKicker.textContent = "Processed Thumbnail";
  thumbEditorHeading.textContent = "Edit Image";
  thumbEditorModeNote.hidden = true;
  thumbEditorModeNote.textContent = "";
  thumbEditorCardDescription.placeholder = "Short one-line text for the homepage card";
  thumbEditorDescription.placeholder = "";
  removeBatchCategoryOption();
  thumbEditorHomepageVisible.indeterminate = false;
  thumbEditorFeatured.indeterminate = false;
  thumbEditorUseBg.indeterminate = false;
}

function openGalleryEditor(entryId) {
  const targetEntries = getActionTargetEntries(entryId);
  if (!targetEntries.length || !thumbEditorDialog || !thumbEditorForm) {
    return;
  }

  state.editorEntryId = targetEntries.length === 1 ? targetEntries[0].id : "";
  cleanupEditorPreviewUrl();

  thumbEditorForm.reset();
  thumbEditorDelete.dataset.entryId = targetEntries[0].id;
  thumbEditorSave.disabled = !state.apiAvailable;
  thumbEditorDelete.disabled = !state.apiAvailable;
  setThumbEditorStatus("", "");

  if (targetEntries.length > 1) {
    setGalleryEditorMode("batch", targetEntries);
  } else {
    const entry = targetEntries[0];
    setGalleryEditorMode("single", targetEntries);
    thumbEditorName.value = getGalleryEntryBaseName(entry) || sanitizeAssetName(entry.title) || "";
    thumbEditorTitle.value = entry.title || "";
    thumbEditorCardDescription.value = entry.cardDescription || "";
    thumbEditorCategory.value = normalizeGalleryCategory(entry.category);
    thumbEditorDescription.value = entry.description || "";
    thumbEditorHomepageVisible.checked = isGalleryEntryHomepageVisible(entry);
    thumbEditorFeatured.checked = Boolean(entry.featured);
    thumbEditorUseBg.checked = Boolean(entry.backgroundColor);
    thumbEditorBgColor.value = entry.backgroundColor || "#ffffff";
    updateThumbEditorPreview(entry);
    renderThumbEditorAssetList(entry);
  }

  if (thumbEditorDialog.open) {
    return;
  }

  if (typeof thumbEditorDialog.showModal === "function") {
    thumbEditorDialog.showModal();
  } else {
    thumbEditorDialog.setAttribute("open", "open");
  }
}

function closeGalleryEditor() {
  if (!thumbEditorDialog) return;

  if (thumbEditorDialog.open) {
    thumbEditorDialog.close();
  } else {
    thumbEditorDialog.removeAttribute("open");
  }

  state.editorEntryId = "";
  state.editorMode = "single";
  state.editorBatchIds = [];
  cleanupEditorPreviewUrl();
  removeBatchCategoryOption();
  setThumbEditorStatus("", "");
}

async function deleteGalleryEntry(entryId) {
  if (!state.apiAvailable) {
    setThumbStatus(
      "Delete is unavailable in read-only mode. Start backend server with npm run dev and open http://localhost:3000/vscimage.",
      "error"
    );
    return;
  }

  const targetEntries = getActionTargetEntries(entryId);
  if (!targetEntries.length) {
    setThumbStatus("Thumbnail entry was not found.", "error");
    return;
  }

  const label = targetEntries.length === 1
    ? targetEntries[0].title || targetEntries[0].id
    : `${targetEntries.length} selected images`;
  const confirmed = window.confirm(
    targetEntries.length === 1
      ? `Delete "${label}" from Hidden Assetts? Generated files tied to this card will be removed from VSCimage.`
      : `Delete ${targetEntries.length} selected thumbnails from Hidden Assetts? Generated files tied to those cards will be removed from VSCimage.`
  );
  if (!confirmed) {
    return;
  }

  const failedLabels = [];
  let deletedCount = 0;

  try {
    for (const entry of targetEntries) {
      const currentLabel = entry.title || entry.id;
      state.galleryBusyId = entry.id;
      state.galleryBusyAction = "delete";
      renderThumbAccordion();
      setThumbStatus(`Deleting ${currentLabel}...`, "");
      if (state.editorEntryId === entry.id || state.editorMode === "batch") {
        thumbEditorSave.disabled = true;
        thumbEditorDelete.disabled = true;
        setThumbEditorStatus(`Deleting ${currentLabel}...`, "");
      }

      try {
        await fetchJson(
          `${state.apiOrigin}/api/vscimage/gallery/${encodeURIComponent(entry.id)}/delete`,
          {
            method: "POST"
          }
        );
        deletedCount += 1;
      } catch (error) {
        failedLabels.push(`${currentLabel}: ${error.message}`);
      }
    }

    if (deletedCount > 0) {
      closeGalleryEditor();
    }
    await reloadData();
    if (failedLabels.length) {
      setThumbStatus(
        `Deleted ${deletedCount} image${deletedCount === 1 ? "" : "s"}. ${failedLabels.join(" ")}`,
        "error"
      );
    } else {
      setThumbStatus(
        `Deleted ${deletedCount} image${deletedCount === 1 ? "" : "s"}.`,
        "ok"
      );
    }
  } finally {
    state.galleryBusyId = "";
    state.galleryBusyAction = "";
    renderThumbAccordion();
    thumbEditorSave.disabled = !state.apiAvailable;
    thumbEditorDelete.disabled = !state.apiAvailable;
  }
}

async function saveGalleryEditor() {
  if (!state.apiAvailable) {
    setThumbEditorStatus(
      "Edit is unavailable in read-only mode. Start backend server with npm run dev and open http://localhost:3000/vscimage.",
      "error"
    );
    return;
  }

  if (state.editorMode === "batch") {
    const targetEntries = normalizeGalleryEntries(state.config?.gallery).filter((entry) =>
      state.editorBatchIds.includes(entry.id)
    );

    if (!targetEntries.length) {
      setThumbEditorStatus("Selected thumbnails were not found.", "error");
      return;
    }

    const batchCardDescription = normalizeCardDescription(thumbEditorCardDescription?.value || "");
    const batchCategory = String(thumbEditorCategory?.value || "__keep__").trim();
    const batchDescription = normalizeDescription(thumbEditorDescription?.value || "", 320);
    const batchHomepageVisible = getBatchCheckboxValue(thumbEditorHomepageVisible);
    const batchFeatured = getBatchCheckboxValue(thumbEditorFeatured);
    const batchUseBackground = getBatchCheckboxValue(thumbEditorUseBg);
    const batchBackgroundColor = normalizeHexColor(thumbEditorBgColor?.value || "#ffffff");

    const hasBatchEdits =
      Boolean(batchCardDescription) ||
      batchCategory !== "__keep__" ||
      Boolean(batchDescription) ||
      batchHomepageVisible !== undefined ||
      batchFeatured !== undefined ||
      batchUseBackground !== undefined;

    if (!hasBatchEdits) {
      setThumbEditorStatus("Choose at least one change to apply to the selected images.", "error");
      return;
    }

    thumbEditorSave.disabled = true;
    thumbEditorDelete.disabled = true;
    setThumbEditorStatus(`Saving ${targetEntries.length} selected images...`, "");

    const failedLabels = [];
    let updatedCount = 0;

    try {
      for (const entry of targetEntries) {
        const formData = new FormData();

        if (batchCardDescription) {
          formData.append("cardDescription", batchCardDescription);
        }
        if (batchCategory !== "__keep__") {
          formData.append("category", batchCategory);
        }
        if (batchDescription) {
          formData.append("description", batchDescription);
        }
        if (batchHomepageVisible !== undefined) {
          formData.append("homepageVisible", batchHomepageVisible ? "true" : "false");
        }
        if (batchFeatured !== undefined) {
          formData.append("featured", batchFeatured ? "true" : "false");
        }
        if (batchUseBackground !== undefined) {
          formData.append(
            "backgroundColor",
            batchUseBackground ? batchBackgroundColor || "#ffffff" : ""
          );
        }

        state.galleryBusyId = entry.id;
        state.galleryBusyAction = "save";
        renderThumbAccordion();

        try {
          await fetchJson(
            `${state.apiOrigin}/api/vscimage/gallery/${encodeURIComponent(entry.id)}/edit`,
            {
              method: "POST",
              body: formData
            }
          );
          updatedCount += 1;
        } catch (error) {
          failedLabels.push(`${entry.title || entry.id}: ${error.message}`);
        }
      }

      await reloadData();
      closeGalleryEditor();
      if (failedLabels.length) {
        setThumbStatus(
          `Updated ${updatedCount} image${updatedCount === 1 ? "" : "s"}. ${failedLabels.join(" ")}`,
          "error"
        );
      } else {
        setThumbStatus(
          `Updated ${updatedCount} selected image${updatedCount === 1 ? "" : "s"}.`,
          "ok"
        );
      }
    } finally {
      state.galleryBusyId = "";
      state.galleryBusyAction = "";
      renderThumbAccordion();
      thumbEditorSave.disabled = !state.apiAvailable;
      thumbEditorDelete.disabled = !state.apiAvailable;
    }

    return;
  }

  const entryId = state.editorEntryId;
  const entry = getGalleryEntryById(entryId);
  if (!entry) {
    setThumbEditorStatus("Thumbnail entry was not found.", "error");
    return;
  }

  const nextName = sanitizeAssetName(thumbEditorName?.value || "");
  const nextTitle = String(thumbEditorTitle?.value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
  const nextCardDescription = normalizeCardDescription(thumbEditorCardDescription?.value || "");
  const nextCategory = normalizeGalleryCategory(thumbEditorCategory?.value || "all");
  const nextDescription = normalizeDescription(thumbEditorDescription?.value || "", 320);
  const nextBackgroundColor = thumbEditorUseBg?.checked
    ? normalizeHexColor(thumbEditorBgColor?.value || "#ffffff")
    : "";

  if (!nextName) {
    setThumbEditorStatus("Asset name cannot be empty.", "error");
    thumbEditorName?.focus();
    return;
  }

  if (!nextTitle) {
    setThumbEditorStatus("Display title cannot be empty.", "error");
    thumbEditorTitle?.focus();
    return;
  }

  const formData = new FormData();
  formData.append("name", nextName);
  formData.append("title", nextTitle);
  formData.append("cardDescription", nextCardDescription);
  formData.append("category", nextCategory);
  formData.append("description", nextDescription);
  formData.append("homepageVisible", thumbEditorHomepageVisible?.checked ? "true" : "false");
  formData.append("featured", thumbEditorFeatured?.checked ? "true" : "false");
  formData.append("backgroundColor", nextBackgroundColor);

  const replacementFile = thumbEditorImage?.files?.[0];
  if (replacementFile) {
    formData.append("image", replacementFile);
  }
  const replacementThumbFile = thumbEditorThumbImage?.files?.[0];
  if (replacementThumbFile) {
    formData.append("thumbImage", replacementThumbFile);
  }
  const replacementLargeFile = thumbEditorLargeImage?.files?.[0];
  if (replacementLargeFile) {
    formData.append("largeImage", replacementLargeFile);
  }
  const replacementFullscreenFile = thumbEditorFullscreenImage?.files?.[0];
  if (replacementFullscreenFile) {
    formData.append("fullscreenImage", replacementFullscreenFile);
  }
  const replacementLogoFile = thumbEditorLogoImage?.files?.[0];
  if (replacementLogoFile) {
    formData.append("logoImage", replacementLogoFile);
  }

  state.galleryBusyId = entryId;
  state.galleryBusyAction = "save";
  renderThumbAccordion();
  thumbEditorSave.disabled = true;
  thumbEditorDelete.disabled = true;
  setThumbEditorStatus(`Saving ${nextTitle}...`, "");

  try {
    await fetchJson(`${state.apiOrigin}/api/vscimage/gallery/${encodeURIComponent(entryId)}/edit`, {
      method: "POST",
      body: formData
    });
    await reloadData();
    closeGalleryEditor();
    setThumbStatus("Thumbnail updated.", "ok");
  } catch (error) {
    setThumbEditorStatus(error.message, "error");
  } finally {
    state.galleryBusyId = "";
    state.galleryBusyAction = "";
    renderThumbAccordion();
    thumbEditorSave.disabled = !state.apiAvailable;
    thumbEditorDelete.disabled = !state.apiAvailable;
  }
}

async function reorderGalleryEntry(entryId, direction) {
  if (!state.apiAvailable) {
    setThumbStatus(
      "Reordering is unavailable in read-only mode. Start backend server with npm run dev and open http://localhost:3000/vscimage.",
      "error"
    );
    return;
  }

  const entry = getGalleryEntryById(entryId);
  if (!entry) {
    setThumbStatus("Thumbnail entry was not found.", "error");
    return;
  }

  const label = entry.title || entryId;
  const statusVerb = direction === "up" ? "Moving earlier" : "Moving later";

  state.galleryBusyId = entryId;
  state.galleryBusyAction = direction === "up" ? "move-up" : "move-down";
  renderThumbAccordion();
  setThumbStatus(`${statusVerb}: ${label}...`, "");

  try {
    await fetchJson(`${state.apiOrigin}/api/vscimage/gallery/${encodeURIComponent(entryId)}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction })
    });
    await reloadData();
    setThumbStatus("Thumbnail order updated.", "ok");
  } catch (error) {
    setThumbStatus(error.message, "error");
  } finally {
    state.galleryBusyId = "";
    state.galleryBusyAction = "";
    renderThumbAccordion();
  }
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

async function toggleGalleryHomepageVisibility(entryId, homepageVisible) {
  if (!state.apiAvailable) {
    setThumbStatus(
      "Homepage visibility is unavailable in read-only mode. Start backend server with npm run dev and open http://localhost:3000/vscimage.",
      "error"
    );
    return;
  }

  const targetEntries = getActionTargetEntries(entryId);
  if (!targetEntries.length) {
    setThumbStatus("Thumbnail entry was not found.", "error");
    return;
  }

  const label =
    targetEntries.length === 1
      ? targetEntries[0].title || targetEntries[0].id
      : `${targetEntries.length} selected images`;
  const nextAction = homepageVisible ? "show-homepage" : "hide-homepage";
  const statusMessage = homepageVisible
    ? `Adding ${label} to the homepage...`
    : `Moving ${label} to Hidden Assetts...`;

  setThumbStatus(statusMessage, "");

  const failedLabels = [];
  let updatedCount = 0;

  try {
    for (const entry of targetEntries) {
      state.galleryBusyId = entry.id;
      state.galleryBusyAction = nextAction;
      renderThumbAccordion();

      try {
        await fetchJson(
          `${state.apiOrigin}/api/vscimage/gallery/${encodeURIComponent(entry.id)}/update`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: entry.title,
              cardDescription: entry.cardDescription,
              category: entry.category,
              description: entry.description,
              homepageVisible
            })
          }
        );
        updatedCount += 1;
      } catch (error) {
        failedLabels.push(`${entry.title || entry.id}: ${error.message}`);
      }
    }

    await reloadData();
    if (state.editorEntryId === entryId && updatedCount === 1) {
      openGalleryEditor(entryId);
    }
    if (failedLabels.length) {
      setThumbStatus(
        `${homepageVisible ? "Updated" : "Moved"} ${updatedCount} image${updatedCount === 1 ? "" : "s"}. ${failedLabels.join(" ")}`,
        "error"
      );
    } else {
      setThumbStatus(
        homepageVisible
          ? `Added ${updatedCount} image${updatedCount === 1 ? "" : "s"} to the homepage.`
          : `Moved ${updatedCount} image${updatedCount === 1 ? "" : "s"} to Hidden Assetts.`,
        "ok"
      );
    }
  } finally {
    state.galleryBusyId = "";
    state.galleryBusyAction = "";
    renderThumbAccordion();
  }
}

function appendThumbnailBatches(target, entries, options = {}) {
  const batchSize = Math.max(1, getThumbBatchSize());
  const batches = [];

  for (let index = 0; index < entries.length; index += batchSize) {
    batches.push(entries.slice(index, index + batchSize));
  }

  batches.forEach((batch, batchIndex) => {
    const grid = document.createElement("div");
    grid.className = "thumb-grid";
    if (options.section === "process") {
      grid.classList.add("thumb-grid-compact");
    }
    batch.forEach((entry) => {
      const standardIndex = options.standardOrderById?.get(entry.id);
      grid.appendChild(
        buildThumbnailCard(entry, {
          section: options.section,
          standardIndex: Number.isInteger(standardIndex) ? standardIndex : -1,
          standardCount: options.standardCount || 0,
          canMoveUp: Number.isInteger(standardIndex) && standardIndex > 0,
          canMoveDown:
            Number.isInteger(standardIndex) &&
            standardIndex < (options.standardCount || 0) - 1
        })
      );
    });

    if (batchIndex === 0) {
      target.appendChild(grid);
      return;
    }

    const start = batchIndex * batchSize + 1;
    const end = start + batch.length - 1;
    const details = document.createElement("details");
    details.className = "thumb-batch";
    const batchKey = `${options.section || "gallery"}-${batchIndex}`;
    details.dataset.thumbBatchKey = batchKey;
    if (state.thumbBatchOpen[batchKey]) {
      details.open = true;
    }
    details.addEventListener("toggle", () => {
      state.thumbBatchOpen[batchKey] = details.open;
    });
    details.innerHTML = `<summary>Show more ${options.batchLabel || "thumbnails"} ${start}-${end}</summary>`;
    details.appendChild(grid);
    target.appendChild(details);
  });
}

function buildSelectionToolbar() {
  const selectedEntries = getSelectedEntries();
  if (!selectedEntries.length) {
    return null;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "thumb-selection-toolbar";

  const summary = document.createElement("p");
  summary.className = "thumb-selection-summary";
  summary.textContent =
    selectedEntries.length === 1
      ? `1 image selected. Hide, Edit, or Delete on that card will use the selection. Reordering is disabled while selected.`
      : `${selectedEntries.length} images selected. Hide, Edit, or Delete on a selected card will apply to all selected images. Reordering is disabled while selected.`;

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "btn btn-secondary";
  clearButton.dataset.thumbAction = "clear-selection";
  clearButton.textContent = "Clear Selection";

  toolbar.appendChild(summary);
  toolbar.appendChild(clearButton);
  return toolbar;
}

function createThumbSection({
  title,
  description,
  entries,
  emptyMessage,
  section,
  standardEntries = [],
  collapsible = false,
  collapsedByDefault = false
}) {
  const wrapper = document.createElement("section");
  wrapper.className = "thumb-section";

  const titleElement = document.createElement("h3");
  titleElement.className = "thumb-section-title";
  titleElement.textContent = title;

  const countElement = document.createElement("span");
  countElement.className = "thumb-section-count";
  countElement.textContent = `${entries.length}`;

  const descriptionElement = document.createElement("p");
  descriptionElement.className = "thumb-section-description";
  descriptionElement.textContent = description;

  const content = document.createElement("div");
  content.className = "thumb-section-content";

  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "thumb-empty";
    empty.textContent = emptyMessage;
    content.appendChild(empty);
  } else {
    appendThumbnailBatches(content, entries, {
      section,
      batchLabel: section === "homepage" ? "homepage cards" : "hidden assetts",
      standardOrderById: new Map(standardEntries.map((entry, index) => [entry.id, index])),
      standardCount: standardEntries.length
    });
  }

  if (collapsible) {
    const details = document.createElement("details");
    details.className = "thumb-section-accordion";
    details.dataset.thumbSection = section;

    const rememberedOpen = state.thumbSectionOpen[section];
    if (typeof rememberedOpen === "boolean" ? rememberedOpen : !collapsedByDefault) {
      details.open = true;
    }
    details.addEventListener("toggle", () => {
      state.thumbSectionOpen[section] = details.open;
    });

    const summary = document.createElement("summary");
    summary.className = "thumb-section-summary";

    const header = document.createElement("div");
    header.className = "thumb-section-header";
    header.appendChild(titleElement);
    header.appendChild(countElement);
    header.appendChild(descriptionElement);

    summary.appendChild(header);
    details.appendChild(summary);
    details.appendChild(content);
    wrapper.appendChild(details);
    return wrapper;
  }

  const header = document.createElement("div");
  header.className = "thumb-section-header";
  header.appendChild(titleElement);
  header.appendChild(countElement);
  header.appendChild(descriptionElement);
  wrapper.appendChild(header);
  wrapper.appendChild(content);

  return wrapper;
}

function renderThumbAccordion() {
  if (!thumbAccordion || !state.config) return;

  const normalizedEntries = normalizeGalleryEntries(state.config.gallery);
  const {
    homepageFeaturedEntries,
    homepageStandardEntries,
    processEntries
  } = splitGalleryEntriesBySection(normalizedEntries);
  const homepageEntries = [...homepageFeaturedEntries, ...homepageStandardEntries];
  const sortedProcessEntries = sortProcessEntries(processEntries);
  thumbAccordion.innerHTML = "";

  if (!homepageEntries.length && !sortedProcessEntries.length) {
    const empty = document.createElement("p");
    empty.className = "thumb-empty";
    empty.textContent = "No generated thumbnails yet. Upload an image to start the gallery.";
    thumbAccordion.appendChild(empty);
    return;
  }

  const selectionToolbar = buildSelectionToolbar();
  if (selectionToolbar) {
    thumbAccordion.appendChild(selectionToolbar);
  }

  thumbAccordion.appendChild(
    createThumbSection({
      title: "Homepage Gallery",
      description:
        "Visible on the public homepage. Featured cards stay pinned while standard cards can be reordered.",
      entries: homepageEntries,
      emptyMessage:
        "No thumbnails are currently published to the homepage. Toggle a process thumbnail on or upload a new one.",
      section: "homepage",
      standardEntries: homepageStandardEntries
    })
  );

  thumbAccordion.appendChild(
    createThumbSection({
      title: "Hidden Assetts",
      description:
        "Stored in VSCimage only. Expand this section when you want to review or publish stored-only images.",
      entries: sortedProcessEntries,
      emptyMessage:
        "No stored-only thumbnails yet. Hide a homepage card or upload a new image with homepage visibility turned off.",
      section: "process",
      collapsible: true,
      collapsedByDefault: true
    })
  );
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
  syncSelectedEntriesWithConfig();
  if (
    state.editorEntryId &&
    !state.config.gallery.some((entry) => entry.id === state.editorEntryId)
  ) {
    closeGalleryEditor();
  }
  if (state.editorMode === "batch" && !state.editorBatchIds.some((entryId) => isEntrySelected(entryId))) {
    closeGalleryEditor();
  }

  buildProjectRows();
  renderConfigControls();
  renderPreview();
  renderThumbAccordion();

  const saveButton = configForm?.querySelector('button[type="submit"]');
  updateUploadButtonState();
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

    const selectedFiles = collectUploadFiles();
    const namePrefix = sanitizeAssetName(assetNameInput?.value || "");
    const uploadCardDescription = normalizeCardDescription(
      uploadCardDescriptionInput?.value || "",
      120
    );
    const uploadCategory = normalizeGalleryCategory(uploadCategoryInput?.value || "all");
    const uploadHomepageVisible = uploadHomepageVisibleInput?.checked !== false;
    const checked = collectSelectedOutputs();

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
      if (uploadButton) uploadButton.disabled = true;

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
        formData.append("cardDescription", uploadCardDescription);
        formData.append("category", uploadCategory);
        formData.append("homepageVisible", uploadHomepageVisible ? "true" : "false");
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
      updateUploadButtonState();
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

if (thumbAccordion) {
  thumbAccordion.addEventListener("change", (event) => {
    const selectionInput = event.target.closest("[data-thumb-select]");
    if (!selectionInput) return;

    const entryId = selectionInput.dataset.entryId;
    if (!entryId) return;
    setEntrySelected(entryId, Boolean(selectionInput.checked));
  });

  thumbAccordion.addEventListener("click", async (event) => {
    const actionButton = event.target.closest("[data-thumb-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.thumbAction;
    const entryId = actionButton.dataset.entryId;

    if (action === "clear-selection") {
      clearSelectedEntries();
      setThumbStatus("", "");
      return;
    }

    if (!entryId) return;

    if (action === "edit") {
      setThumbStatus("", "");
      openGalleryEditor(entryId);
      return;
    }

    if (action === "move-up") {
      await reorderGalleryEntry(entryId, "up");
      return;
    }

    if (action === "move-down") {
      await reorderGalleryEntry(entryId, "down");
      return;
    }

    if (action === "show-homepage") {
      await toggleGalleryHomepageVisibility(entryId, true);
      return;
    }

    if (action === "hide-homepage") {
      await toggleGalleryHomepageVisibility(entryId, false);
      return;
    }

    if (action === "delete") {
      await deleteGalleryEntry(entryId);
    }
  });
}

if (thumbEditorClose) {
  thumbEditorClose.addEventListener("click", () => {
    closeGalleryEditor();
  });
}

if (thumbEditorDialog) {
  thumbEditorDialog.addEventListener("close", () => {
    cleanupEditorPreviewUrl();
    state.editorEntryId = "";
    setThumbEditorStatus("", "");
  });
}

thumbEditorReplacementInputs.forEach(({ element }) => {
  element.addEventListener("change", () => {
    const entry = getGalleryEntryById(state.editorEntryId);
    if (!entry) return;
    updateThumbEditorPreview(entry);
  });
});

if (thumbEditorUseBg) {
  thumbEditorUseBg.addEventListener("change", () => {
    updateThumbEditorBackgroundState();
  });
}

if (thumbEditorBgColor) {
  thumbEditorBgColor.addEventListener("input", () => {
    updateThumbEditorBackgroundState();
  });
}

if (thumbEditorDelete) {
  thumbEditorDelete.addEventListener("click", async () => {
    const entryId = thumbEditorDelete.dataset.entryId;
    if (!entryId) return;
    await deleteGalleryEntry(entryId);
  });
}

if (thumbEditorForm) {
  thumbEditorForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await saveGalleryEditor();
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
