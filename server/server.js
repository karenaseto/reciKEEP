import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";

const PORT = process.env.PORT || 8787;
const FETCH_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 5_000_000;

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^\[?::1\]?$/,
];

function isBlockedHostname(hostname) {
  return BLOCKED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname));
}

function absolutizeUrl(maybeUrl, baseUrl) {
  if (!maybeUrl) return "";
  try {
    return new URL(maybeUrl, baseUrl).toString();
  } catch {
    return "";
  }
}

function extractImage(imageField, baseUrl) {
  if (!imageField) return "";
  if (typeof imageField === "string") return absolutizeUrl(imageField, baseUrl);
  if (Array.isArray(imageField)) return extractImage(imageField[0], baseUrl);
  if (typeof imageField === "object") {
    return absolutizeUrl(imageField.url || imageField["@id"] || "", baseUrl);
  }
  return "";
}

function findRecipeNode(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  const nodes = Array.isArray(candidate["@graph"]) ? candidate["@graph"] : [candidate];
  for (const node of nodes) {
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
    if (types.includes("Recipe")) return node;
  }
  return null;
}

function firstJsonLdRecipe($) {
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const script of scripts) {
    let data;
    try {
      data = JSON.parse($(script).contents().text());
    } catch {
      continue;
    }
    const candidates = Array.isArray(data) ? data : [data];
    for (const candidate of candidates) {
      const recipe = findRecipeNode(candidate);
      if (recipe) return recipe;
    }
  }
  return null;
}

const app = express();
app.use(cors());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.get("/api/parse-recipe", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== "string") {
    return res.status(400).json({ error: "Missing url parameter." });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("bad protocol");
  } catch {
    return res.status(400).json({ error: "That doesn't look like a valid link." });
  }

  if (isBlockedHostname(parsedUrl.hostname)) {
    return res.status(400).json({ error: "That link isn't allowed." });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsedUrl.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; reciKEEPBot/1.0; local recipe reader)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `The site responded with ${response.status}.` });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return res.status(415).json({ error: "That link didn't return a readable web page." });
    }

    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      return res.status(413).json({ error: "That page is too large to read." });
    }

    const html = await response.text();
    if (html.length > MAX_RESPONSE_BYTES) {
      return res.status(413).json({ error: "That page is too large to read." });
    }

    const $ = cheerio.load(html);
    const baseUrl = parsedUrl.toString();
    const recipeNode = firstJsonLdRecipe($);

    const ogTitle = $('meta[property="og:title"]').attr("content");
    const ogImage =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content");

    const title = (recipeNode && recipeNode.name) || ogTitle || $("title").first().text() || "";

    const image =
      extractImage(recipeNode && recipeNode.image, baseUrl) || absolutizeUrl(ogImage, baseUrl);

    if (!title && !image) {
      return res
        .status(404)
        .json({ error: "Couldn't find a recipe title or photo on that page." });
    }

    res.json({
      title: title.trim(),
      image,
      isRecipeSchema: Boolean(recipeNode),
      host: parsedUrl.hostname.replace(/^www\./, ""),
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "That site took too long to respond." });
    }
    res.status(502).json({ error: "Couldn't read that page." });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(PORT, () => {
  console.log(`reciKEEP link-reader listening on http://localhost:${PORT}`);
});
