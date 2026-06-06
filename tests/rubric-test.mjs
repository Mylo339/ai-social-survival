import assert from "node:assert/strict";
import { createHarness } from "./harness.mjs";

const { app } = await createHarness();

for (const scene of app.scenes) {
  app.startScene(scene.id);

  for (const [turnIndex, turn] of scene.turns.entries()) {
    for (const tone of app.toneModes) {
      const example = turn.examples[tone.id][0];
      const evaluation = app.evaluateTurn(example, turn, scene);
      assert.ok(
        evaluation.relevance >= 42,
        `${scene.id} turn ${turnIndex + 1} ${tone.id} example should answer the current question: ${example}`,
      );
      if (tone.id !== "impatient") {
        assert.equal(
          evaluation.shouldRetry,
          false,
          `${scene.id} turn ${turnIndex + 1} ${tone.id} example should not trigger a repair turn`,
        );
      }
    }

    const irrelevant = app.evaluateTurn("My favourite planet is probably Saturn.", turn, scene);
    assert.equal(irrelevant.shouldRetry, true, `${scene.id} turn ${turnIndex + 1} should reject unrelated content`);
  }
}

console.log("Rubric test passed: suggested answers are relevant, constructive examples satisfy goals, and unrelated answers trigger repair.");
