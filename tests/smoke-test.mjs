import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";

const { app, document } = await createHarness();

assert.equal(app.scenes.length, 8, "should expose eight web beta scenarios");
assert.ok(document.querySelector("#sceneGrid").innerHTML.includes("Can you keep it down?"));
assert.ok(document.querySelector("#homeEngineBadge").textContent.includes("本地备用评分"));

app.startScene("roommate");
assert.ok(document.querySelector("#toneGrid").innerHTML.includes("不耐烦版"));
assert.equal(app.state.currentScene.id, "roommate");
assert.equal(document.querySelector("#socialHpValue").textContent, 100);
assert.ok(document.querySelector("#missionText").textContent.includes("承认"));

const irrelevant = app.evaluateTurn("I like purple bicycles.", app.state.currentScene.turns[0]);
assert.equal(irrelevant.shouldRetry, true, "irrelevant answers should trigger a repair turn");
assert.ok(irrelevant.relevance < 42);

await app.handleUserMessage("I like purple bicycles.");
assert.equal(app.state.turnIndex, 0, "first irrelevant answer should not silently advance the story");
assert.ok(document.querySelector("#turnCoachSummary").textContent.includes("没有接住"));

await app.handleUserMessage("Sorry, I didn't realise. I'll keep it down.");
assert.equal(app.state.turnIndex, 1);

const hpBeforeRisk = app.state.socialHp;
await app.handleUserMessage("Yeah, you said that.");
assert.ok(app.state.socialHp < hpBeforeRisk, "risky language should lower relationship temperature");

await app.handleUserMessage("I understand, sorry.");
await app.handleUserMessage("I'll use headphones after ten.");
await app.handleUserMessage("No worries, good night.");

assert.ok(document.querySelector("#endingTitle").textContent.length > 0);
assert.ok(document.querySelector("#resultRubric").innerHTML.includes("沟通目标"));
assert.ok(document.querySelector("#resultSummary").textContent.includes("不是正式语言考试分数"));
assert.equal(app.profile.history.length, 1, "completed session should be saved locally");

app.setMode("challenge");
app.startScene("coffee");
assert.equal(document.querySelector("#toneLab").hidden, true);
assert.equal(document.querySelector("#quickReplies").innerHTML, "");

console.log("Smoke test passed: relevance repair, relationship impact, transparent rubric, local history, and challenge mode.");
