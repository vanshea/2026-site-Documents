import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ejs = require("ejs");
const { listCaseStudies } = require("../lib/case-studies.js");

const projectRoot = process.cwd();
const bundleRoot = path.resolve(
  process.env.SITEGROUND_BUNDLE_OUTPUT_DIR ||
    path.join(process.env.HOME || projectRoot, "Backups", "portfolio-site", "siteground-static-upload")
);
const uploadRoot = path.join(bundleRoot, "ftp-upload");

const filesToCopy = [
  "index.html",
  "script.js",
  "styles.css"
];

const dirsToCopy = ["assets"];

const excludedNames = new Set([".DS_Store", "originals"]);

const caseStudyIndexTemplatePath = path.join(projectRoot, "views", "case-studies", "index.ejs");
const caseStudyShowTemplatePath = path.join(projectRoot, "views", "case-studies", "show.ejs");

function stripStaticOnlyFeatures(html) {
  return String(html || "")
    .replace(/\s*<script src="\/?analytics\.js"><\/script>\s*/g, "\n")
    .replace(/\s*<aside[\s\S]*?id="consentBanner"[\s\S]*?<\/aside>\s*/g, "\n")
    .replace(/\s*<button class="theme-link consent-manage-btn"[\s\S]*?<\/button>\s*/g, "\n")
    .replace(/\sdata-analytics(?:-location)?="[^"]*"/g, "");
}

function rewriteExperienceHtml(html) {
  return stripStaticOnlyFeatures(html).replace(
    /<a href="\/">Home<\/a>/,
    '<a href="index.html">Home</a>'
  );
}

async function copyRelative(relativePath) {
  await cp(path.join(projectRoot, relativePath), path.join(uploadRoot, relativePath), {
    recursive: true,
    filter(sourcePath) {
      const relative = path.relative(projectRoot, sourcePath);
      const parts = relative.split(path.sep).filter(Boolean);
      return !parts.some((part) => excludedNames.has(part));
    }
  });
}

async function writeSitegroundFiles() {
  const experienceHtml = await readFile(path.join(projectRoot, "experience.html"), "utf8");
  const transformedExperienceHtml = rewriteExperienceHtml(experienceHtml);
  const caseStudies = await listCaseStudies();

  const htaccess = `DirectoryIndex index.html
Options -MultiViews

<IfModule mod_rewrite.c>
RewriteEngine On

# Keep the public static pages reachable on cleaner URLs if desired.
RewriteRule ^experience/?$ /experience.html [R=302,L]

# This SiteGround bundle is intentionally static only except for pre-rendered case studies.
RewriteRule ^login/?$ / [R=302,L]
RewriteRule ^analytics(?:/.*)?$ / [R=302,L]
RewriteRule ^vscimage(?:/.*)?$ / [R=302,L]
</IfModule>

ErrorDocument 404 /index.html
`;

  const readme = `# SiteGround Static FTP Upload

This package is tailored for SiteGround shared hosting as a static coming-soon site.

Important:
- This is not the full Express + Next.js application.
- SiteGround shared hosting does not run the Node.js app used by the full project.
- Upload the contents of \`ftp-upload/\` into the site's public web root, usually \`public_html/\`.

Included:
- \`index.html\`
- \`experience.html\`
- \`styles.css\`
- \`script.js\`
- \`case-studies/\`
- \`assets/\`
- \`.htaccess\`

What the SiteGround bundle does:
- keeps the coming-soon homepage live
- keeps the experience page live
- pre-renders case study pages into plain HTML
- redirects old app-only paths like \`/analytics\` and \`/login\` back to the homepage

Suggested upload steps:
1. Open SiteGround Site Tools or connect by SFTP.
2. Upload the contents of \`ftp-upload/\` into \`public_html/\`.
3. Confirm:
   - \`/\`
   - \`/experience.html\`
   - \`/experience\`
   - \`/case-studies/\`
4. If an older app version exists, remove old Node-specific files from \`public_html/\` after backing them up.
`;

  await writeFile(path.join(uploadRoot, "experience.html"), transformedExperienceHtml, "utf8");
  await writeFile(path.join(uploadRoot, ".htaccess"), htaccess, "utf8");
  await writeFile(path.join(bundleRoot, "README.md"), readme, "utf8");

  const caseStudyIndexHtml = await ejs.renderFile(caseStudyIndexTemplatePath, {
    pageTitle: "Case Studies | Van Shea Creative",
    metaDescription:
      "Structured, reusable case studies for Van Shea Creative client and concept work.",
    currentPath: "/case-studies",
    caseStudies
  });

  const caseStudiesRoot = path.join(uploadRoot, "case-studies");
  await mkdir(caseStudiesRoot, { recursive: true });
  await writeFile(
    path.join(caseStudiesRoot, "index.html"),
    stripStaticOnlyFeatures(caseStudyIndexHtml),
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
      stripStaticOnlyFeatures(caseStudyHtml),
      "utf8"
    );
  }
}

async function main() {
  await rm(bundleRoot, { recursive: true, force: true });
  await mkdir(uploadRoot, { recursive: true });

  for (const relativePath of filesToCopy) {
    await copyRelative(relativePath);
  }

  for (const relativePath of dirsToCopy) {
    await copyRelative(relativePath);
  }

  await writeSitegroundFiles();

  process.stdout.write(`SiteGround static bundle created at ${bundleRoot}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
