import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, relative } from "node:path";
import { buildUsageReport, readNdjson } from "./scripts/report-utils.mjs";

const root = new URL(".", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const port = Number(process.env.PORT || 4177);
const host = process.env.HOST || "127.0.0.1";
const aiEndpoint = process.env.AI_ENDPOINT || "";
const aiApiKey = process.env.AI_API_KEY || "";
const aiModel = process.env.AI_MODEL || "";
const aiThinking = process.env.AI_THINKING || "";
const aiEnabled = Boolean(aiEndpoint && aiApiKey && aiModel);
const dataDirectory = process.env.DATA_DIRECTORY || join(root, "data");
const adminToken = process.env.ADMIN_TOKEN || "";
const rateLimits = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const securityHeaders = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  "Permissions-Policy": "microphone=(self), camera=(), geolocation=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function send(response, statusCode, body, contentType = "application/json; charset=utf-8", headers = {}) {
  response.writeHead(statusCode, {
    ...securityHeaders,
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    ...headers,
  });
  response.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readJson(request, maxBytes = 24_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Payload too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function cleanString(value, maxLength) {
  return typeof value === "string" ? value.replace(/\0/g, "").trim().slice(0, maxLength) : "";
}

function cleanNumber(value, min = 0, max = 100_000_000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function cleanBoolean(value) {
  return Boolean(value);
}

function cleanScores(scores) {
  const source = scores && typeof scores === "object" ? scores : {};
  return {
    goal: cleanNumber(source.goal, 0, 100),
    relevance: cleanNumber(source.relevance, 0, 100),
    relationship: cleanNumber(source.relationship, 0, 100),
    naturalness: cleanNumber(source.naturalness, 0, 100),
    overall: cleanNumber(source.overall, 0, 100),
    completedTurns: cleanNumber(source.completedTurns, 0, 20),
    retries: cleanNumber(source.retries, 0, 50),
  };
}

function cleanStringArray(value, maxItems = 8, maxLength = 40) {
  return Array.isArray(value) ? value.slice(0, maxItems).map((item) => cleanString(item, maxLength)).filter(Boolean) : [];
}

function cleanEventDetails(details) {
  const source = details && typeof details === "object" ? details : {};
  return {
    practiceId: cleanString(source.practiceId, 120),
    scene: cleanString(source.scene, 60),
    category: cleanString(source.category, 40),
    difficulty: cleanString(source.difficulty, 30),
    mode: cleanString(source.mode, 20),
    ending: cleanString(source.ending, 20),
    rating: cleanString(source.rating, 40),
    tags: cleanString(source.tags, 160),
    filter: cleanString(source.filter, 40),
    error: cleanString(source.error, 60),
    landingPath: cleanString(source.landingPath, 240),
    viewport: cleanString(source.viewport, 20),
    speechSupported: cleanBoolean(source.speechSupported),
    durationMs: cleanNumber(source.durationMs, 0, 1000 * 60 * 60),
    turns: cleanNumber(source.turns, 0, 20),
    socialHp: cleanNumber(source.socialHp, 0, 100),
    scores: cleanScores(source.scores),
  };
}

function containsUnsafeContent(text) {
  return /\b(kill myself|suicide method|make a bomb|child sexual|rape instructions|how to scam|steal a password)\b/i.test(text);
}

function getRateLimitKey(request) {
  return request.socket.remoteAddress || "unknown";
}

function allowRequest(request, limit = 45) {
  const key = getRateLimitKey(request);
  const now = Date.now();
  const record = rateLimits.get(key);
  if (!record || now - record.startedAt > 60_000) {
    rateLimits.set(key, { startedAt: now, count: 1 });
    return true;
  }
  record.count += 1;
  return record.count <= limit;
}

async function appendRecord(filename, record) {
  await mkdir(dataDirectory, { recursive: true });
  await appendFile(join(dataDirectory, filename), `${JSON.stringify(record)}\n`, "utf8");
}

async function handleStatus(response) {
  send(response, 200, {
    ok: true,
    aiEnabled,
    mode: aiEnabled ? "online-ai" : "local-coach",
    privacy: "User transcripts are only sent to the configured AI provider when aiEnabled is true.",
  });
}

async function handleFeedback(request, response) {
  if (!allowRequest(request, 20)) {
    send(response, 429, { error: "Too many requests" });
    return;
  }

  const payload = await readJson(request);
  const record = {
    createdAt: new Date().toISOString(),
    category: cleanString(payload.category, 40),
    text: cleanString(payload.text, 2000),
    contact: cleanString(payload.contact, 200),
    sceneId: cleanString(payload.sceneId, 60),
    mode: cleanString(payload.mode, 20),
    rating: cleanString(payload.rating, 40),
    tags: cleanStringArray(payload.tags),
    reportedResponse: cleanString(payload.reportedResponse, 1200),
    analytics:
      payload.analytics && typeof payload.analytics === "object"
        ? {
            visitorId: cleanString(payload.analytics.visitorId, 120),
            sessionId: cleanString(payload.analytics.sessionId, 120),
            source: cleanString(payload.analytics.source, 80),
            campaign: cleanString(payload.analytics.campaign, 80),
            viewport: cleanString(payload.analytics.viewport, 20),
          }
        : {},
  };

  if (!record.text) {
    send(response, 400, { error: "Feedback text is required" });
    return;
  }

  await appendRecord("feedback.ndjson", record);
  send(response, 201, { ok: true });
}

async function handleEvent(request, response) {
  if (!allowRequest(request, 140)) {
    send(response, 429, { error: "Too many requests" });
    return;
  }

  const payload = await readJson(request, 12_000);
  const allowedEvents = new Set([
    "app_opened",
    "analytics_consent_enabled",
    "mode_selected",
    "scene_filter_changed",
    "scene_started",
    "scene_completed",
    "share_copied",
    "voice_started",
    "voice_transcribed",
    "voice_error",
    "feedback_opened",
    "feedback_submitted",
    "quick_feedback_submitted",
  ]);
  const name = cleanString(payload.name, 40);
  if (!allowedEvents.has(name)) {
    send(response, 400, { error: "Unsupported event" });
    return;
  }

  const details = payload.details && typeof payload.details === "object" ? payload.details : {};
  await appendRecord("events.ndjson", {
    createdAt: new Date().toISOString(),
    name,
    visitorId: cleanString(payload.visitorId || details.visitorId, 120),
    sessionId: cleanString(payload.sessionId || details.sessionId, 120),
    source: cleanString(payload.source || details.source, 80),
    campaign: cleanString(payload.campaign || details.campaign, 80),
    details: cleanEventDetails(details),
  });
  send(response, 201, { ok: true });
}

async function handleAdminReport(request, response) {
  if (!adminToken) {
    send(response, 404, { error: "Admin report is not configured" });
    return;
  }

  const auth = request.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (token !== adminToken) {
    send(response, 401, { error: "Unauthorized" });
    return;
  }

  const events = await readNdjson(dataDirectory, "events.ndjson");
  const feedback = await readNdjson(dataDirectory, "feedback.ndjson");
  send(response, 200, buildUsageReport(events, feedback));
}

async function handleAiTurn(request, response) {
  if (!aiEnabled) {
    send(response, 503, { error: "Online AI is not configured" });
    return;
  }
  if (!allowRequest(request, 30)) {
    send(response, 429, { error: "Too many requests" });
    return;
  }

  const payload = await readJson(request);
  const sceneTitle = cleanString(payload.scene?.title, 120);
  const mission = cleanString(payload.scene?.mission, 400);
  const personaName = cleanString(payload.scene?.persona?.name, 80);
  const personaRole = cleanString(payload.scene?.persona?.role, 240);
  const prompt = cleanString(payload.turn?.prompt, 500);
  const goal = cleanString(payload.turn?.goal, 300);
  const userText = cleanString(payload.userText, 500);
  const nextPrompt = cleanString(payload.nextPrompt, 500);
  const retry = Boolean(payload.retry);

  if (!sceneTitle || !userText || !nextPrompt) {
    send(response, 400, { error: "Missing turn context" });
    return;
  }
  if (containsUnsafeContent(userText)) {
    send(response, 400, { error: "This request cannot be used for the roleplay exercise" });
    return;
  }

  const systemPrompt = [
    `You are ${personaName || "a roleplay character"} in the scenario "${sceneTitle}".`,
    personaRole ? `Character context: ${personaRole}.` : "",
    `Scenario mission: ${mission}.`,
    `The learner's current communication goal is: ${goal}.`,
    "Reply as the character in natural New Zealand English.",
    "Keep the reply under 45 words. Do not grade, lecture, or mention a rubric.",
    "Do not invent sensitive facts about the learner.",
    "Do not generate hateful, sexual, violent, self-harm, illegal, or deceptive instructions. Redirect to a safe, ordinary roleplay response.",
    retry
      ? `The learner did not clearly answer the current question. Gently clarify and end with this repair question: ${nextPrompt}`
      : `React briefly to the learner, then naturally continue with this next line or intent: ${nextPrompt}`,
  ]
    .filter(Boolean)
    .join("\n");

  const providerRequestBody = {
    model: aiModel,
    temperature: 0.65,
    max_tokens: 140,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Character asked: ${prompt}\nLearner replied: ${userText}` },
    ],
  };
  if (["enabled", "disabled"].includes(aiThinking)) {
    providerRequestBody.thinking = { type: aiThinking };
  }

  const providerResponse = await fetch(aiEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(providerRequestBody),
  });

  if (!providerResponse.ok) {
    send(response, 502, { error: "AI provider request failed" });
    return;
  }

  const providerPayload = await providerResponse.json();
  const reply = cleanString(providerPayload.choices?.[0]?.message?.content, 1200);
  if (!reply) {
    send(response, 502, { error: "AI provider returned no reply" });
    return;
  }

  send(response, 200, { reply });
}

async function serveStatic(url, response) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const relativePath = pathname.replace(/^\/+/, "");
  const safePath = normalize(join(root, relativePath));
  const relation = relative(root, safePath);

  if (relation.startsWith("..") || relation.includes(`..${process.platform === "win32" ? "\\" : "/"}`)) {
    send(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }

  try {
    const fileStat = await stat(safePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    const body = await readFile(safePath);
    const extension = extname(safePath);
    const cacheControl = extension === ".html" || extension === ".js" ? "no-cache" : "public, max-age=3600";
    send(response, 200, body, mimeTypes[extension] || "application/octet-stream", {
      "Cache-Control": cacheControl,
    });
  } catch (error) {
    send(response, 404, "Not found", "text/plain; charset=utf-8");
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://${request.headers.host || `${host}:${port}`}`);

    if (request.method === "GET" && url.pathname === "/api/status") {
      await handleStatus(response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/feedback") {
      await handleFeedback(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/event") {
      await handleEvent(request, response);
      return;
    }
    if (request.method === "GET" && url.pathname === "/api/admin/report") {
      await handleAdminReport(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/turn") {
      await handleAiTurn(request, response);
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      send(response, 405, { error: "Method not allowed" });
      return;
    }

    await serveStatic(url, response);
  } catch (error) {
    send(response, 500, { error: "Internal server error" });
  }
});

server.listen(port, host, () => {
  console.log(`AI Social Survival running at http://${host}:${port}`);
  console.log(`Coach mode: ${aiEnabled ? `online AI (${aiModel})` : "local transparent evaluator"}`);
});
