import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHarness } from "./harness.mjs";

const { app, document } = await createHarness();
const ids = new Set(app.scenes.map((scene) => scene.id));
const indexes = new Set(app.scenes.map((scene) => scene.index));

assert.equal(app.scenes.length, 8);
assert.equal(ids.size, 8, "scene IDs should be unique");
assert.equal(indexes.size, 8, "scene indexes should be unique");

for (const category of Object.keys(app.categoryLabels)) {
  assert.equal(
    app.scenes.filter((scene) => scene.category === category).length,
    2,
    `${category} should contain two balanced scenarios`,
  );
}

for (const scene of app.scenes) {
  assert.equal(scene.turns.length, 4, `${scene.id} should contain four turns`);
  assert.ok(scene.mission && scene.risk && scene.subtext && scene.betterPhrase && scene.nextChallenge);
  for (const turn of scene.turns) {
    assert.ok(turn.prompt && turn.goal && turn.repair);
    for (const tone of app.toneModes) assert.ok(turn.examples[tone.id].length >= 2);
  }
}

app.state.sceneFilter = "work";
app.renderScenes();
assert.ok(document.querySelector("#sceneGrid").innerHTML.includes("被问 Availability"));
assert.ok(document.querySelector("#sceneGrid").innerHTML.includes("临时请求换班"));
assert.ok(!document.querySelector("#sceneGrid").innerHTML.includes("第一次点 Flat White"));

for (const asset of ["index.html", "styles.css", "app.js", "privacy.html", "terms.html", "manifest.webmanifest", "sw.js", "icon.svg"]) {
  const content = await readFile(`E:/CodexProjects/ai-social-survival/${asset}`, "utf8");
  assert.ok(content.length > 20, `${asset} should be present and non-empty`);
}

console.log("Production test passed: balanced scene library, category filter, and release assets are complete.");
