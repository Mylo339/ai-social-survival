import { join } from "node:path";
import { buildUsageReport, countBy, readNdjson } from "./report-utils.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dataDirectory = process.env.DATA_DIRECTORY || join(root, "data");

function printCounts(title, counts) {
  console.log(`\n${title}`);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    console.log("  No data yet");
    return;
  }
  entries.forEach(([key, value]) => console.log(`  ${key}: ${value}`));
}

const events = await readNdjson(dataDirectory, "events.ndjson");
const feedback = await readNdjson(dataDirectory, "feedback.ndjson");
const report = buildUsageReport(events, feedback);

console.log("AI Social Survival Friend Beta Report");
console.log(`Data directory: ${dataDirectory}`);
console.log(`Generated: ${report.generatedAt}`);
console.log(`Unique visitors: ${report.totals.uniqueVisitors}`);
console.log(`Sessions: ${report.totals.sessions}`);
console.log(`Scene starts: ${report.totals.sceneStarts}`);
console.log(`Scene completions: ${report.totals.sceneCompletions}`);
console.log(`Raw completion rate: ${report.totals.completionRate}%`);
console.log(`Average overall score: ${report.totals.averageOverall || "No completions yet"}`);
console.log(
  `Average duration: ${report.totals.averageDurationSeconds ? `${report.totals.averageDurationSeconds}s` : "No completions yet"}`,
);
console.log(`Feedback submissions: ${report.totals.feedbackSubmissions}`);

printCounts("Events", report.eventsByName);
printCounts("Sources", report.bySource);
printCounts("Campaigns", report.byCampaign);
printCounts("Usage by mode", report.byMode);
printCounts("Viewport buckets", report.byViewport);
printCounts("Feedback categories", report.feedbackCategories);
printCounts("Quick feedback ratings", report.feedbackRatings);
printCounts("Quick feedback tags", report.feedbackTags);

console.log("\nScene breakdown");
if (!report.sceneBreakdown.length) {
  console.log("  No scene data yet");
} else {
  report.sceneBreakdown.forEach((scene) => {
    const endings = Object.entries(scene.endings)
      .map(([key, value]) => `${key}:${value}`)
      .join(", ");
    console.log(
      `  ${scene.scene}: ${scene.starts} starts, ${scene.completions} completions, ${scene.completionRate}% completion, avg score ${scene.averageOverall || "n/a"}, avg ${scene.averageDurationSeconds || "n/a"}s${endings ? `, endings ${endings}` : ""}`,
    );
  });
}

if (feedback.length) {
  console.log("\nMost recent feedback");
  report.recentFeedback.forEach((item) => {
    const tags = item.tags?.length ? ` / tags: ${item.tags.join(",")}` : "";
    const rating = item.rating ? ` / rating: ${item.rating}` : "";
    console.log(`  [${item.createdAt}] ${item.category}${rating} / ${item.sceneId || "no scene"} / ${item.source}${tags}`);
    console.log(`  ${item.text}`);
  });
}

if (events.length) {
  printCounts("Starts by scene", countBy(events.filter((event) => event.name === "scene_started"), (event) => event.details?.scene));
  printCounts("Completions by scene", countBy(events.filter((event) => event.name === "scene_completed"), (event) => event.details?.scene));
}
