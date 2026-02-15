const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const fs = require("fs/promises");
const fsSync = require("fs");
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
  projects: {
    northline: {
      title: "Northline Coffee",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-northline-1900x1600.svg",
      fullscreen: "assets/fpo-large-northline-1900x1600.svg"
    },
    atlas: {
      title: "Atlas Wellness",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-atlas-1900x1600.svg",
      fullscreen: "assets/fpo-large-atlas-1900x1600.svg"
    },
    city_transit: {
      title: "City Transit Posters",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-city-transit-1900x1600.svg",
      fullscreen: "assets/fpo-large-city-transit-1900x1600.svg"
    },
    wren: {
      title: "Wren Studio",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-wren-1900x1600.svg",
      fullscreen: "assets/fpo-large-wren-1900x1600.svg"
    },
    hollow_creek: {
      title: "Hollow Creek Cider",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-hollow-creek-1900x1600.svg",
      fullscreen: "assets/fpo-large-hollow-creek-1900x1600.svg"
    },
    field_notes: {
      title: "Field Notes Covers",
      thumb: "assets/fpo-thumb-760x570.svg",
      large: "assets/fpo-large-field-notes-1900x1600.svg",
      fullscreen: "assets/fpo-large-field-notes-1900x1600.svg"
    }
  }
};

let upload = null;
if (multer) {
  upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 30 * 1024 * 1024
    }
  });
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

app.use(express.json({ limit: "1mb" }));
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
    await fs.writeFile(vscimageConfigPath, JSON.stringify(payload, null, 2), "utf8");
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
      ? requested.filter((key) =>
          ["logo", "thumb", "large", "fullscreen"].includes(key)
        )
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

      return res.status(200).json({
        ok: true,
        original: toWebPath(originalPath),
        outputs: generated
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

ensureVscimageStorage()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Portfolio server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to initialize VSCimage storage:", error);
    process.exit(1);
  });
