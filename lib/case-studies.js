const fs = require("fs/promises");
const path = require("path");

const caseStudiesDir = path.join(__dirname, "..", "content", "case-studies");
const caseStudyIndexPath = path.join(__dirname, "..", "content", "case-study-index.json");

const defaultCaseStudyIndexContent = {
  pageTitle: "Case Studies | Van Shea Creative",
  metaDescription: "Structured, reusable case studies for Van Shea Creative client and concept work.",
  heroEyebrow: "Selected Work",
  heroTitle: "Case studies built from structured content, not duplicated templates.",
  heroLead:
    "Each entry below is powered by a reusable slug route and a JSON content file, so future case studies can be added in VS Code without rebuilding layout components.",
  topImage: null,
  galleryEyebrow: "Gallery",
  galleryTitle: "Case Study Index"
};

function toPublicPath(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:)?\/\//.test(raw)) return raw;
  return raw.startsWith("/") ? raw : `/${raw.replace(/^\/+/, "")}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeUrl(value, { allowRelative = true } = {}) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  if (/^(https?:)?\/\//i.test(raw)) return true;
  if (/^(mailto|tel):/i.test(raw)) return true;
  return allowRelative && raw.startsWith("/");
}

function parseHtmlAttributes(attributeSource) {
  const attrs = [];
  const attrPattern = /([a-zA-Z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = attrPattern.exec(attributeSource || ""))) {
    attrs.push({
      name: String(match[1] || "").toLowerCase(),
      value: String(match[3] ?? match[4] ?? match[5] ?? "").trim()
    });
  }

  return attrs;
}

function sanitizeRichHtml(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const allowedTags = new Set([
    "a",
    "b",
    "blockquote",
    "br",
    "em",
    "figcaption",
    "figure",
    "i",
    "iframe",
    "img",
    "li",
    "ol",
    "p",
    "strong",
    "u",
    "ul"
  ]);
  const voidTags = new Set(["br", "img"]);
  const tagPattern = /<\/?([a-zA-Z0-9-]+)([^>]*)>/g;
  const cleaned = raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|object|embed|form|input|button)[\s\S]*?<\/\1>/gi, "");
  let output = "";
  let cursor = 0;
  let match;

  while ((match = tagPattern.exec(cleaned))) {
    output += escapeHtml(cleaned.slice(cursor, match.index));
    cursor = tagPattern.lastIndex;

    const fullTag = match[0] || "";
    const tagName = String(match[1] || "").toLowerCase();
    const isClosing = /^<\//.test(fullTag);
    const isSelfClosing = /\/\s*>$/.test(fullTag);

    if (!allowedTags.has(tagName)) {
      output += escapeHtml(fullTag);
      continue;
    }

    if (isClosing) {
      if (!voidTags.has(tagName)) {
        output += `</${tagName}>`;
      }
      continue;
    }

    const safeAttrs = [];
    parseHtmlAttributes(match[2]).forEach(({ name, value }) => {
      if (tagName === "a" && name === "href" && isSafeUrl(value)) {
        safeAttrs.push(`href="${escapeHtml(value)}"`);
        return;
      }

      if (tagName === "a" && name === "target" && value === "_blank") {
        safeAttrs.push('target="_blank"');
        safeAttrs.push('rel="noreferrer noopener"');
        return;
      }

      if (tagName === "img" && name === "src" && isSafeUrl(value)) {
        safeAttrs.push(`src="${escapeHtml(toPublicPath(value))}"`);
        return;
      }

      if (tagName === "img" && ["alt", "title", "loading"].includes(name)) {
        safeAttrs.push(`${name}="${escapeHtml(value)}"`);
      }

      if (
        tagName === "iframe" &&
        name === "src" &&
        (/^https:\/\/patents\.google\.com\/patent\/[A-Z0-9]+\/?$/i.test(value) ||
          /^\/assets\/embeds\/[a-z0-9-]+\.html$/i.test(value))
      ) {
        safeAttrs.push(`src="${escapeHtml(value)}"`);
        return;
      }

      if (tagName === "iframe" && ["title", "loading", "referrerpolicy"].includes(name)) {
        safeAttrs.push(`${name}="${escapeHtml(value)}"`);
      }
    });

    if (tagName === "img" && !safeAttrs.some((attr) => attr.startsWith("alt="))) {
      safeAttrs.push('alt=""');
    }

    const attrText = safeAttrs.length ? ` ${safeAttrs.join(" ")}` : "";
    output += `<${tagName}${attrText}${voidTags.has(tagName) || isSelfClosing ? " />" : ">"}`
  }

  output += escapeHtml(cleaned.slice(cursor));
  return output;
}

function normalizeParagraphs(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }

  const raw = String(value || "").trim();
  if (!raw) return [];

  return raw
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeStringList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || "").trim()).filter(Boolean);
  }

  const raw = String(value || "").trim();
  return raw ? [raw] : [];
}

function normalizePlainText(value, maxLength, fallback = "") {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
  return normalized || fallback;
}

function normalizeCaseStudyIndexContent(content = {}) {
  return {
    pageTitle: normalizePlainText(content.pageTitle, 120, defaultCaseStudyIndexContent.pageTitle),
    metaDescription: normalizePlainText(
      content.metaDescription,
      240,
      defaultCaseStudyIndexContent.metaDescription
    ),
    heroEyebrow: normalizePlainText(
      content.heroEyebrow,
      80,
      defaultCaseStudyIndexContent.heroEyebrow
    ),
    heroTitle: normalizePlainText(
      content.heroTitle,
      180,
      defaultCaseStudyIndexContent.heroTitle
    ),
    heroLead: normalizePlainText(content.heroLead, 520, defaultCaseStudyIndexContent.heroLead),
    topImage: normalizeImage(content.topImage, "Case studies index top image", "Case studies"),
    galleryEyebrow: normalizePlainText(
      content.galleryEyebrow,
      80,
      defaultCaseStudyIndexContent.galleryEyebrow
    ),
    galleryTitle: normalizePlainText(
      content.galleryTitle,
      120,
      defaultCaseStudyIndexContent.galleryTitle
    )
  };
}

async function getCaseStudyIndexContent() {
  try {
    const raw = await fs.readFile(caseStudyIndexPath, "utf8");
    return normalizeCaseStudyIndexContent(JSON.parse(raw));
  } catch (error) {
    if (error.code === "ENOENT") {
      return normalizeCaseStudyIndexContent(defaultCaseStudyIndexContent);
    }

    throw error;
  }
}

async function updateCaseStudyIndexContent(content) {
  const normalized = normalizeCaseStudyIndexContent(content);
  await fs.mkdir(path.dirname(caseStudyIndexPath), { recursive: true });
  await fs.writeFile(caseStudyIndexPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

function normalizeImage(image, fallbackAlt = "", fallbackTitle = "") {
  if (!image) return null;

  if (typeof image === "string") {
    const src = toPublicPath(image);
    return src
      ? {
          src,
          alt: fallbackAlt,
          title: fallbackTitle,
          caption: "",
          thumbSrc: src
        }
      : null;
  }

  const src = toPublicPath(image.src || image.path || image.asset || "");
  if (!src) return null;

  const thumbSrc = toPublicPath(image.thumbSrc || image.thumbnail || image.thumb || src) || src;

  return {
    src,
    thumbSrc,
    alt: String(image.alt || fallbackAlt || "").trim(),
    title: String(image.title || fallbackTitle || "").trim(),
    caption: String(image.caption || "").trim()
  };
}

function normalizeSection(section, index, caseStudyTitle) {
  const body = normalizeParagraphs(section?.body);
  const bodyHtml = sanitizeRichHtml(section?.bodyHtml || section?.html || "");
  const bullets = normalizeStringList(section?.bullets);
  const heading = String(section?.heading || `Section ${index + 1}`).trim();

  return {
    id:
      String(section?.id || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `section-${index + 1}`,
    heading,
    body,
    bodyHtml,
    bullets,
    image: normalizeImage(section?.image, `${heading} for ${caseStudyTitle}`, heading)
  };
}

function normalizeMetadata(metadata) {
  return {
    client: String(metadata?.client || "").trim(),
    role: String(metadata?.role || "").trim(),
    year: String(metadata?.year || "").trim(),
    industry: String(metadata?.industry || "").trim(),
    services: normalizeStringList(metadata?.services)
  };
}

function assignLightboxIndexes(caseStudy) {
  const seen = new Map();
  const lightboxImages = [];

  function registerImage(image) {
    if (!image?.src) return null;

    const key = image.src;
    if (seen.has(key)) {
      return {
        ...image,
        lightboxIndex: seen.get(key)
      };
    }

    const lightboxIndex = lightboxImages.length;
    seen.set(key, lightboxIndex);
    lightboxImages.push({
      src: image.src,
      alt: image.alt,
      title: image.title,
      caption: image.caption
    });

    return {
      ...image,
      lightboxIndex
    };
  }

  caseStudy.heroImage = registerImage(caseStudy.heroImage);
  caseStudy.cardImage = registerImage(caseStudy.cardImage);
  caseStudy.featuredImages = caseStudy.featuredImages.map(registerImage).filter(Boolean);
  caseStudy.galleryImages = caseStudy.galleryImages.map(registerImage).filter(Boolean);
  caseStudy.sections = caseStudy.sections.map((section) => ({
    ...section,
    image: registerImage(section.image)
  }));
  caseStudy.lightboxImages = lightboxImages;

  return caseStudy;
}

function normalizeCaseStudy(rawCaseStudy, fallbackSlug) {
  const slug =
    String(rawCaseStudy?.slug || fallbackSlug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "";

  if (!slug) {
    throw new Error("Case study slug is required.");
  }

  const title = String(rawCaseStudy?.title || slug).trim();
  const subtitle = String(rawCaseStudy?.subtitle || "").trim();
  const summary = String(rawCaseStudy?.summary || subtitle || "").trim();
  const metadata = normalizeMetadata(rawCaseStudy?.metadata);
  const heroImage = normalizeImage(
    rawCaseStudy?.heroImage,
    `${title} hero image`,
    `${title} hero image`
  );
  const cardImage = normalizeImage(
    rawCaseStudy?.cardImage || rawCaseStudy?.heroImage,
    `${title} thumbnail`,
    `${title} thumbnail`
  );
  const featuredImages = Array.isArray(rawCaseStudy?.featuredImages)
    ? rawCaseStudy.featuredImages.map((image) =>
        normalizeImage(image, `${title} featured image`, title)
      )
    : [];
  const galleryImages = Array.isArray(rawCaseStudy?.galleryImages)
    ? rawCaseStudy.galleryImages.map((image) =>
        normalizeImage(image, `${title} gallery image`, title)
      )
    : [];
  const sections = Array.isArray(rawCaseStudy?.sections)
    ? rawCaseStudy.sections.map((section, index) =>
        normalizeSection(section, index, title)
      )
    : [];

  const normalized = {
    slug,
    routePath: `/case-studies/${slug}`,
    title,
    subtitle,
    summary,
    published: rawCaseStudy?.published !== false,
    sortOrder: Number.isFinite(Number(rawCaseStudy?.sortOrder))
      ? Number(rawCaseStudy.sortOrder)
      : Number.MAX_SAFE_INTEGER,
    metadata,
    heroImage,
    cardImage,
    featuredImages: featuredImages.filter(Boolean),
    galleryImages: galleryImages.filter(Boolean),
    sections,
    updatedAt: String(rawCaseStudy?.updatedAt || "").trim(),
    readingTime: String(rawCaseStudy?.readingTime || "").trim()
  };

  return assignLightboxIndexes(normalized);
}

function sortCaseStudies(caseStudies) {
  return [...caseStudies].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    const leftYear = Number.parseInt(left.metadata.year || "0", 10);
    const rightYear = Number.parseInt(right.metadata.year || "0", 10);

    if (leftYear !== rightYear) {
      return rightYear - leftYear;
    }

    return left.title.localeCompare(right.title);
  });
}

async function loadCaseStudies() {
  let entries = [];

  try {
    entries = await fs.readdir(caseStudiesDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }

  const caseStudies = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".json")) continue;
    if (entry.name.startsWith("_")) continue;

    const filePath = path.join(caseStudiesDir, entry.name);
    const fileContents = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(fileContents);
    const fallbackSlug = path.basename(entry.name, ".json");
    const normalized = normalizeCaseStudy(parsed, fallbackSlug);

    if (normalized.published) {
      caseStudies.push(normalized);
    }
  }

  return sortCaseStudies(caseStudies);
}

async function listCaseStudies() {
  return loadCaseStudies();
}

async function getCaseStudyBySlug(slug) {
  const normalizedSlug = String(slug || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalizedSlug) return null;

  const caseStudies = await loadCaseStudies();
  return caseStudies.find((caseStudy) => caseStudy.slug === normalizedSlug) || null;
}

module.exports = {
  getCaseStudyIndexContent,
  updateCaseStudyIndexContent,
  listCaseStudies,
  getCaseStudyBySlug
};
