import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";

const { app, document } = await createHarness();

for (const mode of ["practice", "challenge"]) {
  for (const scene of app.scenes) {
    app.setMode(mode);
    app.startScene(scene.id);

    for (const turn of scene.turns) {
      await app.handleUserMessage(turn.examples.polite[0]);
    }

    assert.equal(app.state.turnIndex, scene.turns.length, `${mode}/${scene.id} should finish all turns`);
    assert.ok(document.querySelector("#endingTitle").textContent, `${mode}/${scene.id} should render an ending`);
  }
}

assert.equal(app.profile.history.length, 16, "all practice and challenge journeys should be saved");
app.renderProgress();
assert.ok(document.querySelector("#historyList").innerHTML.includes("临时请求换班"));

app.savePhrase("Could you clarify the next step?");
app.savePhrase("Could you clarify the next step?");
assert.equal(app.profile.phrases.length, 1, "duplicate phrases should not be saved twice");
app.removePhrase(app.profile.phrases[0].id);
assert.equal(app.profile.phrases.length, 0, "saved phrases should be removable");

document.querySelector("#feedbackText").value = "A useful offline test note.";
await app.submitFeedback({ preventDefault() {} });
assert.equal(app.profile.feedbackOutbox.length, 1, "offline feedback should be saved locally");

app.clearHistory();
assert.equal(app.profile.history.length, 0, "local history should be clearable");

console.log("Journey test passed: all 16 full journeys, history, phrasebook, and offline feedback behave correctly.");
