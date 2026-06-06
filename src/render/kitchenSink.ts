import type { KitchenSinkRenderOptions } from "../sim/state.js";
import { buildKitchenSinkState } from "../sim/state.js";
import { hstack, normalizeFrame, splitRatioWidths } from "../tui/layout.js";
import { enemySpecies, shipFamily } from "../assets/index.js";
import type { GameAssetVariant } from "../assets/index.js";
import {
  renderBars,
  renderCounters,
  renderEnemyGrid,
  renderFooter,
  renderShipGrid,
  renderLoading,
  renderBorders,
  renderBackgrounds
} from "./widgets.js";

export type { KitchenSinkRenderOptions };

function calculateGridHeight(variants: GameAssetVariant[], contentWidth: number): number {
  const columns = Math.max(1, Math.min(5, Math.floor((contentWidth + 1) / 14)));
  let totalHeight = 0;
  for (let index = 0; index < variants.length; index += columns) {
    const group = variants.slice(index, index + columns);
    const rowHeight = Math.max(...group.map(v => 2 + v.sprite.height));
    totalHeight += rowHeight;
    if (index + columns < variants.length) {
      totalHeight += 1;
    }
  }
  return totalHeight + 2;
}

export function renderKitchenSink(options: KitchenSinkRenderOptions): string {
  const width = Math.max(80, Math.floor(options.width));
  const height = Math.max(24, Math.floor(options.height));
  const color = options.color ?? true;
  const state = buildKitchenSinkState({ ...options, width, height });
  const sections: string[] = [];

  // 1. Render Top Row
  if (width >= 128 && height >= 36) {
    const top = splitRatioWidths(width, [1, 1, 1], 1, [34, 34, 34]);
    sections.push(hstack([renderCounters(top[0]!, state, color), renderBars(top[1]!, state, color), renderLoading(top[2]!, state, color)], 1));
  } else if (width >= 96 && height >= 30) {
    const top = splitRatioWidths(width, [1, 1, 1], 1, [30, 30, 30]);
    sections.push(hstack([renderCounters(top[0]!, state, color), renderBars(top[1]!, state, color), renderLoading(top[2]!, state, color)], 1));
  } else {
    const top = splitRatioWidths(width, [1, 1, 1], 1, [24, 24, 24]);
    sections.push(hstack([renderCounters(top[0]!, state, color), renderBars(top[1]!, state, color), renderLoading(top[2]!, state, color)], 1));
  }

  // 2. Render Middle Row (Grids + Config Panels)
  const middleHeight = height - 11;
  const minAssetWidth = width >= 128 && height >= 36 ? 34 : width >= 96 && height >= 30 ? 24 : 20;
  const assetWidths = splitRatioWidths(width, [1, 1], 1, [minAssetWidth, minAssetWidth]);
  
  const neededEnemyGridHeight = calculateGridHeight(enemySpecies.variants, assetWidths[0]!);
  const leftConfigHeight = Math.max(6, middleHeight - neededEnemyGridHeight);
  const actualEnemyGridHeight = middleHeight - leftConfigHeight;

  const neededShipGridHeight = calculateGridHeight(shipFamily.variants, assetWidths[1]!);
  const rightConfigHeight = Math.max(6, middleHeight - neededShipGridHeight);
  const actualShipGridHeight = middleHeight - rightConfigHeight;

  const leftCol = [
    renderEnemyGrid(assetWidths[0]!, actualEnemyGridHeight, state, color),
    renderBackgrounds(assetWidths[0]!, leftConfigHeight, state, color)
  ].join("\n");
  const rightCol = [
    renderShipGrid(assetWidths[1]!, actualShipGridHeight, state, color),
    renderBorders(assetWidths[1]!, rightConfigHeight, state, color)
  ].join("\n");
  
  sections.push(hstack([leftCol, rightCol], 1));

  // 3. Render Footer
  sections.push(renderFooter(width, state, color));
  return normalizeFrame(sections.join("\n"), width, height);
}

