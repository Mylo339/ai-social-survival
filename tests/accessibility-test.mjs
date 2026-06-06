import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile("E:/CodexProjects/ai-social-survival/index.html", "utf8");
const css = await readFile("E:/CodexProjects/ai-social-survival/styles.css", "utf8");
const manifest = JSON.parse(await readFile("E:/CodexProjects/ai-social-survival/manifest.webmanifest", "utf8"));

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, "HTML IDs should be unique");
assert.ok(html.includes('lang="zh-CN"'));
assert.ok(html.includes('name="viewport"'));
assert.ok(html.includes('class="skip-link"'));
assert.ok(html.includes('aria-live="polite"'));
assert.ok(html.includes('aria-label="主要导航"'));

for (const button of html.matchAll(/<button\b[^>]*>/g)) {
  assert.ok(button[0].includes('type="'), `button should declare its type: ${button[0]}`);
}

assert.ok(css.includes(":focus-visible"), "keyboard focus should be visible");
assert.ok(css.includes("@media (prefers-reduced-motion: reduce)"), "reduced motion preference should be supported");
assert.ok(css.includes("@media (max-width: 980px)"));
assert.ok(css.includes("@media (max-width: 720px)"));
assert.ok(css.includes("@media (max-width: 430px)"));

assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "./index.html");
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);

console.log("Accessibility test passed: semantic controls, unique IDs, focus, reduced motion, responsive breakpoints, and PWA manifest are present.");
