#!/usr/bin/env node
/**
 * Dev server: static files + Loud AI insight proxy (DashScope compatible-mode).
 * Usage: node budget-lab/dev-server.mjs
 * Env: LAI_API_KEY, LAI_API_BASE (optional), LAI_MODEL (optional), PORT (default 8080)
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m || process.env[m[1]]) return;
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    });
}

loadEnvFile();
const runtimeKey = process.env.LAI_API_KEY || "";
const runtimeBase =
  process.env.LAI_API_BASE ||
  "https://ws-pw5lpjgwim84s7jz.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1";
const runtimeModel = process.env.LAI_MODEL || "qwen-plus";

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function handleLaiInsight(body) {
  if (!runtimeKey) {
    return { copy: body.fallbackCopy, cta: body.fallbackCta, source: "fallback-no-key" };
  }

  const system = [
    "You are Loud AI for a UK OOH budget calculator.",
    "Write concise planner copy grounded ONLY in the supplied numbers.",
    "Never invent reach, average frequency, or guaranteed availability.",
    "Only reference estimated impacts ranges, cost per 1,000 impacts, format mix, budget, duration, and geography.",
    "If worthPreview is false, confirm the current goal is a good fit — do not push an alternative.",
    'Respond with strict JSON: {"copy":"one or two short sentences","cta":"Try …"}',
  ].join(" ");

  const user = JSON.stringify(body);

  const upstream = await fetch(`${runtimeBase.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtimeKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: runtimeModel,
      temperature: 0.35,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    console.warn("DashScope error:", upstream.status, errText.slice(0, 120));
    return {
      copy: body.fallbackCopy,
      cta: body.fallbackCta,
      source: "fallback-upstream",
    };
  }

  const data = await upstream.json();
  const raw = data?.choices?.[0]?.message?.content || "{}";
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { copy: body.fallbackCopy, cta: body.fallbackCta };
  }
  if (!parsed.copy) parsed.copy = body.fallbackCopy;
  if (!parsed.cta) parsed.cta = body.fallbackCta;
  parsed.source = "dashscope";
  return parsed;
}

function resolveStaticPath(urlPath) {
  if (urlPath === "/") return path.join(ROOT, "index.html");

  let filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) return null;

  if (urlPath.endsWith("/")) {
    return path.join(filePath, "index.html");
  }

  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      return path.join(filePath, "index.html");
    }
  } catch {
    /* fall through */
  }

  return filePath;
}

function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
  const filePath = resolveStaticPath(urlPath);

  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS" && req.url === "/api/lai-insight") {
    sendJson(res, 204, {});
    return;
  }

  if (req.method === "POST" && req.url === "/api/lai-insight") {
    try {
      const body = await readBody(req);
      const payload = await handleLaiInsight(body);
      sendJson(res, 200, payload);
    } catch (e) {
      sendJson(res, 502, {
        copy: null,
        error: String(e.message || e),
        source: "error",
      });
    }
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Loud OOH dev server http://127.0.0.1:${PORT}/budget-lab/`);
  console.log(`LAI proxy: POST /api/lai-insight (${runtimeKey ? "key loaded" : "no API key — fallback only"})`);
});
