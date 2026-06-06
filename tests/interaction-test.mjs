import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";

const { app, context, document } = await createHarness({ voice: true });

document.querySelector("#voiceButton").listeners.click();
assert.ok(document.querySelector("#messageInput").value.includes("flat white"));
assert.equal(document.querySelector("#voiceButtonText").textContent, "Speak");

for (const scene of app.scenes) {
  app.setMode("practice");
  app.startScene(scene.id);
  assert.equal(app.state.socialHp, 100);
  assert.ok(document.querySelector("#missionText").textContent.length > 0);
  assert.ok(document.querySelector("#subtextText").textContent.length > 0);

  for (const tone of app.toneModes) {
    app.state.currentTone = tone.id;
    app.renderToneGrid();
    app.renderQuickReplies();
    assert.ok(document.querySelector("#toneGrid").innerHTML.includes(tone.label));
    assert.ok(document.querySelector("#quickReplies").innerHTML.includes("换一批"));
  }
}

app.setMode("practice");
app.startScene("coffee");
const rude = app.evaluateTurn("Give me a coffee.", app.state.currentScene.turns[0]);
const polite = app.evaluateTurn("Could I please get a flat white?", app.state.currentScene.turns[0]);
assert.ok(polite.relationship > rude.relationship, "actual wording, not selected tone label, should drive relationship score");
assert.ok(polite.goal >= 70);

await app.handleUserMessage("Could I please get a flat white?");
await app.handleUserMessage("A medium size, please.");
await app.handleUserMessage("Oat milk, please.");
await app.handleUserMessage("Just the coffee, thanks.");

assert.equal(app.state.turnIndex, app.state.currentScene.turns.length);
assert.ok(document.querySelector("#endingTitle").textContent.length > 0);
assert.ok(document.querySelector("#evidenceList").innerHTML.includes("第 1 轮"));
assert.ok(app.profile.history.length >= 1);

app.savePhrase(document.querySelector("#betterPhrase").textContent);
assert.equal(app.profile.phrases.length, 1);
app.renderPhrasebook();
assert.ok(document.querySelector("#phrasebookList").innerHTML.includes("flat white"));

await app.copyShareText();
assert.ok(context.__copiedText.includes("教练估算"));

console.log("Interaction test passed: voice transcript, all scenes and tones, wording-based evaluation, history, phrasebook, and sharing.");
