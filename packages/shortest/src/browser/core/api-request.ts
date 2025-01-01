import {
  APIRequest as APIRequestType,
  APIRequestConfig,
  APIFetchConfig,
} from "../../types/request";

function generatePrompt(
  request: APIRequestType,
  config: Partial<APIRequestConfig>,
) {
  return `
        You are about to process an API request. Your goal is to dynamically populate variables (like <Bearer API KEY>) with actual values, either inferred or retrieved. Follow these steps:
        - Analyze the request object: extract all necessary values (e.g., HTTP method, headers, authorization tokens).
        - Use the config object for the base URL, timeout, headers, storageState (used for cookies) or other reusable settings.
        - Replace placeholders (<>) in the request details with the actual values from memory or context.
        - Assemble the final cURL command using these values and return it as a clean, actionable string.
        - Your output should look like a ready-to-execute cURL command with no extraneous text.

        REQUEST OBJECT: ${JSON.stringify(request)}
        CONFIG OBJECT: ${JSON.stringify(config)}
        ! IMPORTANT:
          - You are tasked with generating a precise and accurate cURL command for API requests. Do not modify or process the response data in any way (e.g., jq, grep, or Python code such as python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data))
            Your sole responsibility is to create a clean, unmodified cURL command for execution
          - Every single field in the config object object must be accounted for in the final cURL command
        `;
}

export class APIRequest {
  private config: Partial<APIRequestConfig>;

  constructor(config: Partial<APIRequestConfig>) {
    this.config = config;
  }

  public fetch(request: APIRequestType, config?: APIFetchConfig): string {
    return generatePrompt(request, { ...this.config, ...config });
  }
}
