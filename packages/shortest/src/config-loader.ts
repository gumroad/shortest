import { existsSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';
import type { ShortestConfig } from './types/config';
import { defaultConfig } from './types/config';

export async function loadConfig(cwd = process.cwd()): Promise<ShortestConfig> {
  const configFiles = [
    'shortest.config.ts',
    'shortest.config.js',
    'shortest.config.mjs'
  ];

  for (const file of configFiles) {
    const configPath = resolve(cwd, file);
    if (existsSync(configPath)) {
      try {
        const userConfig = await import(pathToFileURL(configPath).href);
        return { ...defaultConfig, ...userConfig.default };
      } catch (error) {
        console.error(`Error loading config from ${file}:`, error);
      }
    }
  }

  return defaultConfig;
} 