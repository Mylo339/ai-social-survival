import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

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
  cwd: "E:/CodexProjects/ai-social-survival",
  env: { ...process.env, PORT: String(port), DATA_DIRECTORY: dataDirectory },
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

  const feedback = await fetch(`${origin}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category: "experience", text: "Server test feedback", sceneId: "coffee", mode: "practice" }),
  });
  assert.equal(feedback.status, 201);
  assert.ok((await readFile(join(dataDirectory, "feedback.ndjson"), "utf8")).includes("Server test feedback"));

  const invalidEvent = await fetch(`${origin}/api/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "unexpected_event" }),
  });
  assert.equal(invalidEvent.status, 400);

  const offlineAi = await fetch(`${origin}/api/turn`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(offlineAi.status, 503);

  assert.equal((await fetch(`${origin}/missing-page`)).status, 404);
  assert.equal((await fetch(`${origin}/api/status`, { method: "DELETE" })).status, 405);

  console.log("Server test passed: assets, security headers, status, feedback, validation, and offline AI fallback work.");
} finally {
  child.kill();
  await new Promise((resolve) => child.once("exit", resolve));
  await rm(dataDirectory, { recursive: true, force: true });
}
