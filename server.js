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

function buildGeneratedGalleryMarkup(galleryEntries) {
  const entries = Array.isArray(galleryEntries) ? galleryEntries : [];

  return entries
    .map((entry, index) => {
      const thumb = sanitizeAssetPath(entry?.thumb);
      if (!thumb) return "";

      const large = sanitizeAssetPath(entry?.large) || thumb;
      const fullscreen = sanitizeAssetPath(entry?.fullscreen) || large;
      const displayTitle = String(entry?.title || entry?.id || `Generated ${index + 1}`)
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 120);
      const displayDescription =
        String(entry?.description || "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 320) || "Generated in VSCimage.";
      const idToken = sanitizeName(entry?.id || displayTitle || `generated-${index + 1}`);
      const escapedTitle = escapeHtml(displayTitle);
      const escapedThumb = escapeHtml(thumb);
      const escapedLarge = escapeHtml(large);
      const escapedFullscreen = escapeHtml(fullscreen);
      const escapedDescription = escapeHtml(displayDescription);

      return [
        '          <article class="card reveal generated-card" data-category="all" data-generated="true">',
        `            <a class="work-link" data-project-id="generated_${idToken}" href="${escapedLarge}" data-lightbox-src="${escapedLarge}" data-fullscreen-src="${escapedFullscreen}" data-lightbox-title="${escapedTitle}" data-lightbox-description="${escapedDescription}">`,
        `              <img class="card-image" src="${escapedThumb}" alt="Preview image for ${escapedTitle}" loading="lazy" />`,
        `              <h3>${escapedTitle}</h3>`,
        `              <p>${escapedDescription}</p>`,
        "            </a>",
        '            <button class="card-fullscreen" type="button" aria-label="View generated image in fullscreen">',
        '              <span aria-hidden="true">⤢</span>',
        "            </button>",
        "          </article>"
      ].join("\n");
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
    pathRewrite: (pathValue) => `/analytics${pathValue}`,
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
    await fs.writeFile(vscimageConfigPath, JSON.stringify(payload, null, 2), "utf8");
    await syncHomepageGeneratedGallery(payload.gallery);
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

if (upload) {
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

    const mime = String(req.file.mimetype || "");
    if (!mime.startsWith("image/")) {
      return res.status(400).json({ error: "Only image files are supported." });
    }

    const baseName = sanitizeName(req.body.name) || `image-${Date.now()}`;
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

      const inputExt = path.extname(req.file.originalname || "").toLowerCase() || ".bin";
      const originalPath = path.join(
        vscimageOriginalsDir,
        `${baseName}-${Date.now()}${inputExt}`
      );
      await fs.writeFile(originalPath, req.file.buffer);

      const generated = {};
      const pipeline = sharp(req.file.buffer).rotate();

      if (outputs.includes("logo")) {
        const logoPath = path.join(vscimageGeneratedDir, `${baseName}-logo-240.png`);
        await pipeline
          .clone()
          .resize(240, 240, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toFile(logoPath);
        generated.logo = toWebPath(logoPath);
      }

      if (outputs.includes("thumb")) {
        const thumbPath = path.join(vscimageGeneratedDir, `${baseName}-thumb-760x570.webp`);
        await pipeline
          .clone()
          .resize(760, 570, {
            fit: "cover",
            position: "attention"
          })
          .webp({ quality: 88 })
          .toFile(thumbPath);
        generated.thumb = toWebPath(thumbPath);
      }

      if (outputs.includes("large")) {
        const largePath = path.join(vscimageGeneratedDir, `${baseName}-large-1900x1600.webp`);
        await pipeline
          .clone()
          .resize(1900, 1600, {
            fit: "cover",
            position: "attention"
          })
          .webp({ quality: 90 })
          .toFile(largePath);
        generated.large = toWebPath(largePath);
      }

      if (outputs.includes("fullscreen")) {
        const fullscreenPath = path.join(
          vscimageGeneratedDir,
          `${baseName}-fullscreen-3200x1800.webp`
        );
        await pipeline
          .clone()
          .resize(3200, 1800, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 1 }
          })
          .webp({ quality: 92 })
          .toFile(fullscreenPath);
        generated.fullscreen = toWebPath(fullscreenPath);
      }

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
          description:
            String(req.body.description || "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 320) || "Generated in VSCimage.",
          thumb: galleryThumb,
          large: generated.large || generated.fullscreen || galleryThumb,
          fullscreen: generated.fullscreen || generated.large || galleryThumb,
          createdAt: new Date().toISOString()
        };

        const deduped = gallery.filter((item) => item?.thumb !== galleryThumb);
        config.gallery = [galleryEntry, ...deduped].slice(0, 300);

        await fs.writeFile(vscimageConfigPath, JSON.stringify(config, null, 2), "utf8");
        await syncHomepageGeneratedGallery(config.gallery);
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
