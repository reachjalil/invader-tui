#!/usr/bin/env node
import { renderKitchenSinkBrowser } from "./kitchen/render.js";
import { kitchenSinkComponents, componentIndexById } from "./kitchen/registry.js";
import { applyKey, createBrowserState, resolveSelection, type KitchenBrowserState, type KitchenSinkFocusZone } from "./kitchen/state.js";

process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});

type CliOptions = {
  width: number;
  height: number;
  tick: number;
  color: boolean;
  paused: boolean;
  component?: string | undefined;
  data?: string | undefined;
  variant?: string | undefined;
  density?: string | undefined;
  focus?: KitchenSinkFocusZone | undefined;
};

function parseArgs(argv: string[]): { command: string; options: CliOptions } {
  const command = argv[0] && !argv[0].startsWith("--") ? argv[0] : "start";
  const readNumber = (name: string, fallback: number): number => {
    const index = argv.indexOf(name);
    if (index >= 0) return Number(argv[index + 1] ?? fallback);
    return fallback;
  };
  const readString = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  const focusArg = readString("--focus") as KitchenSinkFocusZone | undefined;
  const focus = ["navigation", "preview", "options"].includes(focusArg as string) ? focusArg : undefined;

  return {
    command,
    options: {
      width: readNumber("--cols", process.stdout.columns || 120),
      height: readNumber("--rows", process.stdout.rows || 34),
      tick: readNumber("--tick", 0),
      color: argv.includes("--color"),
      paused: argv.includes("--paused"),
      ...(readString("--component") ? { component: readString("--component") } : {}),
      ...(readString("--data") ? { data: readString("--data") } : {}),
      ...(readString("--variant") ? { variant: readString("--variant") } : {}),
      ...(readString("--density") ? { density: readString("--density") } : {}),
      ...(focus ? { focus } : {})
    }
  };
}

// Build a browser state from one-shot CLI flags (used by `snapshot`).
function stateFromOptions(options: CliOptions): KitchenBrowserState {
  const componentIndex = options.component ? componentIndexById(options.component) : 0;
  let state = createBrowserState(componentIndex);
  if (options.focus) state = { ...state, focus: options.focus };
  const component = kitchenSinkComponents[state.componentIndex]!;
  const choiceIndex = (groupId: string, choiceId?: string): number | undefined => {
    if (!choiceId) return undefined;
    const group = component.optionGroups.find((g) => g.id === groupId);
    if (!group) return undefined;
    const idx = group.choices.findIndex((c) => c.id === choiceId);
    return idx >= 0 ? idx : undefined;
  };
  const dataIndex = choiceIndex("data", options.data);
  const variantIndex = choiceIndex("variant", options.variant);
  const densityIndex = choiceIndex("density", options.density);
  return {
    ...state,
    ...(dataIndex !== undefined ? { dataIndex } : {}),
    ...(variantIndex !== undefined ? { variantIndex } : {}),
    ...(densityIndex !== undefined ? { densityIndex } : {})
  };
}

function snapshot(options: CliOptions): void {
  const frame = renderKitchenSinkBrowser({
    width: options.width,
    height: options.height,
    color: options.color,
    tick: options.tick,
    paused: options.paused,
    state: stateFromOptions(options)
  });
  process.stdout.write(`${frame}\n`);
}

const terminal = {
  enterLiveScreen: "\x1b[?1049h\x1b[?25l\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[2J\x1b[H",
  exitLiveScreen: "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[?25h\x1b[?1049l",
  frameStart: "\x1b[H",
  frameEnd: "\x1b[J"
} as const;

// Normalize a raw stdin chunk into the key tokens understood by applyKey():
// arrow/shift-tab escape sequences become "[A"/"[B"/"[C"/"[D"/"[Z".
function normalizeKey(raw: string): string {
  if (raw === "\u0003") return "q"; // Ctrl-C
  if (raw.startsWith("\u001b") && raw.length > 1) return raw.slice(1); // ESC[A -> "[A"
  return raw;
}

function start(options: CliOptions): void {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    snapshot({ ...options, color: false });
    return;
  }
  let tick = options.tick ?? 0;
  let paused = options.paused ?? false;
  let state = stateFromOptions(options);
  let closed = false;

  const render = () => {
    if (closed) return;
    const frame = renderKitchenSinkBrowser({
      width: process.stdout.columns || options.width,
      height: process.stdout.rows || options.height,
      color: true,
      tick,
      paused,
      state
    });
    process.stdout.write(`${terminal.frameStart}${frame}${terminal.frameEnd}`);
  };

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(interval);
    process.stdin.off("data", handleInput);
    process.off("SIGINT", stop);
    process.off("SIGTERM", stop);
    process.stdout.write(terminal.exitLiveScreen);
    process.stdin.setRawMode(false);
    process.stdin.pause();
  };

  const stop = () => {
    cleanup();
    process.exit(0);
  };

  const interval = setInterval(() => {
    if (!paused) tick += 1;
    render();
  }, 140);

  const handleInput = (key: Buffer | string) => {
    const action = applyKey(state, normalizeKey(String(key)));
    if (action.kind === "quit") {
      stop();
      return;
    }
    if (action.kind === "pause") paused = !paused;
    else if (action.kind === "step") tick += 1;
    else if (action.kind === "state") state = action.state;
    else return;
    render();
  };

  process.stdout.write(terminal.enterLiveScreen);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", handleInput);
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  render();
}

const { command, options } = parseArgs(process.argv.slice(2));
if (command === "start") {
  start({ ...options, color: true });
} else if (command === "snapshot") {
  snapshot({ ...options, color: options.color ?? false });
} else {
  process.stderr.write(`Unknown command: ${command}\n`);
  process.exit(1);
}

// Re-exported for tests and programmatic use.
export { renderKitchenSinkBrowser, resolveSelection };
