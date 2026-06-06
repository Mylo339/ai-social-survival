import { readFile } from "node:fs/promises";
import vm from "node:vm";

export class FakeClassList {
  constructor() {
    this.classes = new Set();
  }

  add(...names) {
    names.forEach((name) => this.classes.add(name));
  }

  remove(...names) {
    names.forEach((name) => this.classes.delete(name));
  }

  toggle(name, force) {
    if (force === undefined) {
      if (this.classes.has(name)) this.classes.delete(name);
      else this.classes.add(name);
      return;
    }
    if (force) this.classes.add(name);
    else this.classes.delete(name);
  }

  contains(name) {
    return this.classes.has(name);
  }
}

export class FakeElement {
  constructor(selector = "") {
    this.selector = selector;
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.className = "";
    this.textContent = "";
    this.innerHTML = "";
    this.value = "";
    this.disabled = false;
    this.hidden = false;
    this.open = false;
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.parentElement = null;
  }

  append(...nodes) {
    nodes.forEach((node) => {
      node.parentElement = this;
    });
    this.children.push(...nodes);
    this.scrollHeight = this.children.length;
  }

  appendChild(node) {
    this.append(node);
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  focus() {}

  showModal() {
    this.open = true;
  }

  close() {
    this.open = false;
  }

  closest() {
    return null;
  }
}

export class FakeDocument {
  constructor() {
    this.elements = new Map();
  }

  querySelector(selector) {
    if (!this.elements.has(selector)) this.elements.set(selector, new FakeElement(selector));
    return this.elements.get(selector);
  }

  querySelectorAll() {
    return [];
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }
}

export class FakeStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

export class MockSpeechRecognition {
  constructor() {
    this.handlers = {};
    MockSpeechRecognition.lastInstance = this;
  }

  addEventListener(type, handler) {
    this.handlers[type] = handler;
  }

  start() {
    this.handlers.start?.();
    this.handlers.result?.({
      resultIndex: 0,
      results: [[{ transcript: "Could I please get a flat white" }]],
    });
    this.handlers.end?.();
  }

  stop() {
    this.handlers.end?.();
  }
}

export async function createHarness({ voice = false, location = {}, fetch: fetchMock } = {}) {
  const document = new FakeDocument();
  const localStorage = new FakeStorage();
  const runTimer = (callback) => {
    callback();
    return 1;
  };

  const context = {
    console,
    document,
    URLSearchParams,
    navigator: {
      clipboard: {
        async writeText(text) {
          context.__copiedText = text;
        },
      },
    },
    window: {
      SpeechRecognition: voice ? MockSpeechRecognition : undefined,
      webkitSpeechRecognition: voice ? MockSpeechRecognition : undefined,
      localStorage,
      location: {
        protocol: location.protocol || "file:",
        hostname: location.hostname || "",
        pathname: location.pathname || "/",
        search: location.search || "",
      },
      innerWidth: location.innerWidth || 1280,
      scrollTo() {},
      confirm() {
        return true;
      },
      setTimeout: runTimer,
    },
    setTimeout: runTimer,
  };
  if (fetchMock) context.fetch = fetchMock;

  context.globalThis = context;
  const appSource = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const exportHarness = `
globalThis.__appTest = {
  scenes,
  toneModes,
  rubricMeta,
  state,
  profile,
  categoryLabels,
  setMode,
  startScene,
  renderScenes,
  renderToneGrid,
  renderQuickReplies,
  evaluateTurn,
  handleUserMessage,
  scoreSession,
  showResult,
  savePhrase,
  renderProgress,
  renderPhrasebook,
  copyShareText,
  submitQuickFeedback,
  toggleQuickFeedbackTag,
  clearHistory,
  removePhrase,
  submitFeedback
};
`;

  vm.runInNewContext(`${appSource}\n${exportHarness}`, context, { filename: "app.js" });
  return { app: context.__appTest, context, document, localStorage };
}
