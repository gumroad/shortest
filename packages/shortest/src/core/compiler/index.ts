import { build, BuildOptions } from 'esbuild';
import { join, resolve } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { defaultConfig } from '../../types';

export class TestCompiler {
  private cacheDir: string;
  private defaultOptions: BuildOptions = {
    format: 'esm',
    platform: 'node',
    target: 'node18',
    sourcemap: true,
    bundle: true,
    external: [
      'shortest',
      'fs',
      'path',
      'os',
      'util',
      'events',
      'stream',
      'assert',
      'url',
      'crypto',
      'buffer',
      'querystring',
      'fsevents'
    ]
  };

  constructor() {
    this.cacheDir = join(tmpdir(), 'shortest-cache');
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async compileFile(filePath: string): Promise<string> {
    const fileName = filePath.split('/').pop()!.replace('.ts', '.mjs');
    const outputPath = join(this.cacheDir, fileName);

    const packageJson = {
      type: 'module',
      imports: {
        'shortest': resolve(process.cwd(), 'packages/shortest/src/index.ts')
      }
    };
    writeFileSync(join(this.cacheDir, 'package.json'), JSON.stringify(packageJson));

    await build({
      ...this.defaultOptions,
      entryPoints: [filePath],
      outfile: outputPath,
      alias: {
        shortest: resolve(process.cwd(), 'packages/shortest/src/index.ts')
      },
      resolveExtensions: ['.ts', '.js', '.mjs'],
      banner: {
        js: 'import { createRequire } from "module";const require = createRequire(import.meta.url);'
      }
    });

    return outputPath;
  }

  async loadModule(filePath: string, cwd: string) {
    const absolutePath = resolve(cwd, filePath);
    
    if (!existsSync(absolutePath)) {
      return { default: defaultConfig };
    }

    try {
      const result = await build({
        ...this.defaultOptions,
        entryPoints: [absolutePath],
        write: false,
        external: ['shortest']
      });
      
      const code = result.outputFiles[0].text;
      return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
    } catch (error) {
      console.warn(`Error loading config from ${absolutePath}:`, error);
      return { default: defaultConfig };
    }
  }
}