import { shortest } from "@antiwork/shortest";

shortest(
  "Visit material.io and verify the Material Design 3 color system implementation. Primary color should be #6750A4 (purple) with tonal palette ranging from 0-100. Check dynamic color theming in light and dark modes.",
  {
    baseColors: {
      primary: "#6750A4",
      secondary: "#9C27B0",
      tertiary: "#FFB4AB",
      error: "#B3261E",
    },
    modes: ["light", "dark"],
  },
);

shortest(
  "Verify Material Design typography on material.io - Roboto font, type scale (Display Large 57/64px, Headline 24/32px, Body 16/24px) and component tokens (buttons 14px/500, cards 16px/400, app bar 22px/500)",
);

shortest("Verify Material Design elevation and spacing on material.io", {
  elevation: {
    levels: [1, 2, 3, 4, 6, 8, 12],
    unit: "dp",
  },
  spacing: {
    grid: 8,
    components: {
      cardPadding: 16,
      listItemGap: 8,
      sectionMargin: 24,
    },
  },
});
