import fs from "node:fs/promises";
import vm from "node:vm";
import { beforeAll, describe, expect, it } from "vitest";

type Listener = (event: TestEvent) => void;

class TestEvent {
  defaultPrevented = false;

  constructor(
    readonly type: string,
    readonly target: FakeElement,
    readonly key = "",
    readonly metaKey = false,
    readonly ctrlKey = false,
    readonly altKey = false,
    readonly shiftKey = false,
  ) {}

  preventDefault(): void {
    this.defaultPrevented = true;
  }
}

class FakeClassList {
  private readonly values = new Set<string>();

  set(value: string): void {
    this.values.clear();
    for (const name of value.split(/\s+/).filter(Boolean)) {
      this.values.add(name);
    }
  }

  add(...names: string[]): void {
    names.forEach((name) => this.values.add(name));
  }

  remove(...names: string[]): void {
    names.forEach((name) => this.values.delete(name));
  }

  toggle(name: string, force?: boolean): boolean {
    const enabled = force ?? !this.values.has(name);
    if (enabled) {
      this.values.add(name);
    } else {
      this.values.delete(name);
    }
    return enabled;
  }

  contains(name: string): boolean {
    return this.values.has(name);
  }

  toString(): string {
    return [...this.values].join(" ");
  }
}

class FakeElement {
  readonly attributes = new Map<string, string>();
  readonly children: FakeElement[] = [];
  readonly classList = new FakeClassList();
  parentNode: FakeElement | null = null;
  hidden = false;
  inert = false;
  value = "";
  href = "";
  textContent = "";
  focused = false;
  scrolledIntoView = false;
  private readonly listeners = new Map<string, Listener[]>();

  constructor(
    readonly tagName: string,
    readonly ownerDocument: FakeDocument,
    readonly id = "",
  ) {}

  set className(value: string) {
    this.classList.set(value);
  }

  get className(): string {
    return this.classList.toString();
  }

  appendChild(child: FakeElement): FakeElement {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  replaceChildren(...children: FakeElement[]): void {
    this.children.splice(0);
    children.forEach((child) => this.appendChild(child));
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  addEventListener(type: string, listener: Listener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(event: TestEvent): void {
    for (const listener of this.listeners.get(event.type) ?? []) {
      listener(event);
    }
  }

  focus(): void {
    if (this.ownerDocument.activeElement) {
      this.ownerDocument.activeElement.focused = false;
    }
    this.focused = true;
    this.ownerDocument.activeElement = this;
  }

  scrollIntoView(): void {
    this.scrolledIntoView = true;
  }

  closest(selector: string): FakeElement | null {
    if (selector.startsWith(".")) {
      const className = selector.slice(1);
      if (this.classList.contains(className)) {
        return this;
      }
      return this.parentNode?.closest(selector) ?? null;
    }
    return null;
  }
}

class FakeDocument {
  readonly documentElement = new FakeElement("HTML", this);
  readonly location = { href: "" };
  activeElement: FakeElement | null = null;
  private readonly elements = new Map<string, FakeElement>();
  private readonly listeners = new Map<string, Listener[]>();

  register(tagName: string, id: string): FakeElement {
    const element = new FakeElement(tagName, this, id);
    this.elements.set(id, element);
    return element;
  }

  getElementById(id: string): FakeElement | null {
    return this.elements.get(id) ?? null;
  }

  createElement(tagName: string): FakeElement {
    return new FakeElement(tagName.toUpperCase(), this);
  }

  createTextNode(text: string): FakeElement {
    const node = new FakeElement("#text", this);
    node.textContent = text;
    return node;
  }

  addEventListener(type: string, listener: Listener): void {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(event: TestEvent): void {
    for (const listener of this.listeners.get(event.type) ?? []) {
      listener(event);
    }
  }
}

interface Harness {
  document: FakeDocument;
  input: FakeElement;
  results: FakeElement;
  groups: FakeElement;
  status: FakeElement;
  navToggle: FakeElement;
  navDrawer: FakeElement;
  navBackdrop: FakeElement;
  location: { href: string };
}

const documents = [
  {
    slug: "rules",
    title: "<script>Rule alpha</script>",
    category: "root",
    categoryLabel: "Project Root",
    description: "Rule alpha guidance",
    body: "",
  },
  {
    slug: "setup",
    title: "Setup rule",
    category: "root",
    categoryLabel: "Project Root",
    description: "",
    body: "Fallback setup excerpt",
  },
  {
    slug: "workflow",
    title: "Workflow",
    category: "cursor-rules",
    categoryLabel: "Cursor Rules",
    description: "Rule workflow",
    body: "",
  },
  {
    slug: "spec-guide",
    title: "Spec guide",
    category: "spec",
    categoryLabel: "Specifications",
    description: "First specification result",
    body: "",
  },
  {
    slug: "specs-reference",
    title: "Specs reference",
    category: "specs",
    categoryLabel: "Specifications",
    description: "Second specification result",
    body: "",
  },
];

let source = "";

beforeAll(async () => {
  source = await fs.readFile(
    new URL("../../../src/output/html/assets/search.js", import.meta.url),
    "utf-8",
  );
});

function createHarness(
  searches: Record<string, Array<{ ref: string }>>,
): Harness {
  const document = new FakeDocument();
  const search = document.register("DIV", "search");
  search.className = "specwiki-search";
  const index = document.register("SCRIPT", "search-index");
  const input = document.register("INPUT", "specwiki-search-input");
  const results = document.register("DIV", "specwiki-search-results");
  const groups = document.register("DIV", "specwiki-search-groups");
  const status = document.register("P", "specwiki-search-status");
  const navToggle = document.register("BUTTON", "specwiki-nav-toggle");
  const navDrawer = document.register("ASIDE", "specwiki-nav-drawer");
  const navBackdrop = document.register("DIV", "specwiki-nav-backdrop");
  const outside = document.register("MAIN", "outside");

  search.appendChild(input);
  search.appendChild(results);
  results.appendChild(groups);
  results.appendChild(status);
  document.documentElement.appendChild(search);
  document.documentElement.appendChild(navToggle);
  document.documentElement.appendChild(navDrawer);
  document.documentElement.appendChild(navBackdrop);
  document.documentElement.appendChild(outside);

  index.textContent = JSON.stringify({ version: 1, documents });
  input.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-expanded", "false");
  const lunr = (configure: (this: object) => void) => {
    configure.call({
      ref() {},
      field() {},
      add() {},
    });
    return {
      search(query: string) {
        return searches[query] ?? [];
      },
    };
  };

  vm.runInNewContext(source, {
    document,
    Element: FakeElement,
    lunr,
  });

  return {
    document,
    input,
    results,
    groups,
    status,
    navToggle,
    navDrawer,
    navBackdrop,
    location: document.location,
  };
}

function key(
  target: FakeElement,
  keyName: string,
  modifiers: Partial<
    Pick<TestEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey">
  > = {},
): TestEvent {
  return new TestEvent(
    "keydown",
    target,
    keyName,
    modifiers.metaKey,
    modifiers.ctrlKey,
    modifiers.altKey,
    modifiers.shiftKey,
  );
}

function descendants(
  element: FakeElement,
  predicate: (child: FakeElement) => boolean,
): FakeElement[] {
  return element.children.flatMap((child) => [
    ...(predicate(child) ? [child] : []),
    ...descendants(child, predicate),
  ]);
}

function renderedText(element: FakeElement): string {
  return element.textContent + element.children.map(renderedText).join("");
}

describe("search client keyboard and result behavior", () => {
  it("focuses search for slash and platform command shortcuts only", () => {
    const harness = createHarness({});
    const outside = harness.document.getElementById("outside")!;
    const slash = key(outside, "/");

    harness.document.dispatch(slash);

    expect(slash.defaultPrevented).toBe(true);
    expect(harness.document.activeElement).toBe(harness.input);

    harness.document.activeElement = null;
    const editableSlash = key(harness.input, "/");
    harness.document.dispatch(editableSlash);
    expect(editableSlash.defaultPrevented).toBe(false);
    expect(harness.document.activeElement).toBeNull();

    const modifiedSlash = key(outside, "/", { metaKey: true });
    harness.document.dispatch(modifiedSlash);
    expect(modifiedSlash.defaultPrevented).toBe(false);

    const commandK = key(outside, "k", { metaKey: true });
    harness.document.dispatch(commandK);
    expect(commandK.defaultPrevented).toBe(true);
    expect(harness.document.activeElement).toBe(harness.input);

    const controlK = key(outside, "K", { ctrlKey: true });
    harness.document.dispatch(controlK);
    expect(controlK.defaultPrevented).toBe(true);
  });

  it("groups ranked results, caps cards, and highlights with safe DOM nodes", () => {
    const ranked = [
      { ref: "rules" },
      { ref: "workflow" },
      { ref: "setup" },
      ...Array.from({ length: 9 }, () => ({ ref: "rules" })),
    ];
    const harness = createHarness({ rule: ranked });
    harness.input.value = "rule";

    harness.input.dispatch(new TestEvent("input", harness.input));

    expect(harness.results.hidden).toBe(false);
    expect(harness.input.getAttribute("aria-expanded")).toBe("true");
    const headings = descendants(harness.groups, (element) =>
      element.classList.contains("specwiki-search-group-heading"),
    );
    expect(headings.map(renderedText)).toEqual([
      "Project Root",
      "Cursor Rules",
    ]);
    const options = descendants(
      harness.groups,
      (element) => element.getAttribute("role") === "option",
    );
    expect(options).toHaveLength(10);
    expect(options[0].getAttribute("id")).toBe("specwiki-search-option-0");
    expect(options[0].href).toBe("rules.html");
    expect(renderedText(options[0])).toContain("<script>Rule alpha</script>");
    expect(
      descendants(options[0], (element) => element.tagName === "SCRIPT"),
    ).toHaveLength(0);
    expect(
      descendants(options[0], (element) => element.tagName === "MARK").length,
    ).toBeGreaterThan(0);
    const setupOption = options.find(
      (option) => option.getAttribute("href") === "setup.html",
    );
    expect(renderedText(setupOption!)).toContain("Fallback setup excerpt");
  });

  it("merges raw categories that share one human-readable label", () => {
    const harness = createHarness({
      specification: [{ ref: "spec-guide" }, { ref: "specs-reference" }],
    });
    harness.input.value = "specification";

    harness.input.dispatch(new TestEvent("input", harness.input));

    const headings = descendants(harness.groups, (element) =>
      element.classList.contains("specwiki-search-group-heading"),
    );
    expect(headings.map(renderedText)).toEqual(["Specifications"]);
    const options = descendants(
      harness.groups,
      (element) => element.getAttribute("role") === "option",
    );
    expect(options.map((option) => option.getAttribute("href"))).toEqual([
      "spec-guide.html",
      "specs-reference.html",
    ]);
  });

  it("wraps active options, keeps input focus, and opens the active link", () => {
    const harness = createHarness({
      rule: [{ ref: "rules" }, { ref: "setup" }],
    });
    harness.input.value = "rule";
    harness.input.focus();
    harness.input.dispatch(new TestEvent("input", harness.input));

    const up = key(harness.input, "ArrowUp");
    harness.input.dispatch(up);
    expect(up.defaultPrevented).toBe(true);
    expect(harness.input.getAttribute("aria-activedescendant")).toBe(
      "specwiki-search-option-1",
    );
    expect(harness.document.activeElement).toBe(harness.input);
    const options = descendants(
      harness.groups,
      (element) => element.getAttribute("role") === "option",
    );
    expect(options[1].scrolledIntoView).toBe(true);

    harness.input.dispatch(key(harness.input, "ArrowDown"));
    expect(harness.input.getAttribute("aria-activedescendant")).toBe(
      "specwiki-search-option-0",
    );

    harness.input.dispatch(key(harness.input, "Enter"));
    expect(harness.location.href).toBe("rules.html");
  });

  it("shows guidance for no matches and clears closed state", () => {
    const harness = createHarness({ gibberish: [] });
    harness.input.value = "gibberish";
    harness.input.dispatch(new TestEvent("input", harness.input));

    expect(harness.results.hidden).toBe(false);
    expect(harness.status.hidden).toBe(false);
    expect(renderedText(harness.status)).toContain(
      "Try fewer or different words",
    );
    expect(
      descendants(
        harness.results,
        (element) => element.getAttribute("role") === "option",
      ),
    ).toHaveLength(0);

    harness.input.dispatch(key(harness.input, "Escape"));
    expect(harness.results.hidden).toBe(true);
    expect(harness.input.getAttribute("aria-expanded")).toBe("false");
    expect(harness.input.getAttribute("aria-activedescendant")).toBeNull();
    expect(harness.document.activeElement).toBe(harness.input);

    harness.input.value = "";
    harness.input.dispatch(new TestEvent("input", harness.input));
    expect(harness.groups.children).toHaveLength(0);
    expect(harness.status.textContent).toBe("");
  });

  it("closes the drawer when search opens and closes search on outside click", () => {
    const harness = createHarness({ rule: [{ ref: "rules" }] });
    const outside = harness.document.getElementById("outside")!;
    harness.navToggle.setAttribute("aria-expanded", "true");
    harness.navDrawer.setAttribute("aria-hidden", "false");
    harness.navDrawer.inert = false;
    harness.navBackdrop.hidden = false;
    harness.document.documentElement.classList.add("specwiki-nav-open");

    harness.document.dispatch(key(outside, "/"));

    expect(harness.navToggle.getAttribute("aria-expanded")).toBe("false");
    expect(harness.navDrawer.getAttribute("aria-hidden")).toBe("true");
    expect(harness.navDrawer.inert).toBe(true);
    expect(harness.navBackdrop.hidden).toBe(true);
    expect(
      harness.document.documentElement.classList.contains("specwiki-nav-open"),
    ).toBe(false);

    harness.input.value = "rule";
    harness.input.dispatch(new TestEvent("input", harness.input));
    harness.document.dispatch(new TestEvent("click", outside));
    expect(harness.results.hidden).toBe(true);
  });

  it("closes search before the mobile navigation drawer opens", () => {
    const harness = createHarness({ rule: [{ ref: "rules" }] });
    harness.input.value = "rule";
    harness.input.dispatch(new TestEvent("input", harness.input));
    expect(harness.results.hidden).toBe(false);

    harness.navToggle.dispatch(new TestEvent("click", harness.navToggle));

    expect(harness.results.hidden).toBe(true);
    expect(harness.input.getAttribute("aria-expanded")).toBe("false");
    expect(harness.input.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("uses no unsafe rendering, network, logging, or storage APIs", () => {
    expect(source).not.toContain("innerHTML");
    expect(source).not.toContain("insertAdjacentHTML");
    expect(source).not.toContain("fetch(");
    expect(source).not.toContain("console.");
    expect(source).not.toContain("localStorage");
  });

  it("fails silently when search prerequisites are unavailable", () => {
    const document = new FakeDocument();

    expect(() =>
      vm.runInNewContext(source, {
        document,
        Element: FakeElement,
      }),
    ).not.toThrow();
  });
});
