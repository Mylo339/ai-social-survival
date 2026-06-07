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
const dataDirectoryConfigured = Boolean(process.env.DATA_DIRECTORY);
const adminToken = process.env.ADMIN_TOKEN || "";
const feedbackRateLimit = readPositiveIntegerEnv("FEEDBACK_RATE_LIMIT_PER_MINUTE", 20, 1, 120);
const eventRateLimit = readPositiveIntegerEnv("EVENT_RATE_LIMIT_PER_MINUTE", 140, 1, 400);
const aiTurnRateLimit = readPositiveIntegerEnv("AI_TURN_RATE_LIMIT_PER_MINUTE", 18, 1, 80);
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

const publicFiles = new Set([
  "index.html",
  "styles.css",
  "app.js",
  "privacy.html",
  "terms.html",
  "manifest.webmanifest",
  "sw.js",
  "icon.svg",
]);

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

function cleanCoachString(value, fallback, maxLength) {
  if (typeof value !== "string" || !value.trim()) return fallback;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  const sliced = normalized.slice(0, Math.max(0, maxLength - 3)).replace(/[ ,.;:!?，。；：！？、]+$/u, "");
  return `${sliced}...`;
}

function cleanNumber(value, min = 0, max = 100_000_000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function cleanBoolean(value) {
  return Boolean(value);
}

function cleanAiBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return Boolean(value);
}

function readPositiveIntegerEnv(name, fallback, min, max) {
  const value = Number(process.env[name]);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
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

function countEnglishWords(text) {
  return cleanString(text, 1000).match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g)?.length || 0;
}

function cleanTone(value) {
  return ["polite", "casual", "confident", "impatient"].includes(value) ? value : "casual";
}

function needsMoreThanShortConfirmation(goalText) {
  return /寒暄|观点|经验|主动|介绍|来意|疑问|方案|下一步|请求|回应噪音|承认|约定|表达意向|自我介绍|说明相关/i.test(
    goalText,
  );
}

function allowsBareConfirmation(goalText) {
  return /确认|身份|是否|在不在|yes\/no|answer whether/i.test(goalText);
}

function isBareConfirmation(text) {
  return /^(yeah|yep|yes|yup|nah|no|nope|i am|i'm|i do|i don't|i did|i didn't|sure|kind of|sort of)[.!?]*$/i.test(
    cleanString(text, 80),
  );
}

function hasRiskySocialMove(text) {
  return /\b(whatever|obviously|give me|i don't care|you said that|not that loud|just work faster|it's on my cv)\b/i.test(
    text,
  );
}

function refusesAdjustment(text) {
  return /\b(whatever|not that loud|i don't care|no way|that's your problem|you said that)\b/i.test(text);
}

function commitsToAdjustment(text) {
  return /\b(sorry|lower|turn it down|quiet|quieter|headphones|stop|keep it down|few minutes|right now|i'll|i will)\b/i.test(
    text,
  );
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
    ai: {
      providerConfigured: Boolean(aiEndpoint && aiModel),
      model: aiModel || "",
      turnRateLimitPerMinute: aiTurnRateLimit,
    },
    storage: {
      dataDirectoryConfigured,
      persistence: dataDirectoryConfigured
        ? "depends-on-hosting-storage"
        : "not-guaranteed-on-hosted-deploys",
    },
    privacy: "User transcripts are only sent to the configured AI provider when aiEnabled is true.",
  });
}

async function handleFeedback(request, response) {
  if (!allowRequest(request, feedbackRateLimit)) {
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
  if (!allowRequest(request, eventRateLimit)) {
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

function buildAiRequestBody({ temperature, maxTokens, messages }) {
  const providerRequestBody = {
    model: aiModel,
    temperature,
    max_tokens: maxTokens,
    messages,
  };
  if (["enabled", "disabled"].includes(aiThinking)) {
    providerRequestBody.thinking = { type: aiThinking };
  }
  return providerRequestBody;
}

async function requestAiContent(providerRequestBody) {
  const providerResponse = await fetch(aiEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${aiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(providerRequestBody),
  });

  if (!providerResponse.ok) throw new Error("AI provider request failed");

  const providerPayload = await providerResponse.json();
  const content = cleanString(providerPayload.choices?.[0]?.message?.content, 4000);
  if (!content) throw new Error("AI provider returned no content");
  return content;
}

function parseJsonObject(text) {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) throw error;
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

function sanitizeAiEvaluation(raw, { userText, goalText, localEstimate = {} }) {
  const source = raw && typeof raw === "object" ? raw : {};
  let shouldRetry = cleanAiBoolean(source.shouldRetry);
  let relevance = cleanNumber(source.relevance, 0, 100);
  let goal = cleanNumber(source.goal, 0, 100);
  let relationship = cleanNumber(source.relationship, 0, 100);
  let naturalness = cleanNumber(source.naturalness, 0, 100);
  const wordCount = countEnglishWords(userText);
  const veryShort = wordCount <= 2;
  const risky = hasRiskySocialMove(userText);
  const bareConfirmation = veryShort && isBareConfirmation(userText);

  if (bareConfirmation && allowsBareConfirmation(goalText) && relevance >= 50 && !risky) {
    shouldRetry = false;
    relevance = Math.max(relevance, 72);
    goal = Math.min(74, Math.max(goal, 64));
    relationship = Math.max(relationship, 68);
    naturalness = Math.max(naturalness, 62);
  }

  if (!shouldRetry && relevance >= 70 && goal < 50) {
    goal = Math.min(95, Math.max(78, relevance - 4));
  }
  if (!shouldRetry && veryShort && needsMoreThanShortConfirmation(goalText)) {
    goal = Math.min(goal, 72);
    relationship = Math.min(relationship, 78);
    naturalness = Math.min(naturalness, 72);
  }
  if (risky) {
    relationship = Math.min(relationship, 42);
    naturalness = Math.min(naturalness, 65);
    if (refusesAdjustment(userText) && !commitsToAdjustment(userText)) {
      goal = Math.min(goal, 45);
      shouldRetry = true;
    } else {
      goal = Math.min(goal, 76);
    }
  }
  if (Number.isFinite(localEstimate.relationship) && localEstimate.relationship > 0 && localEstimate.relationship < 50) {
    relationship = Math.min(relationship, cleanNumber(localEstimate.relationship, 0, 100) + 12);
  }
  if (Number.isFinite(localEstimate.naturalness) && localEstimate.naturalness > 0 && veryShort && needsMoreThanShortConfirmation(goalText)) {
    naturalness = Math.min(naturalness, cleanNumber(localEstimate.naturalness, 0, 100) + 16);
  }
  if (shouldRetry) {
    goal = Math.min(goal, 55);
    relationship = Math.min(relationship, 76);
  }
  if (!shouldRetry && relationship < 55 && !/(whatever|obviously|give me|i don't care|not that loud|you said that)/i.test(userText)) {
    relationship = 72;
  }
  if (!shouldRetry && naturalness < 60 && /\b(yeah|yep|yes|i am|i'm|how are you|what do you think)\b/i.test(userText)) {
    naturalness = 78;
  }

  const overall = Math.round(goal * 0.34 + relevance * 0.26 + relationship * 0.24 + naturalness * 0.16);
  return {
    goal,
    relevance,
    relationship,
    naturalness,
    overall,
    shouldRetry,
    inferredTone: cleanTone(source.inferredTone),
    summary:
      veryShort && needsMoreThanShortConfirmation(goalText) && !shouldRetry
        ? "能接上，但这句太短，对方还需要继续带话题"
        : cleanCoachString(source.summary, shouldRetry ? "还没有接住当前问题" : "真实场景里可以继续", 80),
    reason:
      cleanCoachString(
        source.reason,
        "这次判断基于当前人物关系、对方刚问的问题、回答是否自然推进对话，而不是固定关键词。",
        360,
      ),
    strength: cleanCoachString(source.strength, "对话能继续推进", 80),
    improvement:
      veryShort && needsMoreThanShortConfirmation(goalText) && !shouldRetry
        ? "补半句自己的感受或反问，让对话不用靠对方硬接。"
        : cleanCoachString(source.improvement, "下一句可以更具体地接住对方刚刚问的点。", 160),
    suggestion: cleanString(source.suggestion, 240) || userText,
    hpDelta: cleanNumber(source.hpDelta, -18, 10),
    confidence: cleanCoachString(source.confidence, "中等", 20),
    source: "ai",
  };
}

async function handleAiEvaluation(request, response) {
  if (!aiEnabled) {
    send(response, 503, { error: "Online AI is not configured" });
    return;
  }
  if (!allowRequest(request, aiTurnRateLimit)) {
    send(response, 429, { error: "Too many requests" });
    return;
  }

  const payload = await readJson(request);
  const sceneTitle = cleanString(payload.scene?.title, 120);
  const mission = cleanString(payload.scene?.mission, 400);
  const personaName = cleanString(payload.scene?.persona?.name, 80);
  const personaRole = cleanString(payload.scene?.persona?.role, 240);
  const prompt = cleanString(payload.turn?.prompt, 500);
  const goalText = cleanString(payload.turn?.goal, 300);
  const repair = cleanString(payload.turn?.repair, 300);
  const userText = cleanString(payload.userText, 500);
  const selectedTone = cleanTone(payload.selectedTone);
  const localEstimate = cleanScores(payload.localEstimate);

  if (!sceneTitle || !prompt || !goalText || !userText) {
    send(response, 400, { error: "Missing evaluation context" });
    return;
  }
  if (containsUnsafeContent(userText)) {
    send(response, 400, { error: "This request cannot be used for the roleplay exercise" });
    return;
  }

  const systemPrompt = [
    "You are an expert conversation coach for Chinese international students practicing real-life New Zealand English.",
    "Evaluate whether the learner's line works in this exact roleplay moment, not whether it matches fixed keywords.",
    "Be generous to short, normal, friendly conversational English when it answers the question or naturally keeps small talk moving.",
    "Do not punish a casual line just because it lacks please, sorry, or formal wording. Politeness depends on context.",
    "Do not over-reward one-word yes/no answers in small talk, teamwork, conflict, interview, or reflective tasks. They may be relevant but often need a follow-up detail.",
    "For a simple identity-confirmation turn, a bare answer such as 'Yeah.' can be allowed to continue, but it should get modest scores and coaching to add a follow-up.",
    "If a task asks the learner to adjust behavior, apologise, agree a next step, or take responsibility, refusing or minimising the issue means goal should be low even when relevance is high.",
    "Only lower relationship meaningfully for lines that are dismissive, rude, evasive, demanding, blaming, or socially cold in this situation.",
    "Set shouldRetry=true only if the learner is unrelated, mostly non-English, unsafe, refuses the task, or misses a concrete required answer.",
    "All four score fields must be 0-100 numbers. If shouldRetry=false, goal is usually 70 or higher because the learner has done enough to continue.",
    "Use concise Simplified Chinese for summary, reason, strength, improvement, and confidence. Use natural English for suggestion.",
    "Return only a JSON object with: goal, relevance, relationship, naturalness, overall, shouldRetry, inferredTone, summary, reason, strength, improvement, suggestion, hpDelta, confidence.",
  ].join("\n");

  const userPrompt = [
    `Scenario: ${sceneTitle}`,
    `Mission: ${mission}`,
    `Character: ${personaName || "roleplay character"}${personaRole ? `, ${personaRole}` : ""}`,
    `Selected tone style: ${selectedTone}`,
    `Current character line: ${prompt}`,
    `Learner's task this turn: ${goalText}`,
    repair ? `Repair question if truly needed: ${repair}` : "",
    `Learner replied: ${userText}`,
    `Local backup estimate for calibration only: goal ${localEstimate.goal}, relevance ${localEstimate.relevance}, relationship ${localEstimate.relationship}, naturalness ${localEstimate.naturalness}.`,
    "",
    "Calibration example: In a class small-talk scene, 'Yeah, I am. How are you finding it?' is friendly and natural. It should not be marked socially cold.",
    "Calibration example: In a simple identity-confirmation turn, 'Yeah.' is relevant but thin. It should usually continue with lower/moderate scores, not be treated as rude or unrelated.",
    "Score bands: 90-100 excellent for this moment; 75-89 works naturally; 60-74 understandable but could be warmer/clearer; below 60 only when it creates real friction or misses the moment.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const content = await requestAiContent(
      buildAiRequestBody({
        temperature: 0.15,
        maxTokens: 520,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    );
    send(response, 200, sanitizeAiEvaluation(parseJsonObject(content), { userText, goalText, localEstimate }));
  } catch (error) {
    send(response, 502, { error: "AI evaluation failed" });
  }
}

async function handleAiCoachedTurn(request, response) {
  if (!aiEnabled) {
    send(response, 503, { error: "Online AI is not configured" });
    return;
  }
  if (!allowRequest(request, aiTurnRateLimit)) {
    send(response, 429, { error: "Too many requests" });
    return;
  }

  const payload = await readJson(request);
  const sceneTitle = cleanString(payload.scene?.title, 120);
  const mission = cleanString(payload.scene?.mission, 400);
  const personaName = cleanString(payload.scene?.persona?.name, 80);
  const personaRole = cleanString(payload.scene?.persona?.role, 240);
  const prompt = cleanString(payload.turn?.prompt, 500);
  const goalText = cleanString(payload.turn?.goal, 300);
  const repair = cleanString(payload.turn?.repair, 300);
  const userText = cleanString(payload.userText, 500);
  const selectedTone = cleanTone(payload.selectedTone);
  const successNextPrompt = cleanString(payload.successNextPrompt, 500);
  const localEstimate = cleanScores(payload.localEstimate);

  if (!sceneTitle || !prompt || !goalText || !userText || !successNextPrompt) {
    send(response, 400, { error: "Missing coached turn context" });
    return;
  }
  if (containsUnsafeContent(userText)) {
    send(response, 400, { error: "This request cannot be used for the roleplay exercise" });
    return;
  }

  const systemPrompt = [
    "You are both a realistic New Zealand English roleplay character and a conversation coach for Chinese international students.",
    "First evaluate the learner's line in this exact moment. Then write the character's next reply.",
    "Evaluate natural conversation progress, not fixed keywords. Be fair to normal casual English.",
    "Do not over-reward one-word yes/no answers in small talk, teamwork, conflict, interview, or reflective tasks.",
    "For a simple identity-confirmation turn, a bare answer such as 'Yeah.' can continue with modest scores; do not mark it as rude or unrelated.",
    "If the learner refuses, minimises, blames, or dodges a request that requires adjustment or responsibility, goal should be low.",
    "The character reply must be natural New Zealand English, under 45 words, and must not mention scores, grading, rubrics, or coaching.",
    "If shouldRetry is true, the character should gently clarify and end with the repair question. Otherwise, react briefly and continue toward the next prompt.",
    "Use concise Simplified Chinese for evaluation summary, reason, strength, improvement, and confidence. Use natural English for suggestion.",
    "Return only a JSON object with keys: evaluation and reply. evaluation must contain goal, relevance, relationship, naturalness, overall, shouldRetry, inferredTone, summary, reason, strength, improvement, suggestion, hpDelta, confidence.",
  ].join("\n");

  const userPrompt = [
    `Scenario: ${sceneTitle}`,
    `Mission: ${mission}`,
    `Character: ${personaName || "roleplay character"}${personaRole ? `, ${personaRole}` : ""}`,
    `Selected learner tone style: ${selectedTone}`,
    `Character just asked: ${prompt}`,
    `Learner's task this turn: ${goalText}`,
    `Repair question if the learner truly missed the moment: ${repair}`,
    `Next line/intent if the learner did enough to continue: ${successNextPrompt}`,
    `Learner replied: ${userText}`,
    `Local backup estimate for calibration only: goal ${localEstimate.goal}, relevance ${localEstimate.relevance}, relationship ${localEstimate.relationship}, naturalness ${localEstimate.naturalness}.`,
    "",
    "Calibration: 'Yeah, I am. How are you finding it?' in a class small-talk scene is friendly and natural. 'Yeah.' is relevant but thin and can continue with modest scores. 'Whatever, it is not that loud' in a noise complaint is socially risky and does not complete the adjustment goal.",
  ].join("\n");

  try {
    const content = await requestAiContent(
      buildAiRequestBody({
        temperature: 0.22,
        maxTokens: 720,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    );
    const parsed = parseJsonObject(content);
    const evaluation = sanitizeAiEvaluation(parsed.evaluation || parsed, { userText, goalText, localEstimate });
    const reply = cleanString(parsed.reply, 1200) || (evaluation.shouldRetry ? repair : successNextPrompt);
    send(response, 200, { evaluation, reply });
  } catch (error) {
    send(response, 502, { error: "AI coached turn failed" });
  }
}

async function handleAiTurn(request, response) {
  if (!aiEnabled) {
    send(response, 503, { error: "Online AI is not configured" });
    return;
  }
  if (!allowRequest(request, aiTurnRateLimit)) {
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

  try {
    const reply = await requestAiContent(
      buildAiRequestBody({
        temperature: 0.65,
        maxTokens: 140,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Character asked: ${prompt}\nLearner replied: ${userText}` },
        ],
      }),
    );
    send(response, 200, { reply: cleanString(reply, 1200) });
  } catch (error) {
    send(response, 502, { error: "AI provider request failed" });
  }
}

async function serveStatic(url, response) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const relativePath = pathname.replace(/^\/+/, "");
  if (!publicFiles.has(relativePath)) {
    send(response, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }

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
    if (request.method === "POST" && url.pathname === "/api/evaluate") {
      await handleAiEvaluation(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/coached-turn") {
      await handleAiCoachedTurn(request, response);
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
