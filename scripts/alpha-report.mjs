import { readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dataDirectory = process.env.DATA_DIRECTORY || join(root, "data");

async function readNdjson(filename) {
  try {
    const text = await readFile(join(dataDirectory, filename), "utf8");
    return text
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    return [];
  }
}

function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function printCounts(title, counts) {
  console.log(`\n${title}`);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    console.log("  No data yet");
    return;
  }
  entries.forEach(([key, value]) => console.log(`  ${key}: ${value}`));
}

const events = await readNdjson("events.ndjson");
const feedback = await readNdjson("feedback.ndjson");
const starts = events.filter((event) => event.name === "scene_started");
const completions = events.filter((event) => event.name === "scene_completed");
const completionRate = starts.length ? Math.round((completions.length / starts.length) * 100) : 0;

console.log("AI Social Survival Public Alpha Report");
console.log(`Data directory: ${dataDirectory}`);
console.log(`Scene starts: ${starts.length}`);
console.log(`Scene completions: ${completions.length}`);
console.log(`Raw completion rate: ${completionRate}%`);
console.log(`Feedback submissions: ${feedback.length}`);

printCounts("Starts by scene", countBy(starts, (event) => event.details?.scene));
printCounts("Completions by scene", countBy(completions, (event) => event.details?.scene));
printCounts("Usage by mode", countBy(events, (event) => event.details?.mode));
printCounts("Endings", countBy(completions, (event) => event.details?.ending));
printCounts("Feedback categories", countBy(feedback, (item) => item.category));

if (feedback.length) {
  console.log("\nMost recent feedback");
  feedback
    .slice(-5)
    .reverse()
    .forEach((item) => {
      console.log(`  [${item.createdAt}] ${item.category} / ${item.sceneId || "no scene"}`);
      console.log(`  ${item.text.replace(/\s+/g, " ").slice(0, 240)}`);
    });
}
