import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ejs = require("ejs");
const { getCaseStudyIndexContent, listCaseStudies } = require("../lib/case-studies.js");

const projectRoot = process.cwd();
const requestedVariant = String(process.argv[2] || "all").trim().toLowerCase();
const supportedVariants = ["livesite", "build", "comingsoon"];
const variants =
  requestedVariant === "all" ? supportedVariants : supportedVariants.includes(requestedVariant)
    ? [requestedVariant]
    : [];

if (variants.length === 0) {
  console.error(`Unsupported static variant: ${requestedVariant}`);
  process.exit(1);
}

const excludedNames = new Set([".DS_Store", "backups", "originals"]);
const caseStudyIndexTemplatePath = path.join(projectRoot, "views", "case-studies", "index.ejs");
const caseStudyShowTemplatePath = path.join(projectRoot, "views", "case-studies", "show.ejs");
const snapshotVariants = new Set(["livesite", "build"]);
const staticUploadVariants = new Set(["livesite"]);

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
    .replace(/(["'(])\/assets\//g, `$1${prefix}/assets/`)
    .replace(/(["'(])\/large_web_portfolio\//g, `$1${prefix}/large_web_portfolio/`);

  return rewritten;
}

function stripStaticOnlyFeatures(html) {
  return String(html || "")
    .replace(/\s*<script src="\/?(?:livesite|comingsoon|build)\/analytics\.js"><\/script>\s*/g, "\n")
    .replace(/\s*<script src="\/?analytics\.js"><\/script>\s*/g, "\n")
    .replace(/\s*<aside[\s\S]*?id="consentBanner"[\s\S]*?<\/aside>\s*/g, "\n")
    .replace(/\s*<button class="theme-link consent-manage-btn"[\s\S]*?<\/button>\s*/g, "\n")
    .replace(/\sdata-analytics(?:-location)?="[^"]*"/g, "");
}

function rewriteHtmlForVariant(html, variant) {
  const rewritten = rewriteVariantPreviewLinks(html, variant);
  return staticUploadVariants.has(variant) ? stripStaticOnlyFeatures(rewritten) : rewritten;
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

  if (snapshotVariants.has(variant)) {
    await copyTopLevelPublicFiles(variant);
    await copyDirectory("assets", path.join(variantRoot, "assets"));
    await copyDirectory("large_web_portfolio", path.join(variantRoot, "large_web_portfolio"));
    await rewriteStaticConfigFile(variant);
    await rewriteTopLevelHtmlFiles(variant);
    await rewriteStaticScriptFile(variant);
    await writeCaseStudies(variant);
    if (staticUploadVariants.has(variant)) {
      await cleanStaticUploadVariant(variantRoot);
    }
    await writeVariantHtaccess(variantRoot);
    return;
  }

  await copyDirectory("assets", path.join(variantRoot, "assets"));
  await copyDirectory("large_web_portfolio", path.join(variantRoot, "large_web_portfolio"));
  await writeCaseStudies(variant);
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
