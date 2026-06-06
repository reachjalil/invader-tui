#!/usr/bin/env node
import { renderKitchenSink, type KitchenSinkRenderOptions } from "./render/kitchenSink.js";
import type { KitchenSinkFocus, BorderStyle, BackgroundStyle } from "./sim/state.js";

const focusOrder: KitchenSinkFocus[] = ["enemies", "ships", "designs", "counters"];

process.stdout.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EPIPE") process.exit(0);
  throw error;
});

function parseArgs(argv: string[]): { command: string; options: KitchenSinkRenderOptions } {
  const command = argv[0] ?? "snapshot";
  const readNumber = (name: string, fallback: number): number => {
    const index = argv.indexOf(name);
    if (index >= 0) return Number(argv[index + 1] ?? fallback);
    return fallback;
  };
  const focusArg = argv[argv.indexOf("--focus") + 1] as KitchenSinkFocus | undefined;
  const focus = focusOrder.includes(focusArg as KitchenSinkFocus) ? focusArg : undefined;

  const borderArg = argv[argv.indexOf("--border") + 1] as BorderStyle | undefined;
  const borderStyle = ["single", "double", "heavy", "arcade", "block", "ornamental", "cyberpunk", "dashed", "terminal", "cryptic"].includes(borderArg as string) ? borderArg : undefined;

  const bgArg = argv[argv.indexOf("--bg") + 1] as BackgroundStyle | undefined;
  const backgroundStyle = [
    "empty", "stars", "nebula", "warp", "asteroids", "matrix", "nova",
    "blackhole", "pulsar", "radar", "hyperspace", "aurora",
    "fire", "ice", "crt",
    "sine", "spiral", "rain"
  ].includes(bgArg as string) ? bgArg : undefined;

  return {
    command,
    options: {
      width: readNumber("--cols", process.stdout.columns || 100),
      height: readNumber("--rows", process.stdout.rows || 30),
      tick: readNumber("--tick", 0),
      color: argv.includes("--color"),
      paused: argv.includes("--paused"),
      ...(focus ? { focus } : {}),
      ...(borderStyle ? { borderStyle } : {}),
      ...(backgroundStyle ? { backgroundStyle } : {})
    }
  };
}

function snapshot(options: KitchenSinkRenderOptions): void {
  process.stdout.write(`${renderKitchenSink(options)}\n`);
}

const terminal = {
  enterLiveScreen: "\x1b[?1049h\x1b[?25l\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[2J\x1b[H",
  exitLiveScreen: "\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1004l\x1b[?1006l\x1b[?25h\x1b[?1049l",
  frameStart: "\x1b[H",
  frameEnd: "\x1b[J"
} as const;

function start(options: KitchenSinkRenderOptions): void {
  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    snapshot({ ...options, color: false });
    return;
  }
  let tick = options.tick ?? 0;
  let paused = false;
  let focusIndex = Math.max(0, focusOrder.indexOf(options.focus ?? "enemies"));
  let closed = false;

  let borderIndex = 0;
  const borderStyles: BorderStyle[] = ["single", "double", "heavy", "arcade", "block", "ornamental", "cyberpunk", "dashed", "terminal", "cryptic"];
  let backgroundIndex = 1; // Default to stars
  const backgroundStyles: BackgroundStyle[] = [
    "empty", "stars", "nebula", "warp", "asteroids", "matrix", "nova",
    "blackhole", "pulsar", "radar", "hyperspace", "aurora",
    "fire", "ice", "crt",
    "sine", "spiral", "rain"
  ];

  const render = () => {
    if (closed) return;
    const frame = renderKitchenSink({
      width: process.stdout.columns || options.width,
      height: process.stdout.rows || options.height,
      color: true,
      tick,
      paused,
      focus: focusOrder[focusIndex]!,
      borderStyle: borderStyles[borderIndex]!,
      backgroundStyle: backgroundStyles[backgroundIndex]!
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
    const keyText = String(key);
    let handled = true;

    if (keyText === "q" || keyText === "\u0003") {
      stop();
      return;
    }
    if (keyText === "p") {
      paused = !paused;
    } else if (keyText === "b") {
      borderIndex = (borderIndex + 1) % borderStyles.length;
    } else if (keyText === "v") {
      backgroundIndex = (backgroundIndex + 1) % backgroundStyles.length;
    } else if (keyText === "t" || keyText === "\t") {
      focusIndex = (focusIndex + 1) % focusOrder.length;
    } else if (keyText === "f") {
      // Fire/step tick manually
      tick += 1;
    } else {
      handled = false;
    }

    if (handled) render();
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
