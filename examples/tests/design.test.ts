// design test for material.io

import { shortest } from "@antiwork/shortest";

// Material Design 3 color system
shortest("Visit material.io and verify the Material Design 3 color system implementation. Primary color should be #6750A4 (purple) with tonal palette ranging from 0-100. Check dynamic color theming in light and dark modes. Verify key color roles: primary, secondary (#9C27B0), tertiary (#FFB4AB), and error (#B3261E) across components", {
  baseColors: {
    primary: "#6750A4",
    secondary: "#9C27B0",
    tertiary: "#FFB4AB",
    error: "#B3261E"
  },
  modes: ["light", "dark"]
});

// Material Design typography
shortest("Check Material Design typography system on material.io. Verify default font is Roboto with correct type scale: Display Large (57px/64px), Headline (24px/32px), Body (16px/24px). Test typography tokens in components like buttons (14px, medium 500), cards (16px, regular 400), and top app bar (22px, medium 500)", {
  fontSystem: {
    family: "Roboto",
    scale: {
      displayLarge: { size: "57px", lineHeight: "64px" },
      headline: { size: "24px", lineHeight: "32px" },
      body: { size: "16px", lineHeight: "24px" }
    },
    components: {
      button: { size: "14px", weight: 500 },
      card: { size: "16px", weight: 400 },
      appBar: { size: "22px", weight: 500 }
    }
  }
});

// Material elevation and spacing
shortest("Analyze Material Design elevation and spacing on material.io. Verify elevation system uses correct shadow values (1dp, 2dp, 3dp, 4dp, 6dp, 8dp, 12dp). Check component spacing follows 8dp grid: cards use 16dp padding, lists have 8dp between items, sections maintain 24dp margins", {
  elevation: {
    levels: [1, 2, 3, 4, 6, 8, 12],
    unit: "dp"
  },
  spacing: {
    grid: 8,
    components: {
      cardPadding: 16,
      listItemGap: 8,
      sectionMargin: 24
    }
  }
});
