// visual test for github.com

import { shortest } from "@antiwork/shortest";

// GitHub header visual test
shortest("Visit github.com and verify the global navigation header layout. Check GitHub logo, search bar, navigation items (Pull requests, Issues, Marketplace, Explore), and profile dropdown maintain correct spacing and alignment", {
  url: "https://github.com",
  regions: ["header.Header-old", ".header-search-button", ".AppHeader-globalBar"],
  tolerance: 0.1
});

// GitHub repository page responsive test
shortest("Check github.com/github/docs repository page across devices. Verify repository sidebar collapses on mobile, code browser adapts, and action buttons stack properly", {
  url: "https://github.com/github/docs",
  devices: [
    { name: "iPhone 12", width: 390, height: 844 },
    { name: "iPad Pro", width: 1024, height: 1366 },
    { name: "Desktop", width: 1920, height: 1080 }
  ],
  checkpoints: [".repository-content", ".file-navigation", ".Layout-sidebar"]
});

// GitHub interactive components
shortest("Test GitHub's dropdown menus and modals on the repository page. Check repository settings dropdown, create new file modal, and code copy tooltip", {
  url: "https://github.com/github/docs",
  components: {
    dropdown: { selector: ".BtnGroup [aria-label='Select field']", trigger: "click" },
    modal: { selector: "[aria-label='Create new...']", trigger: "click" },
    tooltip: { selector: "[data-component='copyButton']", trigger: "hover" }
  },
  captureAfterInteraction: true
});

// GitHub theme switch
shortest("Compare GitHub's light and dark themes on the repository page. Verify syntax highlighting, UI components, and markdown content adapt correctly", {
  url: "https://github.com/github/docs",
  modes: ["light", "dark"],
  elements: [
    ".BorderGrid",
    ".markdown-body",
    ".Box-header",
    ".btn"
  ],
  checkContrast: true
});