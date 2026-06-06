import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile("E:/CodexProjects/ai-social-survival/index.html", "utf8");
const css = await readFile("E:/CodexProjects/ai-social-survival/styles.css", "utf8");
const app = await readFile("E:/CodexProjects/ai-social-survival/app.js", "utf8");

assert.ok(html.includes("Web Beta"), "formal web beta identity should be visible");
assert.ok(html.includes('id="sceneFilter"'), "scene library should expose a category filter");
assert.ok(html.includes("场景预览"), "hero should explain the preview without alarm language");
assert.ok(html.includes("场景复盘"), "results should use calm, clear language");

assert.ok(css.includes("--ink: #183153"), "visual system should expose the calm navy primary color");
assert.ok(css.includes("--accent: #e86b50"), "visual system should expose one warm accent color");
assert.ok(css.includes("--shadow: 0 14px 34px rgba(24, 49, 83, 0.08)"), "cards should use a restrained soft shadow");
assert.ok(!css.includes("--acid:"), "the high-stimulation acid palette should be removed");
assert.ok(!css.includes("animation: ticker"), "the interface should not use a continuously moving ticker");
assert.ok(!css.includes(".topnav button:nth-child"), "mobile navigation should keep every feature reachable");
assert.ok(css.includes('[data-temperature="critical"]'), "relationship temperature should visibly affect the interface");
assert.ok(css.includes('[data-ending="bad"]'), "ending state should visibly affect the report");
assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "motion should respect user accessibility settings");

assert.ok(app.includes('document.querySelector("#chatView").dataset.temperature'), "relationship state should drive UI styling");
assert.ok(app.includes('document.querySelector("#resultView").dataset.ending'), "ending state should drive report styling");

console.log("UI test passed: calm web-beta identity, state-driven visuals, filtering, and accessibility hooks are present.");
