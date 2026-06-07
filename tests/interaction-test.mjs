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

app.startScene("smalltalk");
const naturalSmallTalk = app.evaluateTurn("Yeah, I am. How are you finding it?", app.state.currentScene.turns[0]);
assert.equal(naturalSmallTalk.shouldRetry, false);
assert.ok(naturalSmallTalk.relationship >= 78, "friendly small talk should not be treated as socially cold");
assert.ok(naturalSmallTalk.naturalness >= 78, "normal casual English should be scored as natural in context");

app.startScene("coffee");
await app.handleUserMessage("Could I please get a flat white?");
await app.handleUserMessage("A medium size, please.");
await app.handleUserMessage("Oat milk, please.");
await app.handleUserMessage("Just the coffee, thanks.");

assert.equal(app.state.turnIndex, app.state.currentScene.turns.length);
assert.ok(document.querySelector("#endingTitle").textContent.length > 0);
assert.ok(document.querySelector("#evidenceList").innerHTML.includes("第 1 轮"));
assert.ok(app.profile.history.length >= 1);
assert.ok(document.querySelector("#quickFeedbackCard").selector, "quick feedback card should be available on result page");

app.toggleQuickFeedbackTag("scoring");
document.querySelector("#quickFeedbackText").value = "The score felt useful.";
await app.submitQuickFeedback("useful");
assert.equal(app.profile.feedbackOutbox.length, 1, "quick feedback should be saved locally while offline");
assert.equal(app.profile.feedbackOutbox[0].rating, "useful");
assert.equal(JSON.stringify(app.profile.feedbackOutbox[0].tags), JSON.stringify(["scoring"]));
assert.ok(app.profile.feedbackOutbox[0].text.includes("Quick feedback"));

app.savePhrase(document.querySelector("#betterPhrase").textContent);
assert.equal(app.profile.phrases.length, 1);
app.renderPhrasebook();
assert.ok(document.querySelector("#phrasebookList").innerHTML.includes("flat white"));

await app.copyShareText();
assert.ok(context.__copiedText.includes("教练估算"));

const onlineRequests = [];
const { app: onlineApp } = await createHarness({
  fetch: async (url) => {
    onlineRequests.push(String(url));
    if (String(url).includes("/api/status")) {
      return { ok: true, async json() { return { aiEnabled: true, mode: "online-ai" }; } };
    }
    if (String(url).includes("/api/coached-turn")) {
      return {
        ok: true,
        async json() {
          return {
            evaluation: {
              goal: 92,
              relevance: 94,
              relationship: 90,
              naturalness: 91,
              overall: 92,
              shouldRetry: false,
              inferredTone: "casual",
              summary: "真实场景里自然推进",
              reason: "回应了对方，也自然抛回问题。",
              strength: "自然接话",
              improvement: "继续保持。",
              suggestion: "Yeah, I am. How are you finding it?",
              hpDelta: 5,
              confidence: "高",
            },
            reply: "Yeah, it is a bit confusing, but we can work it out.",
          };
        },
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  },
});
onlineApp.state.apiAvailable = true;
onlineApp.state.engine = "ai";
onlineApp.startScene("smalltalk");
await onlineApp.handleUserMessage("Yeah, I am. How are you finding it?");
assert.ok(onlineRequests.some((url) => url.includes("/api/coached-turn")));
assert.equal(onlineRequests.some((url) => url.includes("/api/evaluate")), false);
assert.equal(onlineRequests.some((url) => url.includes("/api/turn")), false);

const shortConfirmationRequests = [];
const { app: shortConfirmationApp } = await createHarness({
  fetch: async (url) => {
    shortConfirmationRequests.push(String(url));
    if (String(url).includes("/api/coached-turn")) {
      return {
        ok: true,
        async json() {
          return {
            evaluation: {
              goal: 40,
              relevance: 60,
              relationship: 45,
              naturalness: 50,
              overall: 48,
              shouldRetry: true,
              inferredTone: "casual",
              summary: "???,????",
              reason: "???,????????",
              strength: "Relevant",
              improvement: "Add a follow-up.",
              suggestion: "Yeah, I am. How are you finding it?",
              hpDelta: -4,
              confidence: "medium",
            },
            reply: "Nice. I'm still trying to figure out what the brief actually wants.",
          };
        },
      };
    }
    throw new Error(`Unexpected request: ${url}`);
  },
});
shortConfirmationApp.state.apiAvailable = true;
shortConfirmationApp.state.engine = "ai";
shortConfirmationApp.startScene("smalltalk");
await shortConfirmationApp.handleUserMessage("Yeah.");
assert.equal(shortConfirmationApp.state.turnIndex, 1, "bare identity confirmation should continue with modest coaching");
assert.equal(shortConfirmationApp.state.answers[0].evaluation.shouldRetry, false);
assert.ok(shortConfirmationApp.state.answers[0].evaluation.goal >= 64);
assert.equal(shortConfirmationApp.state.answers[0].evaluation.summary.includes("?"), false);
assert.equal(shortConfirmationApp.state.answers[0].evaluation.reason.includes("?"), false);

console.log("Interaction test passed: voice transcript, all scenes and tones, wording-based evaluation, one-call online AI, history, phrasebook, and sharing.");
