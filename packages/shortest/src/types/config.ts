export interface ShortestConfig {
  headless: boolean;
  baseUrl: string;
  testPattern: string | string[];
  anthropicKey: string;
  mailosaur?: {
    apiKey: string;
    serverId: string;
  };
}
