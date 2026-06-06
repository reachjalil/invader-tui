# Invader TUI

Phase One compact 8-bit kitchen sink for an auto-playable terminal invasion sim.

This repo intentionally contains the visual and data foundation only: typed sprites, asset variants, stats, counters, bars, loading states, and a deterministic TUI snapshot renderer. Combat, collision, projectile physics, and persistence are out of scope for Phase One.

## Commands

```sh
pnpm install
pnpm start
pnpm snapshot -- --cols 80 --rows 24
pnpm snapshot -- --cols 100 --rows 30
pnpm test
pnpm check
```

`pnpm start` runs the animated preview loop. `pnpm snapshot` renders one deterministic frame.
