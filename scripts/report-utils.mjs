import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function readNdjson(dataDirectory, filename) {
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

export function countBy(items, getter) {
  return items.reduce((counts, item) => {
    const key = getter(item) || "unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function average(items, getter) {
  const values = items.map(getter).filter((value) => Number.isFinite(value));
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percent(part, total) {
  return total ? Math.round((part / total) * 100) : 0;
}

function dateKey(createdAt) {
  return typeof createdAt === "string" ? createdAt.slice(0, 10) : "unknown";
}

export function buildUsageReport(events, feedback) {
  const starts = events.filter((event) => event.name === "scene_started");
  const completions = events.filter((event) => event.name === "scene_completed");
  const visitors = new Set(events.map((event) => event.visitorId).filter(Boolean));
  const sessions = new Set(events.map((event) => event.sessionId).filter(Boolean));
  const scenes = [...new Set(events.map((event) => event.details?.scene).filter(Boolean))].sort();

  const sceneBreakdown = scenes.map((scene) => {
    const sceneStarts = starts.filter((event) => event.details?.scene === scene);
    const sceneCompletions = completions.filter((event) => event.details?.scene === scene);
    return {
      scene,
      starts: sceneStarts.length,
      completions: sceneCompletions.length,
      completionRate: percent(sceneCompletions.length, sceneStarts.length),
      averageOverall: average(sceneCompletions, (event) => event.details?.scores?.overall),
      averageDurationSeconds: average(sceneCompletions, (event) => event.details?.durationMs / 1000),
      endings: countBy(sceneCompletions, (event) => event.details?.ending),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      events: events.length,
      uniqueVisitors: visitors.size,
      sessions: sessions.size,
      sceneStarts: starts.length,
      sceneCompletions: completions.length,
      completionRate: percent(completions.length, starts.length),
      feedbackSubmissions: feedback.length,
      averageOverall: average(completions, (event) => event.details?.scores?.overall),
      averageDurationSeconds: average(completions, (event) => event.details?.durationMs / 1000),
    },
    bySource: countBy(events, (event) => event.source),
    byCampaign: countBy(events, (event) => event.campaign),
    byMode: countBy(events, (event) => event.details?.mode),
    byViewport: countBy(events, (event) => event.details?.viewport),
    byDay: countBy(events, (event) => dateKey(event.createdAt)),
    eventsByName: countBy(events, (event) => event.name),
    sceneBreakdown,
    feedbackCategories: countBy(feedback, (item) => item.category),
    recentFeedback: feedback
      .slice(-8)
      .reverse()
      .map((item) => ({
        createdAt: item.createdAt,
        category: item.category,
        sceneId: item.sceneId,
        mode: item.mode,
        source: item.analytics?.source || "unknown",
        text: String(item.text || "").replace(/\s+/g, " ").slice(0, 260),
      })),
  };
}
