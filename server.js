const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs/promises");
const fsSync = require("fs");
const { execFile } = require("child_process");
const { promisify } = require("util");
const { createProxyMiddleware } = require("http-proxy-middleware");
const prisma = require("./lib/prisma");
const analytics = require("./lib/analytics");
const analyticsApi = require("./lib/analytics-api");
const { listCaseStudies, getCaseStudyBySlug } = require("./lib/case-studies");
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
const execFileAsync = promisify(execFile);
const PORT = process.env.PORT || 3000;
const rootDir = __dirname;
const assetsDir = path.join(rootDir, "assets");
const livesiteDir = path.join(rootDir, "livesite");
const comingsoonDir = path.join(rootDir, "comingsoon");
const buildDir = path.join(rootDir, "build");
const largeWebPortfolioDir = path.join(rootDir, "large_web_portfolio");
const vscimageDir = path.join(assetsDir, "vscimage");
const vscimageOriginalsDir = path.join(vscimageDir, "originals");
const vscimageGeneratedDir = path.join(vscimageDir, "generated");
const vscimageConfigPath = path.join(vscimageDir, "config.json");
const caseStudiesContentDir = path.join(rootDir, "content", "case-studies");
const homepageIndexPaths = [
  path.join(rootDir, "index.html"),
  path.join(livesiteDir, "index.html"),
  path.join(comingsoonDir, "index.html")
];
const featuredThumbSize = {
  width: 2400,
  height: 570
};
const publicRootFiles = new Set([
  "/analytics.js",
  "/experience.html",
  "/index.html",
  "/index.html.en",
  "/script.js",
  "/styles.css",
  "/vscimage.css",
  "/vscimage.js"
]);
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

function parseTrustedOriginList(rawValue) {
  const origins = new Set();

  String(rawValue || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      try {
        origins.add(new URL(value).origin);
      } catch (_error) {
        // Ignore malformed values so a typo does not crash local development.
      }
    });

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
  }

  return origins;
}

function readRuntimeSecret(name, fallback = "") {
  const configuredValue = String(process.env[name] || "").trim();
  if (configuredValue) {
    return configuredValue;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} must be set in production.`);
  }

  return fallback;
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
  const archivedEntries = [];

  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (isGalleryEntryArchived(entry)) {
      archivedEntries.push(entry);
      return;
    }

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

  return { featuredEntries, standardEntries, hiddenEntries, archivedEntries };
}

function sortGalleryEntriesForDisplay(entries) {
  const { featuredEntries, standardEntries } = splitGalleryEntriesByFeatured(entries);
  return [...featuredEntries, ...standardEntries];
}

function isGalleryEntryHomepageVisible(entry) {
  if (isGalleryEntryArchived(entry)) {
    return false;
  }

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

function isGalleryEntryArchived(entry) {
  return toBool(entry?.archived, false);
}

function createBufferHash(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    return "";
  }

  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function createUniqueAssetBaseName(gallery, requestedBaseName, excludeEntryId = "") {
  const safeBaseName = sanitizeName(requestedBaseName) || `image-${Date.now()}`;
  const used = new Set(
    (Array.isArray(gallery) ? gallery : [])
      .filter((entry) => String(entry?.id || "").trim() !== String(excludeEntryId || "").trim())
      .map((entry) => sanitizeName(entry?.assetBaseName || getGalleryEntryBaseName(entry)))
      .filter(Boolean)
  );

  if (!used.has(safeBaseName)) {
    return safeBaseName;
  }

  let counter = 2;
  let nextCandidate = `${safeBaseName}-${counter}`;
  while (used.has(nextCandidate)) {
    counter += 1;
    nextCandidate = `${safeBaseName}-${counter}`;
  }

  return nextCandidate;
}

function findDuplicateGalleryEntry(gallery, options = {}) {
  const rows = Array.isArray(gallery) ? gallery : [];
  const nextHash = String(options.sourceHash || "").trim();
  const nextBaseName = sanitizeName(options.baseName || "");

  if (nextHash) {
    const exactMatch = rows.find((entry) => String(entry?.sourceHash || "").trim() === nextHash);
    if (exactMatch) {
      return {
        entry: exactMatch,
        reason: "sourceHash"
      };
    }
  }

  if (nextBaseName) {
    const nameMatch = rows.find(
      (entry) => sanitizeName(entry?.assetBaseName || getGalleryEntryBaseName(entry)) === nextBaseName
    );
    if (nameMatch) {
      return {
        entry: nameMatch,
        reason: "assetBaseName"
      };
    }
  }

  return null;
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
      const displayDescription = normalizeGalleryDescription(entry?.description || "", 320);
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
      const escapedLinkText = escapeHtml(normalizeLinkText(entry?.linkText || "", 80));
      const escapedLinkUrl = escapeHtml(normalizeLinkUrl(entry?.linkUrl || "", 320));
      const escapedDetailUrl = escapeHtml(normalizeLinkUrl(entry?.detailUrl || "", 320));
      const escapedHref = escapedDetailUrl || escapedLarge;

      return [
        `          <article class="${cardClasses.join(" ")}" data-category="${category}" data-generated="true"${featured ? ' data-featured="true"' : ""}>`,
        `            <a class="work-link" data-project-id="generated_${idToken}" href="${escapedHref}"${escapedDetailUrl ? ` data-detail-url="${escapedDetailUrl}"` : ""} data-lightbox-src="${escapedLarge}" data-fullscreen-src="${escapedFullscreen}" data-lightbox-title="${escapedTitle}" data-lightbox-description="${escapedDescription}"${escapedLinkText ? ` data-lightbox-link-text="${escapedLinkText}"` : ""}${escapedLinkUrl ? ` data-lightbox-link-url="${escapedLinkUrl}"` : ""}>`,
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
  const generatedMarkup = buildGeneratedGalleryMarkup(galleryEntries);
  const replacement = [generatedGalleryStartMarker, generatedMarkup || "", `          ${generatedGalleryEndMarker}`].join("\n");
  const markerPattern = new RegExp(
    `${escapeRegExp(generatedGalleryStartMarker)}[\\s\\S]*?${escapeRegExp(generatedGalleryEndMarker)}`,
    "m"
  );

  for (const homepageIndexPath of homepageIndexPaths) {
    if (!fsSync.existsSync(homepageIndexPath)) {
      continue;
    }

    const html = await fs.readFile(homepageIndexPath, "utf8");
    if (!html.includes(generatedGalleryStartMarker) || !html.includes(generatedGalleryEndMarker)) {
      continue;
    }

    const nextHtml = html.replace(markerPattern, replacement);
    if (nextHtml !== html) {
      await fs.writeFile(homepageIndexPath, nextHtml, "utf8");
    }
  }
}

async function refreshStaticSiteCache() {
  const config = await readVscimageConfig();
  await syncHomepageGeneratedGallery(config.gallery || []);

  const scriptPath = path.join(rootDir, "scripts", "materialize-static-variant.mjs");
  const result = await execFileAsync(process.execPath, [scriptPath, "all"], {
    cwd: rootDir,
    timeout: 120000,
    maxBuffer: 1024 * 1024
  });

  return {
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
  };
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

function normalizeGalleryDescription(value, maxLength = 320) {
  const normalized = normalizeTextField(value, maxLength);
  return /^generated in vscimage\.?$/i.test(normalized) ? "" : normalized;
}

function normalizeCardDescription(value, maxLength = 120) {
  return normalizeTextField(value, maxLength);
}

function toPublicAssetPath(value) {
  const normalized = sanitizeAssetPath(value);
  if (!normalized) return "";
  if (/^(https?:)?\/\//.test(normalized)) return normalized;
  return `/${normalized}`;
}

function toCaseStudyImagePayload(entry, overrides = {}, slot = "") {
  const src =
    slot === "heroImage"
      ? entry?.fullscreen || entry?.large || entry?.thumb || ""
      : entry?.large || entry?.fullscreen || entry?.thumb || "";
  const thumbSrc = entry?.thumb || src;
  const fallbackTitle = String(entry?.title || "").trim();
  const fallbackDescription = String(entry?.description || entry?.cardDescription || "").trim();

  return {
    src: toPublicAssetPath(src),
    thumbSrc: toPublicAssetPath(thumbSrc),
    alt: normalizeTextField(overrides.alt || fallbackTitle, 180),
    title: normalizeTextField(overrides.title || fallbackTitle, 120),
    caption: normalizeTextField(overrides.caption || fallbackDescription, 240)
  };
}

async function readCaseStudyContentFiles() {
  let entries = [];

  try {
    entries = await fs.readdir(caseStudiesContentDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }

  const caseStudies = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name.startsWith("_")) {
      continue;
    }

    const filePath = path.join(caseStudiesContentDir, entry.name);
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    const fallbackSlug = path.basename(entry.name, ".json");
    const slug = sanitizeName(parsed.slug || fallbackSlug);

    if (!slug || parsed.published === false) continue;

    caseStudies.push({
      slug,
      title: normalizeTextField(parsed.title || slug, 160),
      subtitle: normalizeTextField(parsed.subtitle || "", 260),
      summary: normalizeTextField(parsed.summary || "", 520),
      readingTime: normalizeTextField(parsed.readingTime || "", 40),
      routePath: `/case-studies/${slug}`,
      fileName: entry.name,
      filePath,
      cardImage: parsed.cardImage || null,
      heroImage: parsed.heroImage || null,
      featuredImages: Array.isArray(parsed.featuredImages) ? parsed.featuredImages : [],
      galleryImages: Array.isArray(parsed.galleryImages) ? parsed.galleryImages : [],
      sections: Array.isArray(parsed.sections)
        ? parsed.sections.map((section, index) => ({
            id: sanitizeName(section?.id || `section-${index + 1}`),
            heading: normalizeTextField(section?.heading || `Section ${index + 1}`, 120),
            bodyHtml: String(section?.bodyHtml || section?.html || ""),
            body: Array.isArray(section?.body) ? section.body : [],
            bullets: Array.isArray(section?.bullets) ? section.bullets : [],
            image: section?.image || null
          }))
        : [],
      sortOrder: Number.isFinite(Number(parsed.sortOrder))
        ? Number(parsed.sortOrder)
        : Number.MAX_SAFE_INTEGER
    });
  }

  return caseStudies.sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.title.localeCompare(right.title);
  });
}

async function readCaseStudyContentBySlug(slug) {
  const normalizedSlug = sanitizeName(slug);
  const caseStudies = await readCaseStudyContentFiles();
  const match = caseStudies.find((caseStudy) => caseStudy.slug === normalizedSlug);
  if (!match) return null;

  const raw = await fs.readFile(match.filePath, "utf8");
  return {
    ...match,
    content: JSON.parse(raw)
  };
}

function toVscimageCaseStudyResponse(caseStudy) {
  if (!caseStudy) return null;

  return {
    slug: caseStudy.slug,
    title: caseStudy.title,
    subtitle: caseStudy.subtitle,
    summary: caseStudy.summary,
    readingTime: caseStudy.readingTime,
    routePath: caseStudy.routePath,
    cardImage: caseStudy.cardImage,
    heroImage: caseStudy.heroImage,
    featuredImages: caseStudy.featuredImages,
    galleryImages: caseStudy.galleryImages,
    sections: caseStudy.sections
  };
}

function normalizeLinkText(value, maxLength = 80) {
  return normalizeTextField(value, maxLength);
}

function normalizeLinkUrl(value, maxLength = 320) {
  const raw = String(value || "").trim().slice(0, maxLength);
  if (!raw) return "";

  if (raw.startsWith("/")) {
    return raw;
  }

  return /^(https?:|mailto:|tel:)/i.test(raw) ? raw : "";
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

function clampNumber(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function medianChannel(values, channel) {
  const sorted = values
    .map((value) => value[channel])
    .sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] || 0;
}

async function analyzeSmartContentBounds(inputBuffer) {
  const image = sharp(inputBuffer).rotate().ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  if (!width || !height) {
    return null;
  }

  const readPixel = (x, y) => {
    const offset = (y * width + x) * 4;
    return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
  };
  const edgeInset = Math.max(1, Math.min(24, Math.floor(Math.min(width, height) * 0.01)));
  const samplePoints = [
    [edgeInset, edgeInset],
    [width - edgeInset - 1, edgeInset],
    [edgeInset, height - edgeInset - 1],
    [width - edgeInset - 1, height - edgeInset - 1],
    [Math.floor(width / 2), edgeInset],
    [Math.floor(width / 2), height - edgeInset - 1],
    [edgeInset, Math.floor(height / 2)],
    [width - edgeInset - 1, Math.floor(height / 2)]
  ];
  const edgeSamples = samplePoints
    .map(([x, y]) => readPixel(clampNumber(x, 0, width - 1), clampNumber(y, 0, height - 1)))
    .filter((pixel) => pixel[3] > 180);

  const alphaBounds = {
    minX: width,
    minY: height,
    maxX: -1,
    maxY: -1,
    count: 0
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha <= 24) continue;
      alphaBounds.minX = Math.min(alphaBounds.minX, x);
      alphaBounds.minY = Math.min(alphaBounds.minY, y);
      alphaBounds.maxX = Math.max(alphaBounds.maxX, x);
      alphaBounds.maxY = Math.max(alphaBounds.maxY, y);
      alphaBounds.count += 1;
    }
  }

  const alphaCoverage = alphaBounds.count / (width * height);
  const hasTransparentMatte = alphaCoverage > 0 && alphaCoverage < 0.92;
  if (hasTransparentMatte && alphaBounds.maxX >= alphaBounds.minX && alphaBounds.maxY >= alphaBounds.minY) {
    return {
      width,
      height,
      bounds: alphaBounds
    };
  }

  if (edgeSamples.length < 4) {
    return null;
  }

  const background = [
    medianChannel(edgeSamples, 0),
    medianChannel(edgeSamples, 1),
    medianChannel(edgeSamples, 2)
  ];
  const edgeDrift = edgeSamples.reduce((maxDistance, pixel) => {
    const distance =
      Math.abs(pixel[0] - background[0]) +
      Math.abs(pixel[1] - background[1]) +
      Math.abs(pixel[2] - background[2]);
    return Math.max(maxDistance, distance);
  }, 0);

  if (edgeDrift > 72) {
    return null;
  }

  const subjectBounds = {
    minX: width,
    minY: height,
    maxX: -1,
    maxY: -1,
    count: 0
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];
      if (alpha <= 180) continue;

      const distance =
        Math.abs(data[offset] - background[0]) +
        Math.abs(data[offset + 1] - background[1]) +
        Math.abs(data[offset + 2] - background[2]);
      if (distance <= 48) continue;

      subjectBounds.minX = Math.min(subjectBounds.minX, x);
      subjectBounds.minY = Math.min(subjectBounds.minY, y);
      subjectBounds.maxX = Math.max(subjectBounds.maxX, x);
      subjectBounds.maxY = Math.max(subjectBounds.maxY, y);
      subjectBounds.count += 1;
    }
  }

  if (subjectBounds.maxX < subjectBounds.minX || subjectBounds.maxY < subjectBounds.minY) {
    return null;
  }

  const subjectWidth = subjectBounds.maxX - subjectBounds.minX + 1;
  const subjectHeight = subjectBounds.maxY - subjectBounds.minY + 1;
  const subjectCoverage = subjectBounds.count / (width * height);
  const subjectAreaRatio = (subjectWidth * subjectHeight) / (width * height);
  const coversNearlyFullFrame = subjectWidth / width > 0.92 && subjectHeight / height > 0.92;

  if (
    subjectCoverage < 0.001 ||
    subjectAreaRatio > 0.88 ||
    coversNearlyFullFrame
  ) {
    return null;
  }

  return {
    width,
    height,
    bounds: subjectBounds
  };
}

function buildSmartCropRegion(analysis, targetWidth, targetHeight) {
  if (!analysis?.bounds || !targetWidth || !targetHeight) {
    return null;
  }

  const { width, height, bounds } = analysis;
  const boundsWidth = bounds.maxX - bounds.minX + 1;
  const boundsHeight = bounds.maxY - bounds.minY + 1;
  if (boundsWidth <= 1 || boundsHeight <= 1) {
    return null;
  }

  const padX = Math.max(Math.round(boundsWidth * 0.18), Math.round(width * 0.03), 24);
  const padY = Math.max(Math.round(boundsHeight * 0.35), Math.round(height * 0.04), 24);
  const padded = {
    minX: clampNumber(bounds.minX - padX, 0, width - 1),
    minY: clampNumber(bounds.minY - padY, 0, height - 1),
    maxX: clampNumber(bounds.maxX + padX, 0, width - 1),
    maxY: clampNumber(bounds.maxY + padY, 0, height - 1)
  };

  const targetAspect = targetWidth / targetHeight;
  let cropWidth = padded.maxX - padded.minX + 1;
  let cropHeight = cropWidth / targetAspect;
  const paddedHeight = padded.maxY - padded.minY + 1;

  if (cropHeight < paddedHeight) {
    cropHeight = paddedHeight;
    cropWidth = cropHeight * targetAspect;
  }
  if (cropWidth > width) {
    cropWidth = width;
    cropHeight = cropWidth / targetAspect;
  }
  if (cropHeight > height) {
    cropHeight = height;
    cropWidth = cropHeight * targetAspect;
  }
  if (cropWidth > width) {
    cropWidth = width;
  }

  cropWidth = Math.max(1, Math.round(cropWidth));
  cropHeight = Math.max(1, Math.round(cropHeight));

  const centerX = (bounds.minX + bounds.maxX + 1) / 2;
  const centerY = (bounds.minY + bounds.maxY + 1) / 2;
  let left = Math.round(centerX - cropWidth / 2);
  let top = Math.round(centerY - cropHeight / 2);

  left = clampNumber(left, 0, width - cropWidth);
  top = clampNumber(top, 0, height - cropHeight);

  if (cropWidth >= boundsWidth) {
    if (left > bounds.minX) left = bounds.minX;
    if (left + cropWidth - 1 < bounds.maxX) left = bounds.maxX - cropWidth + 1;
  }
  if (cropHeight >= boundsHeight) {
    if (top > bounds.minY) top = bounds.minY;
    if (top + cropHeight - 1 < bounds.maxY) top = bounds.maxY - cropHeight + 1;
  }

  left = clampNumber(Math.round(left), 0, width - cropWidth);
  top = clampNumber(Math.round(top), 0, height - cropHeight);

  const nearlyFullFrame = cropWidth / width > 0.96 && cropHeight / height > 0.96;
  if (nearlyFullFrame) {
    return null;
  }

  return {
    left,
    top,
    width: cropWidth,
    height: cropHeight
  };
}

function applySmartCrop(pipeline, analysis, targetWidth, targetHeight) {
  const crop = buildSmartCropRegion(analysis, targetWidth, targetHeight);
  return crop ? pipeline.extract(crop) : pipeline;
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
  const smartCropAnalysis = await analyzeSmartContentBounds(inputBuffer);

  if (outputs.includes("logo")) {
    await applySmartCrop(pipeline.clone(), smartCropAnalysis, 240, 240)
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
    await applySmartCrop(thumbPipeline, smartCropAnalysis, 760, 570)
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
    await applySmartCrop(
      featuredPipeline,
      smartCropAnalysis,
      featuredThumbSize.width,
      featuredThumbSize.height
    )
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
    await applySmartCrop(largePipeline, smartCropAnalysis, 1900, 1600)
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
    await applySmartCrop(fullscreenPipeline, smartCropAnalysis, 3200, 1800)
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
  const smartCropAnalysis = await analyzeSmartContentBounds(inputBuffer);

  if (outputKey === "logo") {
    await applySmartCrop(pipeline, smartCropAnalysis, 240, 240)
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
    await applySmartCrop(outputPipeline, smartCropAnalysis, 760, 570)
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
    await applySmartCrop(outputPipeline, smartCropAnalysis, 1900, 1600)
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
    await applySmartCrop(
      outputPipeline,
      smartCropAnalysis,
      featuredThumbSize.width,
      featuredThumbSize.height
    )
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
    await applySmartCrop(outputPipeline, smartCropAnalysis, 3200, 1800)
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
  const nextLinkText = normalizeLinkText(options.linkText ?? currentEntry.linkText ?? "", 80);
  const nextLinkUrl = normalizeLinkUrl(options.linkUrl ?? currentEntry.linkUrl ?? "", 320);
  const nextCategory = normalizeGalleryCategory(options.category ?? currentEntry.category);
  const nextDescription = normalizeGalleryDescription(
    options.description ?? currentEntry.description ?? "",
    320
  );
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
  const currentArchived = isGalleryEntryArchived(currentEntry);
  const currentArchivedAt = normalizeTextField(currentEntry.archivedAt || "", 64);
  const nextArchived = Object.prototype.hasOwnProperty.call(options, "archived")
    ? toBool(options.archived, currentArchived)
    : currentArchived;
  const nextArchivedAt = nextArchived ? currentArchivedAt || new Date().toISOString() : "";
  const currentSourceHash = normalizeTextField(currentEntry.sourceHash || "", 128);
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
  let nextSourceHash = currentSourceHash;

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
      nextSourceHash = createBufferHash(options.imageBuffer);

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
    linkText: nextLinkText,
    linkUrl: nextLinkUrl,
    category: nextCategory,
    description: nextDescription,
    homepageVisible: nextArchived ? false : nextHomepageVisible,
    featured: nextFeatured,
    thumb: nextThumbPath,
    featuredThumb: nextFeaturedThumbPath,
    large: nextLargePath,
    fullscreen: nextFullscreenPath,
    logo: nextLogoPath,
    original: nextOriginalPath,
    assetBaseName: nextBaseName,
    backgroundColor: nextBackgroundColor,
    archived: nextArchived,
    archivedAt: nextArchivedAt,
    sourceHash: nextSourceHash,
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
  const nextLinkTextInput = Object.prototype.hasOwnProperty.call(updates || {}, "linkText")
    ? updates.linkText
    : currentEntry.linkText;
  const nextLinkUrlInput = Object.prototype.hasOwnProperty.call(updates || {}, "linkUrl")
    ? updates.linkUrl
    : currentEntry.linkUrl;
  const nextLinkText = normalizeLinkText(nextLinkTextInput || "", 80);
  const nextLinkUrl = normalizeLinkUrl(nextLinkUrlInput || "", 320);
  const nextCategory = normalizeGalleryCategory(nextCategoryInput);
  const nextDescription = normalizeGalleryDescription(nextDescriptionInput || "", 320);
  const nextHomepageVisibleInput = Object.prototype.hasOwnProperty.call(
    updates || {},
    "homepageVisible"
  )
    ? updates.homepageVisible
    : currentEntry.homepageVisible;
  const nextHomepageVisible = isGalleryEntryHomepageVisible({
    homepageVisible: nextHomepageVisibleInput
  });
  const nextArchivedInput = Object.prototype.hasOwnProperty.call(updates || {}, "archived")
    ? updates.archived
    : currentEntry.archived;
  const nextArchived = toBool(nextArchivedInput, false);
  const nextArchivedAt = nextArchived
    ? normalizeTextField(
        Object.prototype.hasOwnProperty.call(updates || {}, "archivedAt")
          ? updates.archivedAt
          : currentEntry.archivedAt || new Date().toISOString(),
        64
      )
    : "";

  gallery[entryIndex] = {
    ...currentEntry,
    title: nextTitle,
    cardDescription: nextCardDescription,
    linkText: nextLinkText,
    linkUrl: nextLinkUrl,
    category: nextCategory,
    description: nextDescription,
    homepageVisible: nextArchived ? false : nextHomepageVisible,
    featured: toBool(currentEntry.featured, Boolean(currentEntry.featuredThumb)),
    logo: currentEntry.logo || getGalleryEntryLogoPath(currentEntry),
    featuredThumb: sanitizeAssetPath(currentEntry.featuredThumb),
    assetBaseName: currentEntry.assetBaseName || getGalleryEntryBaseName(currentEntry),
    backgroundColor: normalizeHexColor(currentEntry.backgroundColor),
    original: sanitizeAssetPath(currentEntry.original),
    archived: nextArchived,
    archivedAt: nextArchivedAt,
    sourceHash: normalizeTextField(currentEntry.sourceHash || "", 128),
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

  const { featuredEntries, standardEntries, hiddenEntries, archivedEntries } =
    splitGalleryEntriesByFeatured(gallery);
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

  config.gallery = [...featuredEntries, ...reorderedStandardEntries, ...hiddenEntries, ...archivedEntries];
  await writeVscimageConfig(config);

  return reorderedStandardEntries[targetIndex];
}

async function moveVscimageGalleryEntry(entryId, targetEntryId) {
  const config = await readVscimageConfig();
  const gallery = Array.isArray(config.gallery) ? config.gallery : [];
  const { featuredEntries, standardEntries, hiddenEntries, archivedEntries } =
    splitGalleryEntriesByFeatured(gallery);
  const entryIndex = standardEntries.findIndex((entry) => String(entry?.id || "").trim() === entryId);
  const targetIndex = standardEntries.findIndex(
    (entry) => String(entry?.id || "").trim() === targetEntryId
  );

  if (entryIndex === -1 || targetIndex === -1) {
    return null;
  }

  const reorderedStandardEntries = [...standardEntries];
  const [movedEntry] = reorderedStandardEntries.splice(entryIndex, 1);
  const adjustedTargetIndex = entryIndex < targetIndex ? targetIndex - 1 : targetIndex;
  reorderedStandardEntries.splice(adjustedTargetIndex, 0, movedEntry);

  config.gallery = [...featuredEntries, ...reorderedStandardEntries, ...hiddenEntries, ...archivedEntries];
  await writeVscimageConfig(config);

  return movedEntry;
}

async function setVscimageGalleryEntryArchived(entryId, archived = true) {
  const updates = {
    archived,
    archivedAt: archived ? new Date().toISOString() : ""
  };
  if (archived) {
    updates.homepageVisible = false;
  }
  return updateVscimageGalleryEntry(entryId, updates);
}

async function deleteVscimageGalleryEntry(entryId) {
  const config = await readVscimageConfig();
  const gallery = Array.isArray(config.gallery) ? config.gallery : [];
  const entryIndex = gallery.findIndex((entry) => String(entry?.id || "").trim() === entryId);

  if (entryIndex === -1) {
    return null;
  }

  const [deletedEntry] = gallery.splice(entryIndex, 1);
  if (!isGalleryEntryArchived(deletedEntry)) {
    const archiveFirstError = new Error(
      "Archive the image first. Permanent delete is only available from Archived Assets."
    );
    archiveFirstError.code = "VSCIMAGE_ARCHIVE_FIRST";
    throw archiveFirstError;
  }
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
const SESSION_SECRET = readRuntimeSecret(
  "SESSION_SECRET",
  "change-this-session-secret-in-production"
);
const TRUSTED_WEB_ORIGINS = parseTrustedOriginList(process.env.TRUSTED_WEB_ORIGINS);

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

const publicRootStatic = express.static(rootDir, {
  dotfiles: "ignore",
  fallthrough: true,
  index: false,
  redirect: false
});
const publicAssetsStatic = express.static(assetsDir, {
  dotfiles: "ignore",
  fallthrough: true,
  index: false,
  redirect: false
});
const publicLargePortfolioStatic = express.static(largeWebPortfolioDir, {
  dotfiles: "ignore",
  fallthrough: true,
  index: false,
  redirect: false
});
const publicLivesiteStatic = express.static(livesiteDir, {
  dotfiles: "ignore",
  fallthrough: true,
  index: false,
  redirect: false
});
const publicComingsoonStatic = express.static(comingsoonDir, {
  dotfiles: "ignore",
  fallthrough: true,
  index: false,
  redirect: false
});
const publicBuildStatic = express.static(buildDir, {
  dotfiles: "ignore",
  fallthrough: true,
  index: false,
  redirect: false
});

function serveStaticSubpath(staticHandler, routePrefix) {
  return (req, res, next) => {
    const originalUrl = req.url;
    const nextUrl = req.url === routePrefix ? "/" : req.url.slice(routePrefix.length) || "/";
    req.url = nextUrl.startsWith("/") ? nextUrl : `/${nextUrl}`;
    staticHandler(req, res, (error) => {
      req.url = originalUrl;
      next(error);
    });
  };
}

const serveAssetsStatic = serveStaticSubpath(publicAssetsStatic, "/assets");
const serveLargePortfolioStatic = serveStaticSubpath(
  publicLargePortfolioStatic,
  "/large_web_portfolio"
);
const serveLivesiteStatic = serveStaticSubpath(publicLivesiteStatic, "/livesite");
const serveComingsoonStatic = serveStaticSubpath(publicComingsoonStatic, "/comingsoon");
const serveBuildStatic = serveStaticSubpath(publicBuildStatic, "/build");

function serveFolderIndex(routePrefix, absoluteIndexPath) {
  app.get([routePrefix, `${routePrefix}/`], (req, res) => {
    res.sendFile(absoluteIndexPath);
  });
}

app.use((req, res, next) => {
  if (!["GET", "HEAD"].includes(req.method)) {
    return next();
  }

  if (publicRootFiles.has(req.path)) {
    return publicRootStatic(req, res, next);
  }

  if (req.path.startsWith("/assets/")) {
    const assetPath = req.path.slice("/assets/".length);
    if (assetPath === "vscimage/originals" || assetPath.startsWith("vscimage/originals/")) {
      return res.status(404).send("Not found.");
    }

    return serveAssetsStatic(req, res, next);
  }

  if (req.path.startsWith("/large_web_portfolio/")) {
    return serveLargePortfolioStatic(req, res, next);
  }

  if (req.path === "/livesite" || req.path.startsWith("/livesite/")) {
    return serveLivesiteStatic(req, res, next);
  }

  if (req.path === "/comingsoon" || req.path.startsWith("/comingsoon/")) {
    return serveComingsoonStatic(req, res, next);
  }

  if (req.path === "/build" || req.path.startsWith("/build/")) {
    return serveBuildStatic(req, res, next);
  }

  return next();
});

serveFolderIndex("/livesite", path.join(livesiteDir, "index.html"));
serveFolderIndex("/comingsoon", path.join(comingsoonDir, "index.html"));
serveFolderIndex("/build", path.join(buildDir, "index.html"));

app.get("/app", (req, res) => {
  res.redirect("/analytics");
});

app.get("/app/*", (req, res) => {
  const suffix = req.path.replace(/^\/app/, "") || "/";
  res.redirect(`/analytics${suffix}`);
});

app.use("/api", (req, res, next) => {
  const requestOrigin = String(req.headers.origin || "").trim();
  const originAllowed = !requestOrigin || TRUSTED_WEB_ORIGINS.has(requestOrigin);

  if (requestOrigin && originAllowed) {
    res.set("Access-Control-Allow-Origin", requestOrigin);
    res.append("Vary", "Origin");
  }

  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    if (!originAllowed) {
      return res.status(403).json({ error: "Origin is not allowed." });
    }
    return res.sendStatus(204);
  }

  if (!originAllowed) {
    return res.status(403).json({ error: "Origin is not allowed." });
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
      res.status(401).json({ error: "Authentication required." });
      return false;
    }
    res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
    return false;
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

function requireAnalyticsAdmin(req, res, next) {
  if (!ensureAnalyticsSession(req, res, { json: false })) {
    return;
  }

  if (String(req.session.analyticsRole || "") !== "admin") {
    return res.status(403).send("Admin access required.");
  }

  next();
}

function requireAnalyticsAdminApi(req, res, next) {
  if (!ensureAnalyticsSession(req, res, { json: true })) {
    return;
  }

  if (String(req.session.analyticsRole || "") !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
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

app.get("/vscimage", requireAnalyticsAdmin, (req, res) => {
  res.sendFile(path.join(rootDir, "vscimage.html"));
});

app.get("/case-studies", async (req, res) => {
  try {
    const caseStudies = await listCaseStudies();

    return res.render("case-studies/index", {
      pageTitle: "Case Studies | Van Shea Creative",
      metaDescription:
        "Structured, reusable case studies for Van Shea Creative client and concept work.",
      currentPath: req.path,
      caseStudies
    });
  } catch (error) {
    console.error("Unable to load case study index:", error);
    return res.status(500).send("Unable to load case studies.");
  }
});


app.get("/case-studies/:slug", async (req, res) => {
  try {
    const caseStudy = await getCaseStudyBySlug(req.params.slug);

    if (!caseStudy) {
      return res.status(404).send("Case study not found.");
    }

    return res.render("case-studies/show", {
      pageTitle: `${caseStudy.title} | Case Study | Van Shea Creative`,
      metaDescription: caseStudy.summary || caseStudy.subtitle || caseStudy.title,
      currentPath: req.path,
      caseStudy
    });
  } catch (error) {
    console.error("Unable to load case study detail:", error);
    return res.status(500).send("Unable to load case study.");
  }
});

app.get("/api/vscimage/config", requireAnalyticsAdminApi, async (req, res) => {
  try {
    const config = await readVscimageConfig();
    return res.status(200).json(config);
  } catch (error) {
    console.error("Unable to read VSCimage config:", error);
    return res.status(500).json({ error: "Unable to read image config." });
  }
});

app.post("/api/vscimage/config", requireAnalyticsAdminApi, async (req, res) => {
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

app.post("/api/vscimage/refresh-site", requireAnalyticsAdminApi, async (_req, res) => {
  try {
    const result = await refreshStaticSiteCache();
    return res.status(200).json({
      ok: true,
      refreshed: ["homepage", "livesite", "build"],
      ...result
    });
  } catch (error) {
    console.error("Unable to refresh VSCimage site cache:", error);
    return res.status(500).json({ error: "Unable to refresh site cache." });
  }
});

app.get("/api/vscimage/files", requireAnalyticsAdminApi, async (req, res) => {
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

app.get("/api/vscimage/case-studies", requireAnalyticsAdminApi, async (req, res) => {
  try {
    const caseStudies = (await readCaseStudyContentFiles()).map(
      ({ fileName, filePath, ...caseStudy }) => caseStudy
    );
    return res.status(200).json({ caseStudies });
  } catch (error) {
    console.error("Unable to list VSCimage case studies:", error);
    return res.status(500).json({ error: "Unable to list case studies." });
  }
});

app.post("/api/vscimage/case-studies/:slug/text", requireAnalyticsAdminApi, async (req, res) => {
  const slug = sanitizeName(req.params.slug);

  if (!slug) {
    return res.status(400).json({ error: "Case study slug is required." });
  }

  try {
    const caseStudy = await readCaseStudyContentBySlug(slug);
    if (!caseStudy) {
      return res.status(404).json({ error: "Case study was not found." });
    }

    const nextContent = caseStudy.content;
    const title = normalizeTextField(req.body?.title, 160);
    if (!title) {
      return res.status(400).json({ error: "Case study title is required." });
    }

    nextContent.title = title;
    nextContent.subtitle = normalizeTextField(req.body?.subtitle, 260);
    nextContent.summary = normalizeTextField(req.body?.summary, 520);
    nextContent.readingTime = normalizeTextField(req.body?.readingTime, 40);

    const incomingSections = Array.isArray(req.body?.sections) ? req.body.sections : [];
    const sectionUpdates = new Map(
      incomingSections.map((section) => [
        sanitizeName(section?.id || ""),
        {
          heading: normalizeTextField(section?.heading, 120),
          bodyHtml: String(section?.bodyHtml || "").trim().slice(0, 20000)
        }
      ])
    );

    nextContent.sections = Array.isArray(nextContent.sections) ? nextContent.sections : [];
    nextContent.sections = nextContent.sections.map((section, index) => {
      const sectionId = sanitizeName(section?.id || `section-${index + 1}`);
      const update = sectionUpdates.get(sectionId);
      if (!update) return section;

      return {
        ...section,
        id: sectionId,
        heading: update.heading || section.heading || `Section ${index + 1}`,
        bodyHtml: update.bodyHtml
      };
    });

    nextContent.updatedAt = new Date().toISOString().slice(0, 10);
    await fs.writeFile(caseStudy.filePath, `${JSON.stringify(nextContent, null, 2)}\n`, "utf8");

    const refreshedCaseStudy = await readCaseStudyContentBySlug(slug);
    return res.status(200).json({
      ok: true,
      caseStudy: toVscimageCaseStudyResponse(refreshedCaseStudy)
    });
  } catch (error) {
    console.error("Unable to update case study text:", error);
    return res.status(500).json({ error: "Unable to update case study text." });
  }
});

app.post("/api/vscimage/case-studies/:slug/images", requireAnalyticsAdminApi, async (req, res) => {
  const slug = sanitizeName(req.params.slug);
  const slot = String(req.body?.slot || "").trim();
  const sectionId = sanitizeName(req.body?.sectionId || "");
  const entryId = String(req.body?.entryId || "").trim();
  const allowedSlots = new Set([
    "cardImage",
    "heroImage",
    "featuredImages",
    "galleryImages",
    "sectionImage"
  ]);

  if (!slug) {
    return res.status(400).json({ error: "Case study slug is required." });
  }

  if (!allowedSlots.has(slot)) {
    return res.status(400).json({ error: "Choose a valid case study image destination." });
  }

  if (!entryId) {
    return res.status(400).json({ error: "Choose a VSCimage asset." });
  }

  if (slot === "sectionImage" && !sectionId) {
    return res.status(400).json({ error: "Choose a case study section." });
  }

  try {
    const caseStudy = await readCaseStudyContentBySlug(slug);
    if (!caseStudy) {
      return res.status(404).json({ error: "Case study was not found." });
    }

    const config = await readVscimageConfig();
    const gallery = Array.isArray(config.gallery) ? config.gallery : [];
    const galleryEntry = gallery.find((entry) => String(entry?.id || "") === entryId);
    if (!galleryEntry) {
      return res.status(404).json({ error: "VSCimage asset was not found." });
    }

    const image = toCaseStudyImagePayload(
      galleryEntry,
      {
        alt: req.body?.alt,
        title: req.body?.title,
        caption: req.body?.caption
      },
      slot
    );

    if (!image.src) {
      return res.status(400).json({ error: "The selected VSCimage asset has no usable image." });
    }

    const nextContent = caseStudy.content;
    if (slot === "cardImage" || slot === "heroImage") {
      nextContent[slot] = image;
    } else if (slot === "featuredImages" || slot === "galleryImages") {
      nextContent[slot] = Array.isArray(nextContent[slot]) ? nextContent[slot] : [];
      nextContent[slot].push(image);
    } else if (slot === "sectionImage") {
      nextContent.sections = Array.isArray(nextContent.sections) ? nextContent.sections : [];
      const section = nextContent.sections.find(
        (item, index) => sanitizeName(item?.id || `section-${index + 1}`) === sectionId
      );
      if (!section) {
        return res.status(404).json({ error: "Case study section was not found." });
      }
      section.image = image;
    }

    nextContent.updatedAt = new Date().toISOString().slice(0, 10);
    await fs.writeFile(caseStudy.filePath, `${JSON.stringify(nextContent, null, 2)}\n`, "utf8");

    const refreshedCaseStudy = await readCaseStudyContentBySlug(slug);
    return res.status(200).json({
      ok: true,
      caseStudy: toVscimageCaseStudyResponse(refreshedCaseStudy)
    });
  } catch (error) {
    console.error("Unable to assign VSCimage asset to case study:", error);
    return res.status(500).json({ error: "Unable to assign image to case study." });
  }
});

app.post("/api/vscimage/case-studies/:slug/images/remove", requireAnalyticsAdminApi, async (req, res) => {
  const slug = sanitizeName(req.params.slug);
  const slot = String(req.body?.slot || "").trim();
  const sectionId = sanitizeName(req.body?.sectionId || "");
  const index = Number.parseInt(String(req.body?.index ?? ""), 10);
  const allowedSlots = new Set([
    "cardImage",
    "heroImage",
    "featuredImages",
    "galleryImages",
    "sectionImage"
  ]);

  if (!slug) {
    return res.status(400).json({ error: "Case study slug is required." });
  }

  if (!allowedSlots.has(slot)) {
    return res.status(400).json({ error: "Choose a valid case study image to remove." });
  }

  try {
    const caseStudy = await readCaseStudyContentBySlug(slug);
    if (!caseStudy) {
      return res.status(404).json({ error: "Case study was not found." });
    }

    const nextContent = caseStudy.content;
    let removed = false;

    if (slot === "cardImage" || slot === "heroImage") {
      if (nextContent[slot]) {
        delete nextContent[slot];
        removed = true;
      }
    } else if (slot === "featuredImages" || slot === "galleryImages") {
      const images = Array.isArray(nextContent[slot]) ? nextContent[slot] : [];
      if (Number.isInteger(index) && index >= 0 && index < images.length) {
        images.splice(index, 1);
        nextContent[slot] = images;
        removed = true;
      }
    } else if (slot === "sectionImage") {
      nextContent.sections = Array.isArray(nextContent.sections) ? nextContent.sections : [];
      const section = nextContent.sections.find(
        (item, sectionIndex) =>
          sanitizeName(item?.id || `section-${sectionIndex + 1}`) === sectionId
      );

      if (!section) {
        return res.status(404).json({ error: "Case study section was not found." });
      }

      if (section.image) {
        delete section.image;
        removed = true;
      }
    }

    if (!removed) {
      return res.status(404).json({ error: "Case study image was not found." });
    }

    nextContent.updatedAt = new Date().toISOString().slice(0, 10);
    await fs.writeFile(caseStudy.filePath, `${JSON.stringify(nextContent, null, 2)}\n`, "utf8");

    const refreshedCaseStudy = await readCaseStudyContentBySlug(slug);
    return res.status(200).json({
      ok: true,
      caseStudy: toVscimageCaseStudyResponse(refreshedCaseStudy)
    });
  } catch (error) {
    console.error("Unable to remove VSCimage asset from case study:", error);
    return res.status(500).json({ error: "Unable to remove image from case study." });
  }
});

app.post("/api/vscimage/gallery/:entryId/update", requireAnalyticsAdminApi, async (req, res) => {
  const entryId = String(req.params.entryId || "").trim();
  const title = normalizeTextField(req.body?.title, 120);
  const cardDescription = normalizeCardDescription(req.body?.cardDescription, 120);
  const linkText = normalizeLinkText(req.body?.linkText, 80);
  const linkUrl = normalizeLinkUrl(req.body?.linkUrl, 320);
  const category = normalizeGalleryCategory(req.body?.category);
  const description = normalizeTextField(req.body?.description, 320);
  const hasHomepageVisible = Object.prototype.hasOwnProperty.call(req.body || {}, "homepageVisible");
  const hasArchived = Object.prototype.hasOwnProperty.call(req.body || {}, "archived");

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
      linkText,
      linkUrl,
      category,
      description,
      ...(hasHomepageVisible ? { homepageVisible: req.body.homepageVisible } : {}),
      ...(hasArchived ? { archived: req.body.archived } : {})
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

app.post("/api/vscimage/gallery/:entryId/archive", requireAnalyticsAdminApi, async (req, res) => {
  const entryId = String(req.params.entryId || "").trim();
  const archived = Object.prototype.hasOwnProperty.call(req.body || {}, "archived")
    ? toBool(req.body.archived, true)
    : true;

  if (!entryId) {
    return res.status(400).json({ error: "Gallery entry id is required." });
  }

  try {
    const updatedEntry = await setVscimageGalleryEntryArchived(entryId, archived);
    if (!updatedEntry) {
      return res.status(404).json({ error: "Gallery entry was not found." });
    }

    return res.status(200).json({ ok: true, entry: updatedEntry });
  } catch (error) {
    console.error("Unable to archive VSCimage gallery entry:", error);
    return res.status(500).json({ error: "Unable to update thumbnail archive state." });
  }
});

app.post("/api/vscimage/gallery/:entryId/reorder", requireAnalyticsAdminApi, async (req, res) => {
  const entryId = String(req.params.entryId || "").trim();
  const direction = String(req.body?.direction || "").trim().toLowerCase();
  const targetEntryId = String(req.body?.targetEntryId || "").trim();

  if (!entryId) {
    return res.status(400).json({ error: "Gallery entry id is required." });
  }

  try {
    const reorderedEntry = targetEntryId
      ? await moveVscimageGalleryEntry(entryId, targetEntryId)
      : await reorderVscimageGalleryEntry(entryId, direction);
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

app.post("/api/vscimage/gallery/:entryId/delete", requireAnalyticsAdminApi, async (req, res) => {
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
    if (["VSCIMAGE_ENTRY_IN_USE", "VSCIMAGE_ARCHIVE_FIRST"].includes(error.code)) {
      return res.status(409).json({ error: error.message });
    }
    console.error("Unable to delete VSCimage gallery entry:", error);
    return res.status(500).json({ error: "Unable to delete thumbnail entry." });
  }
});

if (upload) {
  app.post(
    "/api/vscimage/gallery/:entryId/edit",
    requireAnalyticsAdminApi,
    upload.fields(galleryEditUploadFields),
    async (req, res) => {
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
          linkText: req.body?.linkText,
          linkUrl: req.body?.linkUrl,
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
    }
  );

  app.post("/api/vscimage/upload", requireAnalyticsAdminApi, upload.single("image"), async (req, res) => {
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
    const duplicateMode = String(req.body.duplicateMode || "").trim().toLowerCase();
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
      const sourceHash = createBufferHash(req.file.buffer);
      const config = await readVscimageConfig();
      const gallery = Array.isArray(config.gallery) ? config.gallery : [];
      const duplicate = findDuplicateGalleryEntry(gallery, {
        sourceHash,
        baseName
      });

      if (duplicate && !["replace", "keep-both", "skip"].includes(duplicateMode)) {
        return res.status(409).json({
          error: "A matching image already exists in VSCimage.",
          duplicate: {
            id: String(duplicate.entry?.id || "").trim(),
            title: String(duplicate.entry?.title || duplicate.entry?.id || "Existing image").trim(),
            reason: duplicate.reason,
            archived: isGalleryEntryArchived(duplicate.entry),
            homepageVisible: isGalleryEntryHomepageVisible(duplicate.entry)
          }
        });
      }

      if (duplicate && duplicateMode === "skip") {
        return res.status(200).json({
          ok: true,
          skipped: true,
          duplicate: {
            id: String(duplicate.entry?.id || "").trim(),
            title: String(duplicate.entry?.title || duplicate.entry?.id || "Existing image").trim(),
            reason: duplicate.reason
          }
        });
      }

      const duplicateReplacementBaseName = sanitizeName(
        duplicate?.entry?.assetBaseName || getGalleryEntryBaseName(duplicate?.entry) || baseName
      );
      const resolvedBaseName = duplicate && duplicateMode === "replace"
        ? duplicateReplacementBaseName
        : duplicate && duplicateMode === "keep-both"
          ? createUniqueAssetBaseName(gallery, baseName)
          : baseName;
      const displayTitle = String(req.body.name || baseName)
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120);

      if (duplicate && duplicateMode === "replace") {
        const galleryEntry = await editVscimageGalleryEntry(String(duplicate.entry?.id || "").trim(), {
          title: displayTitle || duplicate.entry?.title || resolvedBaseName,
          cardDescription: normalizeCardDescription(req.body.cardDescription || "", 120),
          linkText: normalizeLinkText(req.body.linkText || "", 80),
          linkUrl: normalizeLinkUrl(req.body.linkUrl || "", 320),
          category,
          description: normalizeGalleryDescription(req.body.description || "", 320),
          homepageVisible,
          featured: false,
          name: duplicateReplacementBaseName,
          backgroundColor,
          imageBuffer: req.file.buffer,
          originalName: req.file.originalname,
          archived: false
        });

        return res.status(200).json({
          ok: true,
          original: galleryEntry?.original || "",
          outputs: {
            logo: galleryEntry?.logo || "",
            thumb: galleryEntry?.thumb || "",
            large: galleryEntry?.large || "",
            fullscreen: galleryEntry?.fullscreen || ""
          },
          galleryEntry,
          duplicateHandled: duplicateMode
        });
      }

      const originalPath = await saveOriginalImageBuffer(
        req.file.buffer,
        req.file.originalname,
        resolvedBaseName
      );
      const generated = await generateVscimageOutputsFromBuffer(req.file.buffer, {
        baseName: resolvedBaseName,
        backgroundColor,
        outputs
      });

      let galleryEntry = null;
      const galleryThumb =
        generated.thumb || generated.large || generated.fullscreen || generated.logo || null;

      if (galleryThumb) {
        const entryId = `${resolvedBaseName}-${Date.now()}`;
        galleryEntry = {
          id: entryId,
          title: displayTitle || resolvedBaseName,
          cardDescription: normalizeCardDescription(req.body.cardDescription || "", 120),
          linkText: normalizeLinkText(req.body.linkText || "", 80),
          linkUrl: normalizeLinkUrl(req.body.linkUrl || "", 320),
          category,
          description: normalizeGalleryDescription(req.body.description || "", 320),
          homepageVisible,
          featured: false,
          thumb: galleryThumb,
          featuredThumb: "",
          large: generated.large || generated.fullscreen || galleryThumb,
          fullscreen: generated.fullscreen || generated.large || galleryThumb,
          logo: generated.logo || "",
          original: toWebPath(originalPath),
          assetBaseName: resolvedBaseName,
          backgroundColor,
          archived: false,
          archivedAt: "",
          sourceHash,
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
        galleryEntry,
        duplicateHandled: duplicate ? duplicateMode : ""
      });
    } catch (error) {
      console.error("Unable to process uploaded image:", error);
      return res.status(500).json({ error: "Unable to process image." });
    }
  });
} else {
  app.post("/api/vscimage/gallery/:entryId/edit", requireAnalyticsAdminApi, async (req, res) => {
    return res.status(503).json({
      error: "Upload dependency is missing. Run npm install to enable editing."
    });
  });

  app.post("/api/vscimage/upload", requireAnalyticsAdminApi, async (req, res) => {
    return res.status(503).json({
      error: "Upload dependency is missing. Run npm install to enable uploads."
    });
  });
}

app.get("*", (req, res) => {
  const baseName = path.basename(req.path);
  if (baseName.startsWith(".") || baseName.includes(".")) {
    return res.status(404).send("Not found.");
  }
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
