import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";

const events = [];
const fetchMock = async (url, options = {}) => {
  if (url === "/api/status") {
    return {
      ok: true,
      status: 200,
      async json() {
        return { aiEnabled: false, mode: "local-coach" };
      },
    };
  }

  if (url === "/api/event") {
    events.push(JSON.parse(options.body));
    return { ok: true, status: 201 };
  }

  throw new Error(`Unexpected fetch call: ${url}`);
};

const { app, document } = await createHarness({
  location: {
    protocol: "https:",
    hostname: "example.test",
    pathname: "/",
    search: "?src=friend_wechat&campaign=round_one",
    innerWidth: 390,
  },
  fetch: fetchMock,
});

await Promise.resolve();
await Promise.resolve();
await new Promise((resolve) => setTimeout(resolve, 0));

assert.equal(app.state.apiAvailable, true);
assert.equal(events.length, 0, "analytics should wait for explicit consent");
assert.equal(document.querySelector("#testerSourceNote").hidden, false);
assert.ok(document.querySelector("#testerSourceNote").textContent.includes("friend_wechat"));

document.querySelector("#analyticsConsent").listeners.change({ target: { checked: true } });
await Promise.resolve();
await Promise.resolve();
await new Promise((resolve) => setTimeout(resolve, 0));

assert.ok(events.some((event) => event.name === "analytics_consent_enabled"));
assert.ok(events.some((event) => event.name === "app_opened"));
assert.ok(events.every((event) => event.source === "friend_wechat"));
assert.ok(events.every((event) => event.campaign === "round_one"));
assert.ok(events.every((event) => event.visitorId.startsWith("ssv_visitor_")));

app.startScene("coffee");
await Promise.resolve();
assert.ok(events.some((event) => event.name === "scene_started" && event.details.scene === "coffee"));

await app.handleUserMessage("Could I please get a flat white?");
await app.handleUserMessage("A medium size, please.");
await app.handleUserMessage("Oat milk, please.");
await app.handleUserMessage("Just the coffee today, thanks.");
await Promise.resolve();

const completion = events.find((event) => event.name === "scene_completed");
assert.equal(completion.details.scene, "coffee");
assert.equal(completion.details.mode, "practice");
assert.ok(completion.details.durationMs >= 0);
assert.ok(completion.details.scores.overall > 0);
assert.equal(completion.details.viewport, "phone");
assert.equal(JSON.stringify(events).includes("flat white"), false, "analytics events should not contain learner dialogue text");

console.log("Analytics test passed: opt-in source tracking, anonymous IDs, starts, completions, scores, and no dialogue text.");
