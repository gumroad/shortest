import { DriverConfig } from "../core/driver/driver";

export interface ShortestConfig {
  driver: DriverConfig;
  headless: boolean;
  baseUrl?: string;
  appPath?: string;
  testDir: string | string[];
  anthropicKey: string;
  mailosaur?: {
    apiKey: string;
    serverId: string;
  };
}
