export const ClaudeToolsMobile = [
  {
    type: "computer_20241022",
    name: "computer",
    display_width_px: 1920,
    display_height_px: 1080,
    display_number: 1,
  },
  {
    name: "sleep",
    description: "Pause test execution for specified duration",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["sleep"],
          description: "The action to perform",
        },
        duration: {
          type: "number",
          description:
            "Duration to sleep in milliseconds (e.g. 5000 for 5 seconds)",
          minimum: 0,
          maximum: 60000,
        },
      },
      required: ["action", "duration"],
    },
  },
  {
    name: "run_callback",
    description: "Run callback function for current test step",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["run_callback"],
          description: "Execute callback for current step",
        },
      },
      required: ["action"],
    },
  },
] as const;

export type ClaudeMobileTool = (typeof ClaudeToolsMobile)[number]["name"];
