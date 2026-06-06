import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

const reservePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

const dataDirectory = await mkdtemp(join(tmpdir(), "social-survival-server-test-"));
const port = await reservePort();
const origin = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["local-server.mjs"], {
  cwd: projectRoot,
  env: { ...process.env, PORT: String(port), DATA_DIRECTORY: dataDirectory, ADMIN_TOKEN: "test-token" },
  stdio: "ignore",
});

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${origin}/api/status`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, "server should become ready");

  const home = await fetch(origin);
  assert.equal(home.status, 200);
  assert.ok((await home.text()).includes("Web Beta"));
  assert.ok(home.headers.get("content-security-policy")?.includes("default-src 'self'"));
  assert.equal(home.headers.get("permissions-policy"), "microphone=(self), camera=(), geolocation=()");
  assert.ok(home.headers.get("strict-transport-security")?.includes("max-age=31536000"));
  assert.equal(home.headers.get("x-frame-options"), "DENY");

  for (const asset of ["styles.css", "app.js", "privacy.html", "terms.html", "manifest.webmanifest", "sw.js", "icon.svg"]) {
    assert.equal((await fetch(`${origin}/${asset}`)).status, 200, `${asset} should be served`);
  }

  const status = await (await fetch(`${origin}/api/status`)).json();
  assert.equal(status.mode, "local-coach");
  assert.equal(status.aiEnabled, false);
  assert.equal(status.ai.providerConfigured, false);
  assert.equal(status.ai.turnRateLimitPerMinute, 18);
  assert.equal(status.storage.dataDirectoryConfigured, true);

  const feedback = await fetch(`${origin}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      category: "experience",
      text: "Server test feedback",
      sceneId: "coffee",
      mode: "practice",
      rating: "useful",
      tags: ["scoring", "scenario"],
      analytics: { visitorId: "visitor-test", sessionId: "session-test", source: "server_test" },
    }),
  });
  assert.equal(feedback.status, 201);
  const feedbackFile = await readFile(join(dataDirectory, "feedback.ndjson"), "utf8");
  assert.ok(feedbackFile.includes("Server test feedback"));
  assert.ok(feedbackFile.includes("useful"));
  assert.ok(feedbackFile.includes("scoring"));

  const validEvent = await fetch(`${origin}/api/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "scene_completed",
      visitorId: "visitor-test",
      sessionId: "session-test",
      source: "server_test",
      details: {
        scene: "coffee",
        category: "daily",
        mode: "practice",
        ending: "good",
        durationMs: 120000,
        viewport: "desktop",
        scores: { goal: 90, relevance: 88, relationship: 84, naturalness: 82, overall: 86 },
      },
    }),
  });
  assert.equal(validEvent.status, 201);
  const events = await readFile(join(dataDirectory, "events.ndjson"), "utf8");
  assert.ok(events.includes("visitor-test"));
  assert.ok(!events.includes("Server test feedback"), "product events should not contain feedback or chat text");

  const invalidEvent = await fetch(`${origin}/api/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "unexpected_event" }),
  });
  assert.equal(invalidEvent.status, 400);

  const blockedReport = await fetch(`${origin}/api/admin/report`);
  assert.equal(blockedReport.status, 401);

  const report = await fetch(`${origin}/api/admin/report`, {
    headers: { Authorization: "Bearer test-token" },
  });
  assert.equal(report.status, 200);
  const reportPayload = await report.json();
  assert.equal(reportPayload.totals.uniqueVisitors, 1);
  assert.equal(reportPayload.totals.sceneCompletions, 1);
  assert.equal(reportPayload.bySource.server_test, 1);
  assert.equal(reportPayload.feedbackRatings.useful, 1);
  assert.equal(reportPayload.feedbackTags.scoring, 1);

  const offlineAi = await fetch(`${origin}/api/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(offlineAi.status, 503);

  assert.equal((await fetch(`${origin}/missing-page`)).status, 404);
  assert.equal((await fetch(`${origin}/api/status`, { method: "DELETE" })).status, 405);

  console.log("Server test passed: assets, security headers, status, feedback, analytics events, admin report, validation, and offline AI fallback work.");
} finally {
  child.kill();
  await new Promise((resolve) => child.once("exit", resolve));
  await rm(dataDirectory, { recursive: true, force: true });
}
