import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ejs = require("ejs");
const { getCaseStudyIndexContent, listCaseStudies } = require("../lib/case-studies.js");
const { getAiDesignLandingContent, listAiDesignExperiments } = require("../lib/aidesign.js");

const projectRoot = process.cwd();
const requestedVariant = String(process.argv[2] || "build").trim().toLowerCase();
const livesitePromotionApproved = process.argv.includes("--approve-livesite");
const aiDesignOnly = process.argv.includes("--aidesign-only");
const supportedVariants = ["livesite", "build", "comingsoon"];
const variants =
  requestedVariant === "all" ? supportedVariants : supportedVariants.includes(requestedVariant)
    ? [requestedVariant]
    : [];

if (variants.length === 0) {
  console.error(`Unsupported static variant: ${requestedVariant}`);
  process.exit(1);
}

if (["all", "livesite"].includes(requestedVariant) && !livesitePromotionApproved) {
  console.error(
    "Livesite is manually maintained. Re-run with --approve-livesite only after review and approval."
  );
  process.exit(1);
}

if (aiDesignOnly && requestedVariant !== "livesite") {
  console.error("--aidesign-only is supported only for an approved Livesite promotion.");
  process.exit(1);
}

const excludedNames = new Set([".DS_Store", "backups", "originals"]);
const caseStudyIndexTemplatePath = path.join(projectRoot, "views", "case-studies", "index.ejs");
const caseStudyShowTemplatePath = path.join(projectRoot, "views", "case-studies", "show.ejs");
const aiDesignIndexTemplatePath = path.join(projectRoot, "views", "aidesign", "index.ejs");
const aiDesignExperimentsTemplatePath = path.join(
  projectRoot,
  "views",
  "aidesign",
  "experiments.ejs"
);
const aiDesignStockTemplatePath = path.join(
  projectRoot,
  "views",
  "aidesign",
  "stock-performance-test.ejs"
);
const aiDesignStandaloneFiles = [
  "self_care.html",
  "meeting_coach.html",
  "meeting_coach_demo.html"
];
const aiDesignStandaloneSourceRoot = path.join(projectRoot, "content", "aidesign");
const snapshotVariants = new Set(["livesite", "build"]);
const staticUploadVariants = new Set(["livesite"]);
const vscimageConfigPath = path.join(projectRoot, "assets", "vscimage", "config.json");
const generatedGalleryStartMarker = "<!-- VSCIMAGE_GENERATED_START -->";
const generatedGalleryEndMarker = "<!-- VSCIMAGE_GENERATED_END -->";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function sanitizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
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

function normalizeLinkText(value, maxLength = 80) {
  return normalizeTextField(value, maxLength);
}

function normalizeLinkUrl(value, maxLength = 320) {
  const raw = String(value || "").trim().slice(0, maxLength);
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  return /^(https?:|mailto:|tel:)/i.test(raw) ? raw : "";
}

function normalizeGalleryCategory(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "web") return "ux-design";
  return ["branding", "ux-design", "service-design", "education", "illustration", "all"].includes(
    normalized
  )
    ? normalized
    : "all";
}

function normalizeExplicitGalleryWorkType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["corporate", "independent"].includes(normalized) ? normalized : "";
}

function isBehanceGalleryEntry(entry) {
  const haystack = [
    entry?.source,
    entry?.sourceName,
    entry?.platform,
    entry?.collection,
    entry?.title,
    entry?.id,
    entry?.assetBaseName,
    entry?.thumb,
    entry?.large,
    entry?.fullscreen,
    entry?.original,
    entry?.linkUrl,
    entry?.detailUrl
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  return haystack.includes("behance");
}

function normalizeGalleryWorkType(entry) {
  const explicit = normalizeExplicitGalleryWorkType(entry?.designation ?? entry?.workType);
  if (explicit) return explicit;
  return isBehanceGalleryEntry(entry) ? "independent" : "corporate";
}

function sanitizeAssetPath(value) {
  const raw = String(value || "")
    .trim()
    .split("?")[0]
    .split("#")[0];
  if (!raw) return "";
  if (/^(https?:)?\/\//.test(raw)) return raw;
  return raw.replace(/^\/+/, "");
}

function resolveGalleryEntryAssetPath(...candidates) {
  for (const candidate of candidates) {
    const normalized = sanitizeAssetPath(candidate);
    if (normalized) return normalized;
  }

  return "";
}

function isGalleryEntryArchived(entry) {
  return toBool(entry?.archived, false);
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

function splitGalleryEntriesByFeatured(entries) {
  const featuredEntries = [];
  const standardEntries = [];

  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (!isGalleryEntryHomepageVisible(entry)) {
      return;
    }

    if (isGalleryEntryHomepageFeatured(entry)) {
      featuredEntries.push(entry);
      return;
    }

    standardEntries.push(entry);
  });

  return { featuredEntries, standardEntries };
}

function sortGalleryEntriesForDisplay(entries) {
  const { featuredEntries, standardEntries } = splitGalleryEntriesByFeatured(entries);
  return [...featuredEntries, ...standardEntries];
}

function getVariantSourceRoot(variant) {
  return snapshotVariants.has(variant) ? projectRoot : path.join(projectRoot, variant);
}

function rewriteVariantPreviewLinks(html, variant) {
  const prefix = variant === "livesite" ? "" : `/${variant}`;
  const root = `${prefix}/`;

  const rewritten = String(html || "")
    .replace(/href="\/"/g, `href="${root}"`)
    .replace(/href="\/#work"/g, `href="${root}#work"`)
    .replace(/action="\/"/g, `action="${root}"`)
    .replace(/(["'(])\/styles\.css/g, `$1${prefix}/styles.css`)
    .replace(/(["'(])\/script\.js/g, `$1${prefix}/script.js`)
    .replace(/(["'(])\/analytics\.js/g, `$1${prefix}/analytics.js`)
    .replace(/(["'(])\/experience\.html/g, `$1${prefix}/experience.html`)
    .replace(/(["'(])\/case-studies\b/g, `$1${prefix}/case-studies`)
    .replace(/(["'(])\/aidesign\b/g, `$1${prefix}/aidesign`)
    .replace(/(["'(])\/assets\//g, `$1${prefix}/assets/`)
    .replace(/(["'(])\/large_web_portfolio\//g, `$1${prefix}/large_web_portfolio/`);

  return rewritten;
}

function stripStaticOnlyFeatures(html) {
  return String(html || "")
    .replace(/\s*<script src="\/?(?:livesite|comingsoon|build)\/analytics\.js"><\/script>\s*/g, "\n")
    .replace(/\s*<script src="\/?analytics\.js"><\/script>\s*/g, "\n")
    .replace(
      /\s*<aside\b(?=[^>]*\bid="consentBanner")[^>]*>[\s\S]*?<\/aside>\s*/g,
      "\n"
    )
    .replace(/\s*<button class="theme-link consent-manage-btn"[\s\S]*?<\/button>\s*/g, "\n")
    .replace(/\sdata-analytics(?:-location)?="[^"]*"/g, "");
}

function rewriteHtmlForVariant(html, variant) {
  const rewritten = rewriteVariantPreviewLinks(html, variant);
  const output = staticUploadVariants.has(variant)
    ? stripStaticOnlyFeatures(rewritten)
    : rewritten;
  return output.replace(/^[\t ]+$/gm, "");
}

function rewriteScriptForStaticUpload(script) {
  return String(script || "").replace(
    'const sources = ["/api/vscimage/config", "/assets/vscimage/config.json"];',
    'const sources = ["/assets/vscimage/config.json"];'
  );
}

function rewriteStaticConfigForUpload(json) {
  const config = JSON.parse(json);
  return `${JSON.stringify(
    {
      logos: config.logos || {},
      projects: config.projects || {}
    },
    null,
    2
  )}\n`;
}

async function rewriteTopLevelHtmlFiles(variant) {
  const variantRoot = path.join(projectRoot, variant);
  const htmlFiles = ["index.html", "experience.html"];

  for (const fileName of htmlFiles) {
    const filePath = path.join(variantRoot, fileName);
    const raw = await readFile(filePath, "utf8");
    await writeFile(filePath, rewriteHtmlForVariant(raw, variant), "utf8");
  }
}

async function readVscimageGallery() {
  try {
    const raw = await readFile(vscimageConfigPath, "utf8");
    const config = JSON.parse(raw);
    return Array.isArray(config.gallery) ? config.gallery : [];
  } catch (error) {
    return [];
  }
}

function buildGeneratedGalleryMarkup(galleryEntries, variant) {
  const entries = sortGalleryEntriesForDisplay(galleryEntries);
  const generatedMarkup = entries
    .map((entry, index) => {
      const thumb = resolveGalleryEntryAssetPath(entry?.thumb, entry?.large, entry?.fullscreen);
      if (!thumb) return "";

      const large = resolveGalleryEntryAssetPath(entry?.large, thumb) || thumb;
      const fullscreen = resolveGalleryEntryAssetPath(entry?.fullscreen, large, thumb) || large;
      const category = normalizeGalleryCategory(entry?.category);
      const designation = normalizeGalleryWorkType(entry);
      const featured = isGalleryEntryHomepageFeatured(entry);
      const featuredThumb = resolveGalleryEntryAssetPath(entry?.featuredThumb, thumb) || thumb;
      const previewThumb = featured ? featuredThumb : thumb;
      const displayTitle = normalizeTextField(
        entry?.title || entry?.id || `Generated ${index + 1}`,
        120
      );
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
      const clientLogo = resolveGalleryEntryAssetPath(entry?.clientLogo);
      const escapedClientLogo = escapeHtml(clientLogo);
      const escapedDescription = escapeHtml(displayDescription);
      const escapedLinkText = escapeHtml(normalizeLinkText(entry?.linkText || "", 80));
      const escapedLinkUrl = escapeHtml(normalizeLinkUrl(entry?.linkUrl || "", 320));
      const escapedDetailUrl = escapeHtml(normalizeLinkUrl(entry?.detailUrl || "", 320));
      const escapedHref = escapedDetailUrl || escapedLarge;

      return [
        `          <article class="${cardClasses.join(" ")}" data-category="${category}" data-work-type="${designation}" data-designation="${designation}" data-generated="true"${featured ? ' data-featured="true"' : ""}>`,
        `            <a class="work-link" data-project-id="generated_${idToken}" href="${escapedHref}"${escapedDetailUrl ? ` data-detail-url="${escapedDetailUrl}"` : ""} data-lightbox-src="${escapedLarge}" data-fullscreen-src="${escapedFullscreen}" data-lightbox-title="${escapedTitle}" data-lightbox-description="${escapedDescription}"${escapedLinkText ? ` data-lightbox-link-text="${escapedLinkText}"` : ""}${escapedLinkUrl ? ` data-lightbox-link-url="${escapedLinkUrl}"` : ""}>`,
        escapedClientLogo
          ? `              <span class="card-image-shell">\n                <img class="${imageClasses.join(" ")}" src="${escapedThumb}" alt="Preview image for ${escapedTitle}" loading="lazy" />\n                <img class="card-client-logo" src="${escapedClientLogo}" alt="" loading="lazy" />\n              </span>`
          : `              <img class="${imageClasses.join(" ")}" src="${escapedThumb}" alt="Preview image for ${escapedTitle}" loading="lazy" />`,
        `              <h3>${escapedTitle}</h3>`,
        "            </a>",
        escapedDetailUrl
          ? ""
          : '            <button class="card-fullscreen" type="button" aria-label="View generated image in fullscreen">',
        escapedDetailUrl ? "" : '              <span aria-hidden="true">⤢</span>',
        escapedDetailUrl ? "" : "            </button>",
        "          </article>"
      ]
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n");

  return rewriteHtmlForVariant(generatedMarkup, variant);
}

async function syncVariantHomepageGeneratedGallery(variant) {
  const indexPath = path.join(projectRoot, variant, "index.html");
  const html = await readFile(indexPath, "utf8");

  if (!html.includes(generatedGalleryStartMarker) || !html.includes(generatedGalleryEndMarker)) {
    return;
  }

  const gallery = await readVscimageGallery();
  const generatedMarkup = buildGeneratedGalleryMarkup(gallery, variant);
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

  await writeFile(indexPath, html.replace(markerPattern, replacement), "utf8");
}

async function rewriteStaticScriptFile(variant) {
  if (!staticUploadVariants.has(variant)) {
    return;
  }

  const scriptPath = path.join(projectRoot, variant, "script.js");
  const raw = await readFile(scriptPath, "utf8");
  await writeFile(scriptPath, rewriteScriptForStaticUpload(raw), "utf8");
}

async function rewriteStaticConfigFile(variant) {
  if (!staticUploadVariants.has(variant)) {
    return;
  }

  const configPath = path.join(projectRoot, variant, "assets", "vscimage", "config.json");
  const raw = await readFile(configPath, "utf8");
  await writeFile(configPath, rewriteStaticConfigForUpload(raw), "utf8");
}

async function copyTopLevelPublicFiles(variant) {
  const variantRoot = path.join(projectRoot, variant);
  const sourceRoot = getVariantSourceRoot(variant);
  const files = ["index.html", "experience.html", "styles.css", "script.js"];
  if (!staticUploadVariants.has(variant)) {
    files.push("analytics.js");
  }

  for (const fileName of files) {
    await cp(path.join(sourceRoot, fileName), path.join(variantRoot, fileName));
  }
}

async function copyDirectory(relativeSource, absoluteDestination) {
  const sourcePath = path.join(projectRoot, relativeSource);
  try {
    await access(sourcePath);
  } catch (error) {
    return;
  }

  await rm(absoluteDestination, { recursive: true, force: true });
  await mkdir(path.dirname(absoluteDestination), { recursive: true });

  await cp(sourcePath, absoluteDestination, {
    recursive: true,
    filter(sourcePath) {
      const relativePath = path.relative(projectRoot, sourcePath);
      const parts = relativePath.split(path.sep).filter(Boolean);
      return !parts.some((part) => excludedNames.has(part));
    }
  });
}

async function writeVariantHtaccess(variantRoot) {
  const htaccess = `DirectoryIndex index.html
Options -MultiViews

<IfModule mod_rewrite.c>
RewriteEngine On

RewriteRule ^experience/?$ /experience.html [R=302,L]
RewriteRule ^login/?$ / [R=302,L]
RewriteRule ^app(?:/.*)?$ / [R=302,L]
RewriteRule ^analytics(?:/.*)?$ / [R=302,L]
RewriteRule ^vscimage(?:/.*)?$ / [R=302,L]
</IfModule>

ErrorDocument 404 /index.html
`;

  await writeFile(path.join(variantRoot, ".htaccess"), htaccess, "utf8");
}

async function writeCaseStudies(variant) {
  const variantRoot = path.join(projectRoot, variant);
  const caseStudiesRoot = path.join(variantRoot, "case-studies");
  const caseStudyIndex = await getCaseStudyIndexContent();
  const caseStudies = await listCaseStudies();

  await rm(caseStudiesRoot, { recursive: true, force: true });
  await mkdir(caseStudiesRoot, { recursive: true });

  const caseStudyIndexHtml = await ejs.renderFile(caseStudyIndexTemplatePath, {
    pageTitle: caseStudyIndex.pageTitle,
    metaDescription: caseStudyIndex.metaDescription,
    currentPath: "/case-studies",
    caseStudyIndex,
    caseStudies
  });

  await writeFile(
    path.join(caseStudiesRoot, "index.html"),
    rewriteHtmlForVariant(caseStudyIndexHtml, variant),
    "utf8"
  );

  for (const caseStudy of caseStudies) {
    const caseStudyHtml = await ejs.renderFile(caseStudyShowTemplatePath, {
      pageTitle: `${caseStudy.title} | Case Study | Van Shea Creative`,
      metaDescription: caseStudy.summary || caseStudy.subtitle || caseStudy.title,
      currentPath: caseStudy.routePath,
      caseStudy
    });

    const caseStudyDir = path.join(caseStudiesRoot, caseStudy.slug);
    await mkdir(caseStudyDir, { recursive: true });
    await writeFile(
      path.join(caseStudyDir, "index.html"),
      rewriteHtmlForVariant(caseStudyHtml, variant),
      "utf8"
    );
  }
}

async function writeAiDesign(variant) {
  const variantRoot = path.join(projectRoot, variant);
  const aiDesignRoot = path.join(variantRoot, "aidesign");
  const landing = getAiDesignLandingContent();
  const experiments = listAiDesignExperiments();

  await rm(aiDesignRoot, { recursive: true, force: true });
  await mkdir(aiDesignRoot, { recursive: true });

  const landingHtml = await ejs.renderFile(aiDesignIndexTemplatePath, {
    pageTitle: landing.pageTitle,
    metaDescription: landing.metaDescription,
    currentPath: "/aidesign",
    landing
  });
  const rewrittenLandingHtml = rewriteHtmlForVariant(landingHtml, variant);
  await writeFile(path.join(aiDesignRoot, "index.html"), rewrittenLandingHtml, "utf8");

  const indexAliasDir = path.join(aiDesignRoot, "index");
  await mkdir(indexAliasDir, { recursive: true });
  await writeFile(path.join(indexAliasDir, "index.html"), rewrittenLandingHtml, "utf8");

  const experimentsRoot = path.join(aiDesignRoot, "experiments");
  await mkdir(experimentsRoot, { recursive: true });
  const experimentsHtml = await ejs.renderFile(aiDesignExperimentsTemplatePath, {
    pageTitle: "AI Design Lab Experiments | Van Shea Creative",
    metaDescription:
      "A running index of AI application experiments comparing platform output, UX judgment, code quality, and responsible product thinking.",
    currentPath: "/aidesign/experiments",
    landing,
    experiments
  });
  await writeFile(
    path.join(experimentsRoot, "index.html"),
    rewriteHtmlForVariant(experimentsHtml, variant),
    "utf8"
  );

  for (const fileName of aiDesignStandaloneFiles) {
    const sourcePath = path.join(aiDesignStandaloneSourceRoot, fileName);
    try {
      await access(sourcePath);
    } catch (error) {
      continue;
    }
    await cp(sourcePath, path.join(aiDesignRoot, fileName));
  }

  for (const experiment of experiments) {
    const experimentHtml = await ejs.renderFile(aiDesignStockTemplatePath, {
      pageTitle: `${experiment.title} | AI Design Lab | Van Shea Creative`,
      metaDescription: experiment.description,
      currentPath: experiment.routePath,
      experiment
    });

    const experimentDir = path.join(experimentsRoot, experiment.slug);
    await mkdir(experimentDir, { recursive: true });
    await writeFile(
      path.join(experimentDir, "index.html"),
      rewriteHtmlForVariant(experimentHtml, variant),
      "utf8"
    );
  }
}

async function cleanStaticUploadVariant(variantRoot) {
  await rm(path.join(variantRoot, "analytics.js"), { force: true });
  await rm(path.join(variantRoot, "assets", "vscimage", "originals"), {
    recursive: true,
    force: true
  });
}

async function materializeVariant(variant) {
  const variantRoot = path.join(projectRoot, variant);
  await mkdir(variantRoot, { recursive: true });

  if (variant === "livesite" && aiDesignOnly) {
    await mkdir(path.join(variantRoot, "assets"), { recursive: true });
    await cp(
      path.join(projectRoot, "assets", "aidesign.css"),
      path.join(variantRoot, "assets", "aidesign.css")
    );
    await cp(
      path.join(projectRoot, "assets", "aidesign.js"),
      path.join(variantRoot, "assets", "aidesign.js")
    );
    await copyDirectory("assets/aidesign", path.join(variantRoot, "assets", "aidesign"));
    await writeAiDesign(variant);
    return;
  }

  if (snapshotVariants.has(variant)) {
    await copyTopLevelPublicFiles(variant);
    await copyDirectory("assets", path.join(variantRoot, "assets"));
    await copyDirectory("large_web_portfolio", path.join(variantRoot, "large_web_portfolio"));
    await rewriteStaticConfigFile(variant);
    await rewriteTopLevelHtmlFiles(variant);
    await syncVariantHomepageGeneratedGallery(variant);
    await rewriteStaticScriptFile(variant);
    await writeCaseStudies(variant);
    await writeAiDesign(variant);
    if (staticUploadVariants.has(variant)) {
      await cleanStaticUploadVariant(variantRoot);
    }
    await writeVariantHtaccess(variantRoot);
    return;
  }

  await copyDirectory("assets", path.join(variantRoot, "assets"));
  await copyDirectory("large_web_portfolio", path.join(variantRoot, "large_web_portfolio"));
  await writeCaseStudies(variant);
  await writeAiDesign(variant);
  await writeVariantHtaccess(variantRoot);
}

async function main() {
  const resolvedVariants = requestedVariant === "all" ? ["livesite", "build"] : variants;

  for (const variant of resolvedVariants) {
    await materializeVariant(variant);
    process.stdout.write(`Materialized ${variant}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
