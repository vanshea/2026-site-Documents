const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs/promises");
const fsSync = require("fs");
const { createProxyMiddleware } = require("http-proxy-middleware");
const prisma = require("./lib/prisma");
const analytics = require("./lib/analytics");
const analyticsApi = require("./lib/analytics-api");
let multer = null;
let sharp = null;

try {
  multer = require("multer");
} catch (error) {
  console.warn("multer is not installed; VSCimage upload endpoint will be disabled.");
}

try {
  sharp = require("sharp");
} catch (error) {
  console.warn("sharp is not installed; VSCimage image generation will be disabled.");
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const assetsDir = path.join(rootDir, "assets");
const vscimageDir = path.join(assetsDir, "vscimage");
const vscimageOriginalsDir = path.join(vscimageDir, "originals");
const vscimageGeneratedDir = path.join(vscimageDir, "generated");
const vscimageConfigPath = path.join(vscimageDir, "config.json");
const homepageIndexPath = path.join(rootDir, "index.html");
const featuredThumbSize = {
  width: 2400,
  height: 570
};
const acceptedImageExt = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".avif"
]);

const defaultVscimageConfig = {
  logos: {
    light: "assets/web_logomark_240_dark.png",
    dark: "assets/web_logomark_240_white.png"
  },
  gallery: [],
  projects: {
    northline: {
      title: "Northline Coffee",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-northline-1900x1600.svg",
      fullscreen: "assets/fpo-large-northline-1900x1600.svg",
      description: ""
    },
    atlas: {
      title: "Atlas Wellness",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-atlas-1900x1600.svg",
      fullscreen: "assets/fpo-large-atlas-1900x1600.svg",
      description: ""
    },
    city_transit: {
      title: "City Transit Posters",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-city-transit-1900x1600.svg",
      fullscreen: "assets/fpo-large-city-transit-1900x1600.svg",
      description: ""
    },
    wren: {
      title: "Wren Studio",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-wren-1900x1600.svg",
      fullscreen: "assets/fpo-large-wren-1900x1600.svg",
      description: ""
    },
    hollow_creek: {
      title: "Hollow Creek Cider",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-hollow-creek-1900x1600.svg",
      fullscreen: "assets/fpo-large-hollow-creek-1900x1600.svg",
      description: ""
    },
    field_notes: {
      title: "Field Notes Covers",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-field-notes-1900x1600.svg",
      fullscreen: "assets/fpo-large-field-notes-1900x1600.svg",
      description: ""
    }
  }
};

const generatedGalleryStartMarker = "<!-- VSCIMAGE_GENERATED_START -->";
const generatedGalleryEndMarker = "<!-- VSCIMAGE_GENERATED_END -->";

let upload = null;
if (multer) {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 30 * 1024 * 1024
    }
  });
}

const galleryEditUploadFields = [
  { name: "image", maxCount: 1 },
  { name: "thumbImage", maxCount: 1 },
  { name: "largeImage", maxCount: 1 },
  { name: "fullscreenImage", maxCount: 1 },
  { name: "logoImage", maxCount: 1 }
];

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function toInt(value, defaultValue) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function toWebPath(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function sanitizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeAssetPath(value) {
  const raw = String(value || "")
    .trim()
    .split("?")[0]
    .split("#")[0];
  if (!raw) return "";

  if (/^(https?:)?\/\//.test(raw)) {
    return raw;
  }

  return raw.replace(/^\/+/, "");
}

function siteAssetExists(assetPath) {
  const normalized = sanitizeAssetPath(assetPath);
  if (!normalized) return false;

  if (/^(https?:)?\/\//.test(normalized)) {
    return true;
  }

  return fsSync.existsSync(path.join(rootDir, normalized));
}

function resolveExistingSiteAssetPath(...candidates) {
  for (const candidate of candidates) {
    const normalized = sanitizeAssetPath(candidate);
    if (!normalized) continue;
    if (siteAssetExists(normalized)) {
      return normalized;
    }
  }

  return "";
}

function normalizeGalleryStem(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/-\d{10,}$/, "");

  if (!normalized) {
    return "";
  }

  return normalized;
}

function collectGalleryFallbackStems(entry) {
  const stems = new Set();
  const addStem = (value) => {
    const stem = normalizeGalleryStem(value);
    if (!stem) return;
    stems.add(stem);

    if (stem.startsWith("large-web-portfolio-")) {
      stems.add(stem.slice("large-web-portfolio-".length));
    }
  };

  addStem(entry?.assetBaseName);
  addStem(entry?.title);
  addStem(entry?.id);

  const originalPath = sanitizeAssetPath(entry?.original);
  if (originalPath) {
    addStem(path.basename(originalPath));
  }

  return Array.from(stems);
}

function resolveGalleryEntryAssetPath(entry, ...preferredCandidates) {
  const configuredPath = resolveExistingSiteAssetPath(...preferredCandidates);
  if (configuredPath) {
    return configuredPath;
  }

  const stems = collectGalleryFallbackStems(entry);
  const fallbackCandidates = [];
  const extensions = [".webp", ".png", ".jpg", ".jpeg", ".svg", ".avif", ".gif"];

  stems.forEach((stem) => {
    extensions.forEach((extension) => {
      fallbackCandidates.push(`large_web_portfolio/${stem}${extension}`);
    });
  });

  return resolveExistingSiteAssetPath(entry?.original, ...fallbackCandidates);
}

function splitGalleryEntriesByFeatured(entries) {
  const featuredEntries = [];
  const standardEntries = [];
  const hiddenEntries = [];

  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (!isGalleryEntryHomepageVisible(entry)) {
      hiddenEntries.push(entry);
      return;
    }

    if (isGalleryEntryHomepageFeatured(entry)) {
      featuredEntries.push(entry);
      return;
    }

    standardEntries.push(entry);
  });

  return { featuredEntries, standardEntries, hiddenEntries };
}

function sortGalleryEntriesForDisplay(entries) {
  const { featuredEntries, standardEntries } = splitGalleryEntriesByFeatured(entries);
  return [...featuredEntries, ...standardEntries];
}

function isGalleryEntryHomepageVisible(entry) {
  if (
    entry?.homepageVisible === undefined ||
    entry?.homepageVisible === null ||
    entry?.homepageVisible === ""
  ) {
    return true;
  }

  return toBool(entry.homepageVisible, true);
}

function isGalleryEntryHomepageFeatured(entry) {
  return isGalleryEntryHomepageVisible(entry) &&
    toBool(entry?.featured, Boolean(entry?.featuredThumb));
}

function buildGeneratedGalleryMarkup(galleryEntries) {
  const entries = sortGalleryEntriesForDisplay(galleryEntries);

  return entries
    .map((entry, index) => {
      const thumb = resolveGalleryEntryAssetPath(entry, entry?.thumb);
      if (!thumb) return "";

      const large = resolveGalleryEntryAssetPath(entry, entry?.large, thumb) || thumb;
      const fullscreen =
        resolveGalleryEntryAssetPath(entry, entry?.fullscreen, large, thumb) || large;
      const category = normalizeGalleryCategory(entry?.category);
      const featured = isGalleryEntryHomepageFeatured(entry);
      const featuredThumb = resolveGalleryEntryAssetPath(entry, entry?.featuredThumb, thumb) || thumb;
      const previewThumb = featured ? featuredThumb : thumb;
      const displayTitle = String(entry?.title || entry?.id || `Generated ${index + 1}`)
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120);
      const displayCardDescription = normalizeCardDescription(entry?.cardDescription || "", 120);
      const displayDescription =
        String(entry?.description || "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 320) || "Generated in VSCimage.";
      const idToken = sanitizeName(entry?.id || displayTitle || `generated-${index + 1}`);
      const cardClasses = ["card", "reveal", "generated-card"];
      if (featured) {
        cardClasses.push("is-featured");
      }
      const imageClasses = ["card-image"];
      if (featured) {
        imageClasses.push("card-image-featured");
      }
      const escapedTitle = escapeHtml(displayTitle);
      const escapedThumb = escapeHtml(previewThumb);
      const escapedLarge = escapeHtml(large);
      const escapedFullscreen = escapeHtml(fullscreen);
      const escapedCardDescription = escapeHtml(displayCardDescription);
      const escapedDescription = escapeHtml(displayDescription);

      return [
        `          <article class="${cardClasses.join(" ")}" data-category="${category}" data-generated="true"${featured ? ' data-featured="true"' : ""}>`,
        `            <a class="work-link" data-project-id="generated_${idToken}" href="${escapedLarge}" data-lightbox-src="${escapedLarge}" data-fullscreen-src="${escapedFullscreen}" data-lightbox-title="${escapedTitle}" data-lightbox-description="${escapedDescription}">`,
        `              <img class="${imageClasses.join(" ")}" src="${escapedThumb}" alt="Preview image for ${escapedTitle}" loading="lazy" />`,
        `              <h3>${escapedTitle}</h3>`,
        displayCardDescription ? `              <p>${escapedCardDescription}</p>` : "",
        "            </a>",
        '            <button class="card-fullscreen" type="button" aria-label="View generated image in fullscreen">',
        '              <span aria-hidden="true">⤢</span>',
        "            </button>",
        "          </article>"
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n");
}

async function syncHomepageGeneratedGallery(galleryEntries) {
  if (!fsSync.existsSync(homepageIndexPath)) {
    return;
  }

  const html = await fs.readFile(homepageIndexPath, "utf8");
  if (!html.includes(generatedGalleryStartMarker) || !html.includes(generatedGalleryEndMarker)) {
    return;
  }

  const generatedMarkup = buildGeneratedGalleryMarkup(galleryEntries);
  const replacement = [
    generatedGalleryStartMarker,
    generatedMarkup || "",
    `          ${generatedGalleryEndMarker}`
  ].join("\n");

  const markerPattern = new RegExp(
    `${escapeRegExp(generatedGalleryStartMarker)}[\\s\\S]*?${escapeRegExp(
      generatedGalleryEndMarker
    )}`,
    "m"
  );

  const nextHtml = html.replace(markerPattern, replacement);
  if (nextHtml !== html) {
    await fs.writeFile(homepageIndexPath, nextHtml, "utf8");
  }
}

async function ensureVscimageStorage() {
  await fs.mkdir(vscimageOriginalsDir, { recursive: true });
  await fs.mkdir(vscimageGeneratedDir, { recursive: true });

  if (!fsSync.existsSync(vscimageConfigPath)) {
    await fs.writeFile(
      vscimageConfigPath,
      JSON.stringify(defaultVscimageConfig, null, 2),
      "utf8"
    );
  }
}

async function readVscimageConfig() {
  await ensureVscimageStorage();
  const raw = await fs.readFile(vscimageConfigPath, "utf8");
  return JSON.parse(raw);
}

async function writeVscimageConfig(config) {
  await ensureVscimageStorage();
  await fs.writeFile(vscimageConfigPath, JSON.stringify(config, null, 2), "utf8");
  await syncHomepageGeneratedGallery(config.gallery || []);
}

function normalizeTextField(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalizeCardDescription(value, maxLength = 120) {
  return normalizeTextField(value, maxLength);
}

function normalizeGalleryCategory(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return ["branding", "web", "illustration", "all"].includes(normalized)
    ? normalized
    : "all";
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

function toSharpColor(color) {
  const normalized = normalizeHexColor(color);
  if (!normalized) return null;

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
    alpha: 1
  };
}

function resolveVscimageLocalPath(assetPath) {
  const sanitized = sanitizeAssetPath(assetPath);
  if (!sanitized || /^(https?:)?\/\//.test(sanitized)) {
    return "";
  }

  const absolutePath = path.resolve(rootDir, sanitized);
  const relativePath = path.relative(rootDir, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return "";
  }

  return absolutePath;
}

function isPathInsideDirectory(filePath, directoryPath) {
  const relativePath = path.relative(directoryPath, filePath);
  return Boolean(relativePath) && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function extractGeneratedBaseName(filePath) {
  const fileName = path.basename(filePath);
  const match = fileName.match(
    /^(.*?)-(?:thumb-\d+x\d+|featured-thumb-\d+x\d+|large-\d+x\d+|fullscreen-\d+x\d+|logo-\d+)\.[^.]+$/i
  );
  return match?.[1] || "";
}

function getGalleryEntryBaseName(entry) {
  const explicitName = sanitizeName(entry?.assetBaseName);
  if (explicitName) {
    return explicitName;
  }

  const assetPaths = [
    entry?.thumb,
    entry?.featuredThumb,
    entry?.large,
    entry?.fullscreen,
    entry?.logo
  ];
  for (const assetPath of assetPaths) {
    const localPath = resolveVscimageLocalPath(assetPath);
    if (!localPath) continue;

    const baseName = extractGeneratedBaseName(localPath);
    if (baseName) {
      return baseName;
    }
  }

  return "";
}

function getGalleryEntryLogoPath(entry) {
  const explicitPath = sanitizeAssetPath(entry?.logo);
  if (explicitPath) {
    return explicitPath;
  }

  const baseName = getGalleryEntryBaseName(entry);
  if (!baseName) {
    return "";
  }

  return `assets/vscimage/generated/${baseName}-logo-240.png`;
}

function getGalleryEntryFeaturedThumbPath(entry) {
  const explicitPath = sanitizeAssetPath(entry?.featuredThumb);
  if (explicitPath) {
    return explicitPath;
  }

  if (!toBool(entry?.featured, false)) {
    return "";
  }

  const baseName = getGalleryEntryBaseName(entry);
  if (!baseName) {
    return "";
  }

  return `assets/vscimage/generated/${baseName}-featured-thumb-${featuredThumbSize.width}x${featuredThumbSize.height}.webp`;
}

function collectGalleryManagedAssetPaths(entry) {
  return [
    sanitizeAssetPath(entry?.thumb),
    sanitizeAssetPath(getGalleryEntryFeaturedThumbPath(entry)),
    sanitizeAssetPath(entry?.large),
    sanitizeAssetPath(entry?.fullscreen),
    sanitizeAssetPath(getGalleryEntryLogoPath(entry))
  ].filter(Boolean);
}

function collectAssignedAssetUsages(config, assetPath) {
  const normalizedAssetPath = sanitizeAssetPath(assetPath);
  const usages = [];

  if (!normalizedAssetPath) {
    return usages;
  }

  if (sanitizeAssetPath(config?.logos?.light) === normalizedAssetPath) {
    usages.push("Logo Light Theme");
  }

  if (sanitizeAssetPath(config?.logos?.dark) === normalizedAssetPath) {
    usages.push("Logo Dark Theme");
  }

  Object.entries(config?.projects || {}).forEach(([projectId, projectConfig]) => {
    const projectTitle = String(projectConfig?.title || projectId || "Project").trim();
    if (sanitizeAssetPath(projectConfig?.thumb) === normalizedAssetPath) {
      usages.push(`${projectTitle} thumb`);
    }
    if (sanitizeAssetPath(projectConfig?.large) === normalizedAssetPath) {
      usages.push(`${projectTitle} large`);
    }
    if (sanitizeAssetPath(projectConfig?.fullscreen) === normalizedAssetPath) {
      usages.push(`${projectTitle} fullscreen`);
    }
  });

  return usages;
}

async function deleteFileIfPresent(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function deleteGeneratedGalleryAssets(entry) {
  const removablePaths = new Set();
  const relatedBaseNames = new Set();

  [entry?.thumb, getGalleryEntryFeaturedThumbPath(entry), entry?.large, entry?.fullscreen, getGalleryEntryLogoPath(entry)].forEach(
    (assetPath) => {
    const localPath = resolveVscimageLocalPath(assetPath);
    if (!localPath || !isPathInsideDirectory(localPath, vscimageGeneratedDir)) {
      return;
    }

    removablePaths.add(localPath);
    const baseName = extractGeneratedBaseName(localPath);
    if (baseName) {
      relatedBaseNames.add(baseName);
    }
  });

  relatedBaseNames.forEach((baseName) => {
    removablePaths.add(path.join(vscimageGeneratedDir, `${baseName}-logo-240.png`));
  });

  for (const filePath of removablePaths) {
    await deleteFileIfPresent(filePath);
  }
}

async function findLatestOriginalPathForBaseName(baseName) {
  if (!baseName) {
    return "";
  }

  await ensureVscimageStorage();
  const entries = await fs.readdir(vscimageOriginalsDir, { withFileTypes: true });
  const matches = entries
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.startsWith(`${baseName}-`))
    .filter((entry) => acceptedImageExt.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(vscimageOriginalsDir, entry.name))
    .sort((left, right) => left.localeCompare(right));

  return matches.at(-1) || "";
}

async function resolveGalleryOriginalPath(entry) {
  const explicitPath = resolveVscimageLocalPath(entry?.original);
  if (explicitPath && fsSync.existsSync(explicitPath)) {
    return explicitPath;
  }

  return findLatestOriginalPathForBaseName(getGalleryEntryBaseName(entry));
}

function buildGeneratedAssetPaths(baseName) {
  return {
    logo: path.join(vscimageGeneratedDir, `${baseName}-logo-240.png`),
    thumb: path.join(vscimageGeneratedDir, `${baseName}-thumb-760x570.webp`),
    featuredThumb: path.join(
      vscimageGeneratedDir,
      `${baseName}-featured-thumb-${featuredThumbSize.width}x${featuredThumbSize.height}.webp`
    ),
    large: path.join(vscimageGeneratedDir, `${baseName}-large-1900x1600.webp`),
    fullscreen: path.join(vscimageGeneratedDir, `${baseName}-fullscreen-3200x1800.webp`)
  };
}

function buildGeneratedAssetWebPaths(baseName) {
  const localPaths = buildGeneratedAssetPaths(baseName);
  return {
    logo: toWebPath(localPaths.logo),
    thumb: toWebPath(localPaths.thumb),
    featuredThumb: toWebPath(localPaths.featuredThumb),
    large: toWebPath(localPaths.large),
    fullscreen: toWebPath(localPaths.fullscreen)
  };
}

async function generateVscimageOutputsFromBuffer(inputBuffer, options = {}) {
  const baseName = sanitizeName(options.baseName) || `image-${Date.now()}`;
  const requestedOutputs = Array.isArray(options.outputs) ? options.outputs : [];
  const outputs = requestedOutputs.length
    ? requestedOutputs.filter((key) => ["logo", "thumb", "large", "fullscreen"].includes(key))
    : ["logo", "thumb", "large", "fullscreen"];

  if (!outputs.length) {
    throw new Error("No output types selected.");
  }

  const generatedPaths = buildGeneratedAssetPaths(baseName);
  const generated = {};
  const backgroundColor = toSharpColor(options.backgroundColor);
  const fullscreenBackground = backgroundColor || { r: 0, g: 0, b: 0, alpha: 1 };
  const pipeline = sharp(inputBuffer).rotate();

  if (outputs.includes("logo")) {
    await pipeline
      .clone()
      .resize(240, 240, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(generatedPaths.logo);
    generated.logo = toWebPath(generatedPaths.logo);
  }

  if (outputs.includes("thumb")) {
    let thumbPipeline = pipeline.clone();
    if (backgroundColor) {
      thumbPipeline = thumbPipeline.flatten({ background: backgroundColor });
    }
    await thumbPipeline
      .resize(760, 570, {
        fit: "cover",
        position: "attention"
      })
      .webp({ quality: 88 })
      .toFile(generatedPaths.thumb);
    generated.thumb = toWebPath(generatedPaths.thumb);
  }

  if (outputs.includes("featuredThumb")) {
    let featuredPipeline = pipeline.clone();
    if (backgroundColor) {
      featuredPipeline = featuredPipeline.flatten({ background: backgroundColor });
    }
    await featuredPipeline
      .resize(featuredThumbSize.width, featuredThumbSize.height, {
        fit: "cover",
        position: "attention"
      })
      .webp({ quality: 90 })
      .toFile(generatedPaths.featuredThumb);
    generated.featuredThumb = toWebPath(generatedPaths.featuredThumb);
  }

  if (outputs.includes("large")) {
    let largePipeline = pipeline.clone();
    if (backgroundColor) {
      largePipeline = largePipeline.flatten({ background: backgroundColor });
    }
    await largePipeline
      .resize(1900, 1600, {
        fit: "cover",
        position: "attention"
      })
      .webp({ quality: 90 })
      .toFile(generatedPaths.large);
    generated.large = toWebPath(generatedPaths.large);
  }

  if (outputs.includes("fullscreen")) {
    let fullscreenPipeline = pipeline.clone();
    if (backgroundColor) {
      fullscreenPipeline = fullscreenPipeline.flatten({ background: backgroundColor });
    }
    await fullscreenPipeline
      .resize(3200, 1800, {
        fit: "contain",
        background: fullscreenBackground
      })
      .webp({ quality: 92 })
      .toFile(generatedPaths.fullscreen);
    generated.fullscreen = toWebPath(generatedPaths.fullscreen);
  }

  return generated;
}

async function copyManagedGalleryAsset(sourceAssetPath, targetFilePath, label) {
  const sourceLocalPath = resolveVscimageLocalPath(sourceAssetPath);
  if (!sourceLocalPath || !fsSync.existsSync(sourceLocalPath)) {
    const missingAssetError = new Error(
      `${label} image is unavailable. Upload a replacement ${label.toLowerCase()} image or replace the source image.`
    );
    missingAssetError.code = "VSCIMAGE_ASSET_MISSING";
    throw missingAssetError;
  }

  if (sourceLocalPath === targetFilePath) {
    return;
  }

  await fs.copyFile(sourceLocalPath, targetFilePath);
}

async function writeManagedGalleryAsset(outputKey, inputBuffer, targetFilePath, options = {}) {
  const backgroundColor = toSharpColor(options.backgroundColor);
  const pipeline = sharp(inputBuffer).rotate();

  if (outputKey === "logo") {
    await pipeline
      .resize(240, 240, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(targetFilePath);
    return;
  }

  if (outputKey === "thumb") {
    let outputPipeline = pipeline.clone();
    if (backgroundColor) {
      outputPipeline = outputPipeline.flatten({ background: backgroundColor });
    }
    await outputPipeline
      .resize(760, 570, {
        fit: "cover",
        position: "attention"
      })
      .webp({ quality: 88 })
      .toFile(targetFilePath);
    return;
  }

  if (outputKey === "large") {
    let outputPipeline = pipeline.clone();
    if (backgroundColor) {
      outputPipeline = outputPipeline.flatten({ background: backgroundColor });
    }
    await outputPipeline
      .resize(1900, 1600, {
        fit: "cover",
        position: "attention"
      })
      .webp({ quality: 90 })
      .toFile(targetFilePath);
    return;
  }

  if (outputKey === "featuredThumb") {
    let outputPipeline = pipeline.clone();
    if (backgroundColor) {
      outputPipeline = outputPipeline.flatten({ background: backgroundColor });
    }
    await outputPipeline
      .resize(featuredThumbSize.width, featuredThumbSize.height, {
        fit: "cover",
        position: "attention"
      })
      .webp({ quality: 90 })
      .toFile(targetFilePath);
    return;
  }

  if (outputKey === "fullscreen") {
    let outputPipeline = pipeline.clone();
    if (backgroundColor) {
      outputPipeline = outputPipeline.flatten({ background: backgroundColor });
    }
    await outputPipeline
      .resize(3200, 1800, {
        fit: "contain",
        background: backgroundColor || { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .webp({ quality: 92 })
      .toFile(targetFilePath);
    return;
  }

  throw new Error(`Unsupported gallery asset output: ${outputKey}`);
}

async function saveOriginalImageBuffer(inputBuffer, originalName, baseName) {
  const inputExt = path.extname(originalName || "").toLowerCase() || ".bin";
  const originalPath = path.join(vscimageOriginalsDir, `${baseName}-${Date.now()}${inputExt}`);
  await fs.writeFile(originalPath, inputBuffer);
  return originalPath;
}

async function resolveGalleryFeaturedSourceBuffer(entry, candidateAssetPaths = []) {
  const originalPath = await resolveGalleryOriginalPath(entry);
  if (originalPath && fsSync.existsSync(originalPath)) {
    return fs.readFile(originalPath);
  }

  const sourceCandidates = [
    ...candidateAssetPaths,
    entry?.fullscreen,
    entry?.large,
    entry?.thumb
  ];

  for (const assetPath of sourceCandidates) {
    const localPath = resolveVscimageLocalPath(assetPath);
    if (!localPath || !fsSync.existsSync(localPath)) {
      continue;
    }
    return fs.readFile(localPath);
  }

  const missingSourceError = new Error(
    "A source image is required to build the featured full-width thumbnail."
  );
  missingSourceError.code = "VSCIMAGE_FEATURED_SOURCE_MISSING";
  throw missingSourceError;
}

function replaceConfigAssetReferences(config, replacements) {
  const normalizedReplacements = Object.entries(replacements || {}).reduce((acc, [from, to]) => {
    const fromPath = sanitizeAssetPath(from);
    const toPath = sanitizeAssetPath(to);
    if (fromPath && toPath) {
      acc[fromPath] = toPath;
    }
    return acc;
  }, {});

  const replacePath = (value) => {
    const normalizedValue = sanitizeAssetPath(value);
    return normalizedReplacements[normalizedValue] || value;
  };

  if (config.logos) {
    config.logos.light = replacePath(config.logos.light);
    config.logos.dark = replacePath(config.logos.dark);
  }

  Object.values(config.projects || {}).forEach((project) => {
    if (!project) return;
    project.thumb = replacePath(project.thumb);
    project.large = replacePath(project.large);
    project.fullscreen = replacePath(project.fullscreen);
  });

  (config.gallery || []).forEach((entry) => {
    if (!entry) return;
    entry.thumb = replacePath(entry.thumb);
    if (entry.featuredThumb) {
      entry.featuredThumb = replacePath(entry.featuredThumb);
    }
    entry.large = replacePath(entry.large);
    entry.fullscreen = replacePath(entry.fullscreen);
    if (entry.logo) {
      entry.logo = replacePath(entry.logo);
    }
  });
}

async function deleteSupersededGeneratedAssets(previousPaths, nextPaths) {
  const nextPathSet = new Set(nextPaths.map((item) => sanitizeAssetPath(item)).filter(Boolean));
  const obsoletePaths = previousPaths
    .map((item) => sanitizeAssetPath(item))
    .filter((item) => item && !nextPathSet.has(item));

  for (const assetPath of obsoletePaths) {
    const localPath = resolveVscimageLocalPath(assetPath);
    if (!localPath || !isPathInsideDirectory(localPath, vscimageGeneratedDir)) {
      continue;
    }
    await deleteFileIfPresent(localPath);
  }
}

async function editVscimageGalleryEntry(entryId, options = {}) {
  const config = await readVscimageConfig();
  const gallery = Array.isArray(config.gallery) ? config.gallery : [];
  const entryIndex = gallery.findIndex((entry) => String(entry?.id || "").trim() === entryId);

  if (entryIndex === -1) {
    return null;
  }

  const currentEntry = gallery[entryIndex] || {};
  const currentBaseName =
    getGalleryEntryBaseName(currentEntry) || sanitizeName(currentEntry.title) || `image-${Date.now()}`;
  const nextBaseName = sanitizeName(options.name) || currentBaseName;
  const nextTitle =
    normalizeTextField(options.title ?? currentEntry.title ?? nextBaseName, 120) || nextBaseName;
  const nextCardDescription = normalizeCardDescription(
    options.cardDescription ?? currentEntry.cardDescription ?? "",
    120
  );
  const nextCategory = normalizeGalleryCategory(options.category ?? currentEntry.category);
  const nextDescription =
    normalizeTextField(options.description ?? currentEntry.description ?? "", 320) ||
    "Generated in VSCimage.";
  const currentHomepageVisible = isGalleryEntryHomepageVisible(currentEntry);
  const nextHomepageVisible = Object.prototype.hasOwnProperty.call(options, "homepageVisible")
    ? toBool(options.homepageVisible, currentHomepageVisible)
    : currentHomepageVisible;
  const currentFeatured = toBool(currentEntry.featured, Boolean(currentEntry.featuredThumb));
  const nextFeatured = Object.prototype.hasOwnProperty.call(options, "featured")
    ? toBool(options.featured, currentFeatured)
    : currentFeatured;
  const currentBackgroundColor = normalizeHexColor(currentEntry.backgroundColor);
  const nextBackgroundColor = Object.prototype.hasOwnProperty.call(options, "backgroundColor")
    ? normalizeHexColor(options.backgroundColor)
    : currentBackgroundColor;
  const directReplacementFiles = {
    thumb: options.thumbImageBuffer,
    large: options.largeImageBuffer,
    fullscreen: options.fullscreenImageBuffer,
    logo: options.logoImageBuffer
  };
  const hasDirectReplacements = Object.values(directReplacementFiles).some(
    (buffer) => Buffer.isBuffer(buffer) && buffer.length > 0
  );
  const replacesBackgroundSensitiveOutputs = ["thumb", "large", "fullscreen"].every(
    (key) =>
      Buffer.isBuffer(directReplacementFiles[key]) && directReplacementFiles[key].length > 0
  );

  if (
    Object.prototype.hasOwnProperty.call(options, "backgroundColor") &&
    String(options.backgroundColor || "").trim() &&
    !nextBackgroundColor
  ) {
    const invalidColorError = new Error("Background color must be a valid hex color.");
    invalidColorError.code = "VSCIMAGE_INVALID_BACKGROUND";
    throw invalidColorError;
  }

  const hasReplacementImage = Buffer.isBuffer(options.imageBuffer) && options.imageBuffer.length > 0;
  const requiresFullRegeneration =
    hasReplacementImage ||
    (nextBackgroundColor !== currentBackgroundColor && !replacesBackgroundSensitiveOutputs);
  const requiresPathRefresh = nextBaseName !== currentBaseName;
  const hasMaterialAssetChanges =
    requiresFullRegeneration || requiresPathRefresh || hasDirectReplacements;
  const nextManagedPaths = buildGeneratedAssetWebPaths(nextBaseName);
  const currentThumbPath = sanitizeAssetPath(currentEntry.thumb) || nextManagedPaths.thumb;
  const currentFeaturedThumbPath = sanitizeAssetPath(currentEntry.featuredThumb);
  const currentLargePath = sanitizeAssetPath(currentEntry.large) || nextManagedPaths.large;
  const currentFullscreenPath =
    sanitizeAssetPath(currentEntry.fullscreen) || currentLargePath || nextManagedPaths.fullscreen;
  const currentLogoPath = sanitizeAssetPath(currentEntry.logo);
  const previousManagedPaths = collectGalleryManagedAssetPaths(currentEntry);

  let nextOriginalPath = sanitizeAssetPath(currentEntry.original);
  let nextThumbPath = currentThumbPath;
  let nextFeaturedThumbPath = currentFeaturedThumbPath;
  let nextLargePath = currentLargePath;
  let nextFullscreenPath = currentFullscreenPath;
  let nextLogoPath = currentLogoPath;
  let primarySourceBuffer = null;

  if ((requiresFullRegeneration || hasDirectReplacements) && !sharp) {
    const dependencyError = new Error(
      "Image generation dependency is missing. Run npm install to enable editing."
    );
    dependencyError.code = "VSCIMAGE_EDITING_UNAVAILABLE";
    throw dependencyError;
  }

  if (requiresFullRegeneration) {
    if (!sharp) {
      const dependencyError = new Error(
        "Image generation dependency is missing. Run npm install to enable editing."
      );
      dependencyError.code = "VSCIMAGE_EDITING_UNAVAILABLE";
      throw dependencyError;
    }

    let sourceBuffer;
    if (hasReplacementImage) {
      const savedOriginalPath = await saveOriginalImageBuffer(
        options.imageBuffer,
        options.originalName,
        nextBaseName
      );
      sourceBuffer = options.imageBuffer;
      primarySourceBuffer = sourceBuffer;
      nextOriginalPath = toWebPath(savedOriginalPath);

      const previousOriginalPath = resolveVscimageLocalPath(currentEntry.original);
      if (
        previousOriginalPath &&
        previousOriginalPath !== savedOriginalPath &&
        isPathInsideDirectory(previousOriginalPath, vscimageOriginalsDir)
      ) {
        await deleteFileIfPresent(previousOriginalPath);
      }
    } else {
      const existingOriginalPath = await resolveGalleryOriginalPath(currentEntry);
      if (!existingOriginalPath) {
        const missingOriginalError = new Error(
          "Original source image is unavailable. Replace the image to regenerate these assets."
        );
        missingOriginalError.code = "VSCIMAGE_ORIGINAL_MISSING";
        throw missingOriginalError;
      }

      sourceBuffer = await fs.readFile(existingOriginalPath);
      primarySourceBuffer = sourceBuffer;
      nextOriginalPath = toWebPath(existingOriginalPath);
    }

    const outputsToGenerate = ["thumb", "large", "fullscreen"];
    if (currentLogoPath || directReplacementFiles.logo) {
      outputsToGenerate.push("logo");
    }
    const generated = await generateVscimageOutputsFromBuffer(sourceBuffer, {
      baseName: nextBaseName,
      backgroundColor: nextBackgroundColor,
      outputs: outputsToGenerate
    });

    nextThumbPath = sanitizeAssetPath(generated.thumb) || nextManagedPaths.thumb;
    nextLargePath = sanitizeAssetPath(generated.large) || nextManagedPaths.large;
    nextFullscreenPath = sanitizeAssetPath(generated.fullscreen) || nextManagedPaths.fullscreen;
    nextLogoPath = sanitizeAssetPath(generated.logo) || currentLogoPath || "";
  } else if (requiresPathRefresh) {
    const nextLocalPaths = buildGeneratedAssetPaths(nextBaseName);

    await copyManagedGalleryAsset(currentThumbPath, nextLocalPaths.thumb, "Thumb");
    await copyManagedGalleryAsset(currentLargePath, nextLocalPaths.large, "Large");
    await copyManagedGalleryAsset(currentFullscreenPath, nextLocalPaths.fullscreen, "Fullscreen");

    nextThumbPath = nextManagedPaths.thumb;
    nextLargePath = nextManagedPaths.large;
    nextFullscreenPath = nextManagedPaths.fullscreen;

    if (currentLogoPath) {
      await copyManagedGalleryAsset(currentLogoPath, nextLocalPaths.logo, "Logo");
      nextLogoPath = nextManagedPaths.logo;
    }
  }

  for (const [key, fileBuffer] of Object.entries(directReplacementFiles)) {
    if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
      continue;
    }

    if (key === "thumb") {
      nextThumbPath = nextManagedPaths.thumb;
      await writeManagedGalleryAsset(
        "thumb",
        fileBuffer,
        resolveVscimageLocalPath(nextThumbPath),
        { backgroundColor: nextBackgroundColor }
      );
      continue;
    }

    if (key === "large") {
      nextLargePath = nextManagedPaths.large;
      await writeManagedGalleryAsset(
        "large",
        fileBuffer,
        resolveVscimageLocalPath(nextLargePath),
        { backgroundColor: nextBackgroundColor }
      );
      continue;
    }

    if (key === "fullscreen") {
      nextFullscreenPath = nextManagedPaths.fullscreen;
      await writeManagedGalleryAsset(
        "fullscreen",
        fileBuffer,
        resolveVscimageLocalPath(nextFullscreenPath),
        { backgroundColor: nextBackgroundColor }
      );
      continue;
    }

    if (key === "logo") {
      nextLogoPath = nextManagedPaths.logo;
      await writeManagedGalleryAsset(
        "logo",
        fileBuffer,
        resolveVscimageLocalPath(nextLogoPath)
      );
    }
  }

  if (nextFeatured) {
    const shouldRefreshFeaturedThumb =
      hasMaterialAssetChanges || !currentFeatured || !currentFeaturedThumbPath;

    if (shouldRefreshFeaturedThumb) {
      const featuredSourceBuffer =
        primarySourceBuffer ||
        (await resolveGalleryFeaturedSourceBuffer(currentEntry, [
          nextFullscreenPath,
          nextLargePath,
          nextThumbPath,
          currentFullscreenPath,
          currentLargePath,
          currentThumbPath
        ]));

      nextFeaturedThumbPath = nextManagedPaths.featuredThumb;
      await writeManagedGalleryAsset(
        "featuredThumb",
        featuredSourceBuffer,
        resolveVscimageLocalPath(nextFeaturedThumbPath),
        { backgroundColor: nextBackgroundColor }
      );
    } else {
      nextFeaturedThumbPath = currentFeaturedThumbPath || nextManagedPaths.featuredThumb;
    }
  } else {
    nextFeaturedThumbPath = "";
  }

  const pathReplacements = {};
  if (currentThumbPath && nextThumbPath && currentThumbPath !== nextThumbPath) {
    pathReplacements[currentThumbPath] = nextThumbPath;
  }
  if (
    currentFeaturedThumbPath &&
    nextFeaturedThumbPath &&
    currentFeaturedThumbPath !== nextFeaturedThumbPath
  ) {
    pathReplacements[currentFeaturedThumbPath] = nextFeaturedThumbPath;
  }
  if (currentLargePath && nextLargePath && currentLargePath !== nextLargePath) {
    pathReplacements[currentLargePath] = nextLargePath;
  }
  if (
    currentFullscreenPath &&
    nextFullscreenPath &&
    currentFullscreenPath !== nextFullscreenPath
  ) {
    pathReplacements[currentFullscreenPath] = nextFullscreenPath;
  }
  if (currentLogoPath && nextLogoPath && currentLogoPath !== nextLogoPath) {
    pathReplacements[currentLogoPath] = nextLogoPath;
  }
  replaceConfigAssetReferences(config, pathReplacements);

  if (
    hasMaterialAssetChanges ||
    currentFeatured !== nextFeatured ||
    currentFeaturedThumbPath !== nextFeaturedThumbPath
  ) {
    await deleteSupersededGeneratedAssets(previousManagedPaths, [
      nextThumbPath,
      nextFeaturedThumbPath,
      nextLargePath,
      nextFullscreenPath,
      nextLogoPath
    ]);
  }

  gallery[entryIndex] = {
    ...currentEntry,
    title: nextTitle,
    cardDescription: nextCardDescription,
    category: nextCategory,
    description: nextDescription,
    homepageVisible: nextHomepageVisible,
    featured: nextFeatured,
    thumb: nextThumbPath,
    featuredThumb: nextFeaturedThumbPath,
    large: nextLargePath,
    fullscreen: nextFullscreenPath,
    logo: nextLogoPath,
    original: nextOriginalPath,
    assetBaseName: nextBaseName,
    backgroundColor: nextBackgroundColor,
    updatedAt: new Date().toISOString()
  };

  config.gallery = gallery;
  await writeVscimageConfig(config);
  return gallery[entryIndex];
}

async function updateVscimageGalleryEntry(entryId, updates) {
  const config = await readVscimageConfig();
  const gallery = Array.isArray(config.gallery) ? config.gallery : [];
  const entryIndex = gallery.findIndex((entry) => String(entry?.id || "").trim() === entryId);

  if (entryIndex === -1) {
    return null;
  }

  const currentEntry = gallery[entryIndex] || {};
  const nextTitleInput = Object.prototype.hasOwnProperty.call(updates || {}, "title")
    ? updates.title
    : currentEntry.title;
  const nextCardDescriptionInput = Object.prototype.hasOwnProperty.call(
    updates || {},
    "cardDescription"
  )
    ? updates.cardDescription
    : currentEntry.cardDescription;
  const nextDescriptionInput = Object.prototype.hasOwnProperty.call(
    updates || {},
    "description"
  )
    ? updates.description
    : currentEntry.description;
  const nextCategoryInput = Object.prototype.hasOwnProperty.call(updates || {}, "category")
    ? updates.category
    : currentEntry.category;
  const nextTitle =
    normalizeTextField(nextTitleInput || entryId, 120) || entryId;
  const nextCardDescription = normalizeCardDescription(nextCardDescriptionInput || "", 120);
  const nextCategory = normalizeGalleryCategory(nextCategoryInput);
  const nextDescription =
    normalizeTextField(nextDescriptionInput || "", 320) ||
    "Generated in VSCimage.";
  const nextHomepageVisibleInput = Object.prototype.hasOwnProperty.call(
    updates || {},
    "homepageVisible"
  )
    ? updates.homepageVisible
    : currentEntry.homepageVisible;
  const nextHomepageVisible = isGalleryEntryHomepageVisible({
    homepageVisible: nextHomepageVisibleInput
  });

  gallery[entryIndex] = {
    ...currentEntry,
    title: nextTitle,
    cardDescription: nextCardDescription,
    category: nextCategory,
    description: nextDescription,
    homepageVisible: nextHomepageVisible,
    featured: toBool(currentEntry.featured, Boolean(currentEntry.featuredThumb)),
    logo: currentEntry.logo || getGalleryEntryLogoPath(currentEntry),
    featuredThumb: sanitizeAssetPath(currentEntry.featuredThumb),
    assetBaseName: currentEntry.assetBaseName || getGalleryEntryBaseName(currentEntry),
    backgroundColor: normalizeHexColor(currentEntry.backgroundColor),
    original: sanitizeAssetPath(currentEntry.original),
    updatedAt: new Date().toISOString()
  };
  config.gallery = gallery;

  await writeVscimageConfig(config);
  return gallery[entryIndex];
}

async function reorderVscimageGalleryEntry(entryId, direction) {
  const config = await readVscimageConfig();
  const gallery = Array.isArray(config.gallery) ? config.gallery : [];
  const normalizedDirection = String(direction || "").trim().toLowerCase();
  const offset = normalizedDirection === "up" ? -1 : normalizedDirection === "down" ? 1 : 0;

  if (!offset) {
    const invalidDirectionError = new Error("Reorder direction must be up or down.");
    invalidDirectionError.code = "VSCIMAGE_REORDER_INVALID";
    throw invalidDirectionError;
  }

  const { featuredEntries, standardEntries, hiddenEntries } = splitGalleryEntriesByFeatured(gallery);
  const standardIndex = standardEntries.findIndex(
    (entry) => String(entry?.id || "").trim() === entryId
  );

  if (standardIndex === -1) {
    const featuredIndex = featuredEntries.findIndex(
      (entry) => String(entry?.id || "").trim() === entryId
    );

    if (featuredIndex !== -1) {
      const featuredPinnedError = new Error(
        "Featured images stay pinned and cannot be reordered from the standard list."
      );
      featuredPinnedError.code = "VSCIMAGE_REORDER_FEATURED";
      throw featuredPinnedError;
    }

    const hiddenIndex = hiddenEntries.findIndex(
      (entry) => String(entry?.id || "").trim() === entryId
    );

    if (hiddenIndex !== -1) {
      const hiddenEntryError = new Error(
        "Images in Hidden Assetts do not appear on the homepage. Show the image on the homepage before reordering it."
      );
      hiddenEntryError.code = "VSCIMAGE_REORDER_HIDDEN";
      throw hiddenEntryError;
    }

    return null;
  }

  const targetIndex = standardIndex + offset;
  if (targetIndex < 0 || targetIndex >= standardEntries.length) {
    return standardEntries[standardIndex];
  }

  const reorderedStandardEntries = [...standardEntries];
  [reorderedStandardEntries[standardIndex], reorderedStandardEntries[targetIndex]] = [
    reorderedStandardEntries[targetIndex],
    reorderedStandardEntries[standardIndex]
  ];

  config.gallery = [...featuredEntries, ...reorderedStandardEntries, ...hiddenEntries];
  await writeVscimageConfig(config);

  return reorderedStandardEntries[targetIndex];
}

async function deleteVscimageGalleryEntry(entryId) {
  const config = await readVscimageConfig();
  const gallery = Array.isArray(config.gallery) ? config.gallery : [];
  const entryIndex = gallery.findIndex((entry) => String(entry?.id || "").trim() === entryId);

  if (entryIndex === -1) {
    return null;
  }

  const [deletedEntry] = gallery.splice(entryIndex, 1);
  const blockingUsages = [...new Set([
    ...collectAssignedAssetUsages(config, deletedEntry?.thumb),
    ...collectAssignedAssetUsages(config, deletedEntry?.large),
    ...collectAssignedAssetUsages(config, deletedEntry?.fullscreen),
    ...collectAssignedAssetUsages(config, getGalleryEntryLogoPath(deletedEntry))
  ])];

  if (blockingUsages.length) {
    const inUseError = new Error(
      `Thumbnail is still assigned to: ${blockingUsages.join(", ")}. Reassign those slots before deleting it.`
    );
    inUseError.code = "VSCIMAGE_ENTRY_IN_USE";
    throw inUseError;
  }

  config.gallery = gallery;

  await deleteGeneratedGalleryAssets(deletedEntry);
  await writeVscimageConfig(config);

  return deletedEntry;
}

async function listImageFilesRecursive(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const children = await listImageFilesRecursive(absolute);
      files.push(...children);
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (!acceptedImageExt.has(ext)) continue;
    files.push(toWebPath(absolute));
  }

  return files;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeRedirectPath(rawPath) {
  const candidate = String(rawPath || "").trim();
  if (!candidate.startsWith("/")) return "/analytics/overview";
  if (candidate.startsWith("//")) return "/analytics/overview";
  return candidate;
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function resolveAnalyticsRole(username, password) {
  const adminUser = String(process.env.ANALYTICS_ADMIN_USERNAME || "");
  const adminPass = String(process.env.ANALYTICS_ADMIN_PASSWORD || "");
  const viewerUser = String(process.env.ANALYTICS_VIEWER_USERNAME || "");
  const viewerPass = String(process.env.ANALYTICS_VIEWER_PASSWORD || "");

  if (
    adminUser &&
    adminPass &&
    timingSafeEqual(username, adminUser) &&
    timingSafeEqual(password, adminPass)
  ) {
    return "admin";
  }

  if (
    viewerUser &&
    viewerPass &&
    timingSafeEqual(username, viewerUser) &&
    timingSafeEqual(password, viewerPass)
  ) {
    return "viewer";
  }

  return "";
}

function hasAnyAnalyticsCredentials() {
  const adminConfigured =
    Boolean(process.env.ANALYTICS_ADMIN_USERNAME) &&
    Boolean(process.env.ANALYTICS_ADMIN_PASSWORD);
  const viewerConfigured =
    Boolean(process.env.ANALYTICS_VIEWER_USERNAME) &&
    Boolean(process.env.ANALYTICS_VIEWER_PASSWORD);
  return adminConfigured || viewerConfigured;
}

const SESSION_TTL_MINUTES = Math.max(5, toInt(process.env.ANALYTICS_SESSION_TTL_MINUTES, 60));
const SESSION_TTL_MS = SESSION_TTL_MINUTES * 60 * 1000;
const SESSION_SECRET =
  process.env.SESSION_SECRET || "change-this-session-secret-in-production";

const ANALYTICS_DASHBOARD_ENABLED = toBool(process.env.ANALYTICS_DASHBOARD_ENABLED, true);
const ANALYTICS_COLLECT_ENABLED = toBool(process.env.ANALYTICS_COLLECT_ENABLED, true);
const ANALYTICS_ENABLED = toBool(process.env.ANALYTICS_ENABLED, true);
const ANALYTICS_EXCLUDE_INTERNAL = toBool(process.env.ANALYTICS_EXCLUDE_INTERNAL, false);
const ANALYTICS_UI_ENABLED = toBool(process.env.ANALYTICS_UI_ENABLED, true);
const ANALYTICS_UI_ORIGIN = String(
  process.env.ANALYTICS_UI_ORIGIN || "http://127.0.0.1:3001"
).trim();
let analyticsStorageReady = false;

app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "views"));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    name: "vsc_analytics_sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_MS
    }
  })
);

app.use(express.static(rootDir));

app.use("/api", (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

function requireDashboardEnabled(req, res, next) {
  if (!ANALYTICS_DASHBOARD_ENABLED) {
    return res.status(404).send("Analytics dashboard is disabled.");
  }
  return next();
}

function requireAnalyticsStorage(req, res, next) {
  if (!analyticsStorageReady) {
    return res
      .status(503)
      .send("Analytics storage is not ready. Run Prisma migrations and restart.");
  }
  return next();
}

function ensureAnalyticsSession(req, res, options = {}) {
  if (!req.session || !req.session.analyticsAuthenticated) {
    if (options.json) {
      return res.status(401).json({ error: "Authentication required." });
    }
    return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  }

  const now = Date.now();
  const lastSeenAt = Number(req.session.analyticsLastSeenAt || 0);

  if (lastSeenAt && now - lastSeenAt > SESSION_TTL_MS) {
    req.session.destroy(() => {
      if (options.json) {
        res.status(401).json({ error: "Session expired." });
      } else {
        res.redirect("/login?timeout=1");
      }
    });
    return false;
  }

  req.session.analyticsLastSeenAt = now;
  return true;
}

function requireAnalyticsAuth(req, res, next) {
  if (!ensureAnalyticsSession(req, res, { json: false })) {
    return;
  }
  next();
}

function requireAnalyticsApiAuth(req, res, next) {
  if (!ensureAnalyticsSession(req, res, { json: true })) {
    return;
  }
  next();
}

app.get("/api/analytics/config", (req, res) => {
  const measurementId = String(process.env.GA4_MEASUREMENT_ID || "")
    .trim()
    .toUpperCase();
  const debug = toBool(process.env.ANALYTICS_DEBUG, false);

  const gaEnabled = Boolean(
    measurementId && ANALYTICS_ENABLED && !ANALYTICS_EXCLUDE_INTERNAL
  );
  const collectEnabled = Boolean(ANALYTICS_COLLECT_ENABLED && !ANALYTICS_EXCLUDE_INTERNAL);
  const provider = measurementId ? "ga4" : "none";

  return res.status(200).json({
    provider,
    measurementId,
    gaEnabled,
    collectEnabled,
    excludeInternal: ANALYTICS_EXCLUDE_INTERNAL,
    debug
  });
});

app.post("/api/collect", requireAnalyticsStorage, async (req, res) => {
  if (!ANALYTICS_COLLECT_ENABLED || ANALYTICS_EXCLUDE_INTERNAL) {
    return res.status(204).json({ ignored: "disabled" });
  }

  if (analytics.isDoNotTrack(req)) {
    return res.status(204).json({ ignored: "dnt" });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Analytics storage is not configured." });
  }

  const eventPayload = analytics.normalizeCollectPayload(req.body || {}, req);
  if (!eventPayload) {
    return res.status(400).json({ error: "Invalid event payload." });
  }

  try {
    await prisma.event.create({ data: eventPayload });
    analyticsApi.invalidateAnalyticsCache();
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error("Failed to persist analytics event:", error);
    return res.status(500).json({ error: "Unable to persist analytics event." });
  }
});

app.get("/login", requireDashboardEnabled, (req, res) => {
  const missingCredentials = !hasAnyAnalyticsCredentials();

  let error = "";
  if (req.query.timeout === "1") {
    error = "Session expired. Please sign in again.";
  }
  if (missingCredentials) {
    error = "Analytics credentials are not configured in environment variables.";
  }

  res.status(200).render("login", {
    error,
    nextUrl: safeRedirectPath(req.query.next)
  });
});

app.post("/login", requireDashboardEnabled, (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");
  const nextUrl = safeRedirectPath(req.body.next);

  const missingCredentials = !hasAnyAnalyticsCredentials();

  if (missingCredentials) {
    return res.status(503).render("login", {
      error: "Analytics credentials are not configured in environment variables.",
      nextUrl
    });
  }

  const role = resolveAnalyticsRole(username, password);
  if (!role) {
    return res.status(401).render("login", {
      error: "Invalid username or password.",
      nextUrl
    });
  }

  req.session.analyticsAuthenticated = true;
  req.session.analyticsUser = username;
  req.session.analyticsRole = role;
  req.session.analyticsLastSeenAt = Date.now();

  return res.redirect(nextUrl || "/analytics/overview");
});

app.post("/logout", (req, res) => {
  if (!req.session) {
    return res.redirect("/login");
  }

  req.session.destroy(() => {
    res.clearCookie("vsc_analytics_sid");
    res.redirect("/login");
  });
});

app.get("/logout", (req, res) => {
  if (!req.session) {
    return res.redirect("/login");
  }

  req.session.destroy(() => {
    res.clearCookie("vsc_analytics_sid");
    res.redirect("/login");
  });
});

app.get(
  "/api/analytics/me",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  (req, res) => {
    return res.status(200).json({
      username: String(req.session.analyticsUser || ""),
      role: String(req.session.analyticsRole || "viewer")
    });
  }
);

app.get(
  "/api/analytics/overview",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const payload = await analyticsApi.getOverviewReport(prisma, req.query);
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Overview API failed:", error);
      return res.status(500).json({ error: "Unable to load overview analytics." });
    }
  }
);

app.get(
  "/api/analytics/realtime",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const payload = await analyticsApi.getRealtimeReport(prisma, req.query);
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Realtime API failed:", error);
      return res.status(500).json({ error: "Unable to load realtime analytics." });
    }
  }
);

app.get(
  "/api/analytics/acquisition",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const payload = await analyticsApi.getAcquisitionReport(prisma, req.query);
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Acquisition API failed:", error);
      return res.status(500).json({ error: "Unable to load acquisition analytics." });
    }
  }
);

app.get(
  "/api/analytics/engagement/pages",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const payload = await analyticsApi.getEngagementPagesReport(prisma, req.query);
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Engagement pages API failed:", error);
      return res.status(500).json({ error: "Unable to load engagement pages analytics." });
    }
  }
);

app.get(
  "/api/analytics/engagement/case-studies",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const payload = await analyticsApi.getEngagementCaseStudiesReport(prisma, req.query);
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Engagement case studies API failed:", error);
      return res
        .status(500)
        .json({ error: "Unable to load engagement case study analytics." });
    }
  }
);

app.get(
  "/api/analytics/events",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const payload = await analyticsApi.getEventsReport(prisma, req.query);
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Events API failed:", error);
      return res.status(500).json({ error: "Unable to load event analytics." });
    }
  }
);

app.get(
  "/api/analytics/conversions",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const payload = await analyticsApi.getConversionsReport(prisma, req.query);
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Conversions API failed:", error);
      return res.status(500).json({ error: "Unable to load conversions analytics." });
    }
  }
);

app.get(
  "/api/analytics/funnels",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const payload = await analyticsApi.getFunnelsReport(prisma, req.query);
      return res.status(200).json(payload);
    } catch (error) {
      console.error("Funnels API failed:", error);
      return res.status(500).json({ error: "Unable to load funnel analytics." });
    }
  }
);

app.get(
  "/api/analytics/export.csv",
  requireDashboardEnabled,
  requireAnalyticsStorage,
  requireAnalyticsApiAuth,
  async (req, res) => {
    try {
      const range = analyticsApi.buildDateRange(req.query, 30);
      const report = String(req.query.report || "overview")
        .trim()
        .toLowerCase();
      const csv = await analyticsApi.getCsvExport(prisma, req.query);
      const fileName = `analytics-${report}-${range.from}-to-${range.to}.csv`;

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
      return res.status(200).send(csv);
    } catch (error) {
      console.error("CSV export failed:", error);
      return res.status(500).json({ error: "Unable to export CSV." });
    }
  }
);

if (ANALYTICS_UI_ENABLED) {
  const analyticsUiProxy = createProxyMiddleware({
    target: ANALYTICS_UI_ORIGIN,
    changeOrigin: true,
    ws: true,
    logLevel: "warn",
    xfwd: false,
    pathRewrite: (pathValue) => `/analytics${pathValue}`,
    onProxyReq: (proxyReq, req) => {
      const forwardedHost = String(req.headers.host || "").trim();
      if (forwardedHost) {
        proxyReq.setHeader("host", forwardedHost);
        proxyReq.setHeader("x-forwarded-host", forwardedHost);

        const forwardedPort = forwardedHost.split(":")[1];
        if (forwardedPort) {
          proxyReq.setHeader("x-forwarded-port", forwardedPort);
        }
      }

      const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
      proxyReq.setHeader("x-forwarded-proto", forwardedProto);
    },
    onError: (error, req, res) => {
      console.error("Analytics UI proxy failed:", error.message);
      if (!res.headersSent) {
        res.status(502).send("Analytics UI is unavailable. Start the Next.js analytics app.");
      }
    }
  });

  app.use(
    "/analytics",
    (req, res, next) => {
      const publicClientUiPath =
        req.path === "/clients" ||
        req.path.startsWith("/clients/") ||
        req.path === "/home" ||
        req.path.startsWith("/home/") ||
        req.path.startsWith("/_next/");

      if (publicClientUiPath) {
        return analyticsUiProxy(req, res, next);
      }

      return next();
    },
    requireDashboardEnabled,
    requireAnalyticsStorage,
    requireAnalyticsAuth,
    analyticsUiProxy
  );
} else {
  app.get(
    "/analytics",
    requireDashboardEnabled,
    requireAnalyticsStorage,
    requireAnalyticsAuth,
    (req, res) => {
      return res
        .status(503)
        .send("Analytics UI is disabled. Enable ANALYTICS_UI_ENABLED to serve /analytics.");
    }
  );
}

app.post("/api/contact", async (req, res) => {
  const { name, email, brief } = req.body || {};

  if (!name || !email || !brief) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const trimmedName = String(name).trim();
  const trimmedEmail = String(email).trim();
  const trimmedBrief = String(brief).trim();

  if (!trimmedName || !trimmedEmail || !trimmedBrief) {
    return res.status(400).json({ error: "Fields cannot be empty." });
  }

  if (!isValidEmail(trimmedEmail)) {
    return res.status(400).json({ error: "Email is invalid." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    return res
      .status(500)
      .json({ error: "Server email environment variables are not configured." });
  }

  const subject = `New portfolio inquiry from ${trimmedName}`;
  const text = [
    `Name: ${trimmedName}`,
    `Email: ${trimmedEmail}`,
    "",
    "Brief:",
    trimmedBrief
  ].join("\n");

  const html = `
    <h2>New portfolio inquiry</h2>
    <p><strong>Name:</strong> ${escapeHtml(trimmedName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(trimmedEmail)}</p>
    <p><strong>Brief:</strong></p>
    <p>${escapeHtml(trimmedBrief).replaceAll("\n", "<br />")}</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: trimmedEmail,
        subject,
        text,
        html
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Resend API error:", response.status, errorBody);
      return res.status(502).json({ error: "Unable to send email right now." });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({ error: "Unexpected server error." });
  }
});

app.get("/vscimage", (req, res) => {
  res.sendFile(path.join(rootDir, "vscimage.html"));
});

app.get("/api/vscimage/config", async (req, res) => {
  try {
    const config = await readVscimageConfig();
    return res.status(200).json(config);
  } catch (error) {
    console.error("Unable to read VSCimage config:", error);
    return res.status(500).json({ error: "Unable to read image config." });
  }
});

app.post("/api/vscimage/config", async (req, res) => {
  const payload = req.body || {};

  if (!payload.logos || !payload.projects) {
    return res.status(400).json({ error: "Invalid config payload." });
  }

  try {
    await ensureVscimageStorage();
    if (!Array.isArray(payload.gallery)) {
      payload.gallery = [];
    }
    await writeVscimageConfig(payload);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Unable to save VSCimage config:", error);
    return res.status(500).json({ error: "Unable to save image config." });
  }
});

app.get("/api/vscimage/files", async (req, res) => {
  try {
    await ensureVscimageStorage();
    const allFiles = await listImageFilesRecursive(assetsDir);
    const filtered = allFiles
      .filter((filePath) => !filePath.includes("assets/vscimage/originals/"))
      .sort((a, b) => a.localeCompare(b));
    return res.status(200).json({ files: filtered });
  } catch (error) {
    console.error("Unable to list files for VSCimage:", error);
    return res.status(500).json({ error: "Unable to list image files." });
  }
});

app.post("/api/vscimage/gallery/:entryId/update", async (req, res) => {
  const entryId = String(req.params.entryId || "").trim();
  const title = normalizeTextField(req.body?.title, 120);
  const cardDescription = normalizeCardDescription(req.body?.cardDescription, 120);
  const category = normalizeGalleryCategory(req.body?.category);
  const description = normalizeTextField(req.body?.description, 320);
  const hasHomepageVisible = Object.prototype.hasOwnProperty.call(req.body || {}, "homepageVisible");

  if (!entryId) {
    return res.status(400).json({ error: "Gallery entry id is required." });
  }

  if (!title) {
    return res.status(400).json({ error: "Gallery entry title is required." });
  }

  try {
    const updatedEntry = await updateVscimageGalleryEntry(entryId, {
      title,
      cardDescription,
      category,
      description,
      ...(hasHomepageVisible ? { homepageVisible: req.body.homepageVisible } : {})
    });
    if (!updatedEntry) {
      return res.status(404).json({ error: "Gallery entry was not found." });
    }

    return res.status(200).json({ ok: true, entry: updatedEntry });
  } catch (error) {
    console.error("Unable to update VSCimage gallery entry:", error);
    return res.status(500).json({ error: "Unable to update thumbnail entry." });
  }
});

app.post("/api/vscimage/gallery/:entryId/reorder", async (req, res) => {
  const entryId = String(req.params.entryId || "").trim();
  const direction = String(req.body?.direction || "").trim().toLowerCase();

  if (!entryId) {
    return res.status(400).json({ error: "Gallery entry id is required." });
  }

  try {
    const reorderedEntry = await reorderVscimageGalleryEntry(entryId, direction);
    if (!reorderedEntry) {
      return res.status(404).json({ error: "Gallery entry was not found." });
    }

    return res.status(200).json({ ok: true, entry: reorderedEntry });
  } catch (error) {
    if (
      [
        "VSCIMAGE_REORDER_INVALID",
        "VSCIMAGE_REORDER_FEATURED",
        "VSCIMAGE_REORDER_HIDDEN"
      ].includes(error.code)
    ) {
      return res.status(400).json({ error: error.message });
    }

    console.error("Unable to reorder VSCimage gallery entry:", error);
    return res.status(500).json({ error: "Unable to reorder thumbnail entry." });
  }
});

app.post("/api/vscimage/gallery/:entryId/delete", async (req, res) => {
  const entryId = String(req.params.entryId || "").trim();

  if (!entryId) {
    return res.status(400).json({ error: "Gallery entry id is required." });
  }

  try {
    const deletedEntry = await deleteVscimageGalleryEntry(entryId);
    if (!deletedEntry) {
      return res.status(404).json({ error: "Gallery entry was not found." });
    }

    return res.status(200).json({ ok: true, entry: deletedEntry });
  } catch (error) {
    if (error.code === "VSCIMAGE_ENTRY_IN_USE") {
      return res.status(409).json({ error: error.message });
    }
    console.error("Unable to delete VSCimage gallery entry:", error);
    return res.status(500).json({ error: "Unable to delete thumbnail entry." });
  }
});

if (upload) {
  app.post("/api/vscimage/gallery/:entryId/edit", upload.fields(galleryEditUploadFields), async (req, res) => {
    const entryId = String(req.params.entryId || "").trim();
    const uploadedFiles = Object.values(req.files || {})
      .flat()
      .filter(Boolean);

    if (!entryId) {
      return res.status(400).json({ error: "Gallery entry id is required." });
    }

    for (const file of uploadedFiles) {
      const mime = String(file.mimetype || "").trim().toLowerCase();
      const ext = path.extname(file.originalname || "").toLowerCase();
      if (!mime.startsWith("image/") && !acceptedImageExt.has(ext)) {
        return res.status(400).json({ error: "Only image files are supported." });
      }
    }

    const sourceImage = req.files?.image?.[0];
    const thumbImage = req.files?.thumbImage?.[0];
    const largeImage = req.files?.largeImage?.[0];
    const fullscreenImage = req.files?.fullscreenImage?.[0];
    const logoImage = req.files?.logoImage?.[0];

    try {
      const editedEntry = await editVscimageGalleryEntry(entryId, {
        title: req.body?.title,
        cardDescription: req.body?.cardDescription,
        category: req.body?.category,
        description: req.body?.description,
        homepageVisible: req.body?.homepageVisible,
        featured: req.body?.featured,
        name: req.body?.name,
        backgroundColor: req.body?.backgroundColor,
        imageBuffer: sourceImage?.buffer,
        originalName: sourceImage?.originalname,
        thumbImageBuffer: thumbImage?.buffer,
        largeImageBuffer: largeImage?.buffer,
        fullscreenImageBuffer: fullscreenImage?.buffer,
        logoImageBuffer: logoImage?.buffer
      });

      if (!editedEntry) {
        return res.status(404).json({ error: "Gallery entry was not found." });
      }

      return res.status(200).json({ ok: true, entry: editedEntry });
    } catch (error) {
      if (
        [
          "VSCIMAGE_ORIGINAL_MISSING",
          "VSCIMAGE_ASSET_MISSING",
          "VSCIMAGE_FEATURED_SOURCE_MISSING",
          "VSCIMAGE_INVALID_BACKGROUND",
          "VSCIMAGE_EDITING_UNAVAILABLE"
        ].includes(error.code)
      ) {
        return res.status(400).json({ error: error.message });
      }

      console.error("Unable to edit VSCimage gallery entry:", error);
      return res.status(500).json({ error: "Unable to edit thumbnail entry." });
    }
  });

  app.post("/api/vscimage/upload", upload.single("image"), async (req, res) => {
    if (!sharp) {
      return res.status(503).json({
        error:
          "Image generation dependency is missing. Run npm install to enable uploads."
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required." });
    }

    const mime = String(req.file.mimetype || "").trim().toLowerCase();
    const inputExt = path.extname(req.file.originalname || "").toLowerCase();
    if (!mime.startsWith("image/") && !acceptedImageExt.has(inputExt)) {
      return res.status(400).json({ error: "Only image files are supported." });
    }

    const baseName = sanitizeName(req.body.name) || `image-${Date.now()}`;
    const backgroundColor = normalizeHexColor(req.body.backgroundColor);
    const category = normalizeGalleryCategory(req.body.category);
    const homepageVisible = Object.prototype.hasOwnProperty.call(req.body || {}, "homepageVisible")
      ? toBool(req.body.homepageVisible, true)
      : true;
    const requested = Array.isArray(req.body.outputs)
      ? req.body.outputs
      : String(req.body.outputs || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

    const outputs = requested.length
      ? requested.filter((key) => ["logo", "thumb", "large", "fullscreen"].includes(key))
      : ["logo", "thumb", "large", "fullscreen"];

    if (outputs.length === 0) {
      return res.status(400).json({ error: "No output types selected." });
    }

    try {
      await ensureVscimageStorage();

      const originalPath = await saveOriginalImageBuffer(
        req.file.buffer,
        req.file.originalname,
        baseName
      );
      const generated = await generateVscimageOutputsFromBuffer(req.file.buffer, {
        baseName,
        backgroundColor,
        outputs
      });

      let galleryEntry = null;
      const galleryThumb =
        generated.thumb || generated.large || generated.fullscreen || generated.logo || null;

      if (galleryThumb) {
        const config = await readVscimageConfig();
        const gallery = Array.isArray(config.gallery) ? config.gallery : [];
        const entryId = `${baseName}-${Date.now()}`;
        const displayTitle = String(req.body.name || baseName)
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 120);

        galleryEntry = {
          id: entryId,
          title: displayTitle || baseName,
          cardDescription: normalizeCardDescription(req.body.cardDescription || "", 120),
          category,
          description:
            String(req.body.description || "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 320) || "Generated in VSCimage.",
          homepageVisible,
          featured: false,
          thumb: galleryThumb,
          featuredThumb: "",
          large: generated.large || generated.fullscreen || galleryThumb,
          fullscreen: generated.fullscreen || generated.large || galleryThumb,
          logo: generated.logo || "",
          original: toWebPath(originalPath),
          assetBaseName: baseName,
          backgroundColor,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const deduped = gallery.filter((item) => item?.thumb !== galleryThumb);
        config.gallery = [galleryEntry, ...deduped].slice(0, 300);

        await writeVscimageConfig(config);
      }

      return res.status(200).json({
        ok: true,
        original: toWebPath(originalPath),
        outputs: generated,
        galleryEntry
      });
    } catch (error) {
      console.error("Unable to process uploaded image:", error);
      return res.status(500).json({ error: "Unable to process image." });
    }
  });
} else {
  app.post("/api/vscimage/gallery/:entryId/edit", async (req, res) => {
    return res.status(503).json({
      error: "Upload dependency is missing. Run npm install to enable editing."
    });
  });

  app.post("/api/vscimage/upload", async (req, res) => {
    return res.status(503).json({
      error: "Upload dependency is missing. Run npm install to enable uploads."
    });
  });
}

app.get("*", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

let analyticsCronJob = null;

async function bootstrap() {
  await ensureVscimageStorage();
  try {
    const config = await readVscimageConfig();
    await syncHomepageGeneratedGallery(config.gallery || []);
  } catch (error) {
    console.warn("Unable to sync generated gallery into index.html:", error.message);
  }

  if (process.env.DATABASE_URL && (ANALYTICS_DASHBOARD_ENABLED || ANALYTICS_COLLECT_ENABLED)) {
    try {
      await prisma.$connect();
      await prisma.event.count();
      analyticsStorageReady = true;
    } catch (error) {
      analyticsStorageReady = false;
      console.warn(
        "Analytics storage is unavailable. Start Postgres and run Prisma migrations to enable /api/collect and /analytics."
      );
      console.warn(error.message);
    }

    if (analyticsStorageReady) {
      const backfillDays = Math.max(1, toInt(process.env.ANALYTICS_BACKFILL_DAYS, 14));
      await analytics.backfillRecentAggregates(prisma, backfillDays);
      analyticsCronJob = analytics.scheduleDailyAggregation(prisma);
    }
  }

  app.listen(PORT, () => {
    console.log(`Portfolio server running on http://localhost:${PORT}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down.`);

  try {
    if (analyticsCronJob) {
      analyticsCronJob.stop();
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Shutdown cleanup failed:", error);
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

bootstrap().catch((error) => {
  console.error("Unable to initialize server:", error);
  process.exit(1);
});
