import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { build } from 'esbuild';
import type { ShortestConfig } from './types';
import { defaultConfig } from './types';

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
        if (file.endsWith('.ts')) {
          // Transpile TypeScript to JavaScript
          const result = await build({
            entryPoints: [configPath],
            write: false,
            platform: 'node',
            format: 'esm',
            target: 'node18',
            bundle: true
          });
          
          // Create temporary module from transpiled code
          const code = result.outputFiles[0].text;
          const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
          
          return { ...defaultConfig, ...module.default };
        }
        
        const userConfig = await import(configPath);
        return { ...defaultConfig, ...userConfig.default };
      } catch (error) {
        console.error(`Error loading config from ${file}:`, error);
      }
    }
  }

  return defaultConfig;
} 