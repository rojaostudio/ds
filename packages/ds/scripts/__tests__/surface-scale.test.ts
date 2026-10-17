import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// ds#189: the width of a panel, menu, dialog or floating window comes from one scale, layout/surface/xs…xl
// (240 · 320 · 400 · 560 · 720), never from a loose number in the component's stylesheet.
const root = join(__dirname, "..", "..");
const css = (file: string) => readFileSync(join(root, "components", file), "utf8");
const SURFACES = [
  "sidebar.css", "tooltip.css", "popover.css", "hover-card.css", "sheet.css", "drawer.css", "dialog.css",
  "alert-dialog.css", "command.css",
];

describe("surface width scale (ds#189)", () => {
  it("emits the five steps in the foundation", () => {
    const foundation = readFileSync(join(root, "styles", "rds", "foundation.css"), "utf8");
    for (const [step, px] of [["xs", 240], ["sm", 320], ["md", 400], ["lg", 560], ["xl", 720]] as const)
      expect(foundation).toContain(`--layout-surface-${step}: ${px}px;`);
  });

  it.each(SURFACES)("%s reads its width from the scale, with no loose step", (file) => {
    const text = css(file).replace(/\/\*[\s\S]*?\*\//g, "");
    expect(text).toMatch(/var\(--layout-surface-(xs|sm|md|lg|xl)\)/);
    expect(text).not.toMatch(/\b(240|320|400|560|720)px\b/);
  });
});
