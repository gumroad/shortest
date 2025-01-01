import {
  APIRequest as APIRequestType,
  APIRequestConfig,
  APIFetchConfig,
} from "../../types/request";

function generatePrompt(
  request: APIRequestType,
  config: Partial<APIRequestConfig>
) {
  return `
        You are about to process an API request. Your goal is to dynamically populate variables (like <Bearer API KEY>) with actual values, either inferred or retrieved. Follow these steps:
        - Analyze the request object: extract all necessary values (e.g., HTTP method, headers, authorization tokens).
        - Use the config object for the base URL, timeout, headers, storageState (used for cookies) or other reusable settings.
        - Assemble the final bashh command using these values and return it as a clean, actionable string.
        - Ensure the bash command uses the appropriate HTTP request package for the operating system:
          - For Linux/macOS, use 'cURL'.
          - For Windows, use 'PowerShel'.
        - Your output should look like a ready-to-execute bash command with no extraneous text.
        - Reference to SYSTEM_PROMPT 'Bash Commands' section for additional context on the task.

        REQUEST OBJECT: ${JSON.stringify(request)}
        CONFIG OBJECT: ${JSON.stringify(config)}
        ! IMPORTANT:
          - You are tasked with generating a precise and accurate bash command for API requests. Do not modify or process the response data in any way (e.g., jq, grep, or Python code such as python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data))").
            Your sole responsibility is to create a clean, unmodified bash command for execution.
          - Every single field in the config object MUST be accounted for in the final bash command.
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
