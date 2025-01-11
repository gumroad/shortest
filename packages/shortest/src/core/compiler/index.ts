import { mkdirSync, existsSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { build, BuildOptions, Plugin } from "esbuild";

export class TestCompiler {
  private cacheDir: string;
  private defaultOptions: BuildOptions = {
    format: "esm",
    platform: "node",
    target: "node18",
    sourcemap: true,
    bundle: true,
    external: [
      "shortest",
      "fs",
      "path",
      "os",
      "util",
      "events",
      "stream",
      "assert",
      "url",
      "crypto",
      "buffer",
      "querystring",
      "fsevents",
      "node",
    ],

    // todo: consider use this instead of banner
    // https://github.com/evanw/esbuild/issues/1921#issuecomment-1898197331
    inject: [
      resolve(process.cwd(), "packages/shortest/src/core/compiler/cjs-shim.ts"),
    ],
    // banner: {
    //   js: `import { createRequire } from "module";

    //   const require = createRequire(import.meta.url);

    //     import { fileURLToPath } from 'url';
    //   import { dirname } from 'path';
    //   const __filename = fileURLToPath(import.meta.url);
    //   const __dirname = dirname(__filename);

    //   `,
    // },
  };

  constructor() {
    this.cacheDir = join(tmpdir(), "shortest-cache");
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async compileFile(filePath: string): Promise<string> {
    const fileName = filePath.split("/").pop()!.replace(".ts", ".mjs");
    const outputPath = join(this.cacheDir, fileName);

    const packageJson = {
      type: "module",
      imports: {
        shortest: resolve(process.cwd(), "packages/shortest/src/index.ts"),
      },
    };
    writeFileSync(
      join(this.cacheDir, "package.json"),
      JSON.stringify(packageJson)
    );

    // const loggerPackagePath = resolve(
    //   process.cwd(),
    //   "node_modules/.pnpm/@wdio+logger@8.38.0/node_modules/@wdio/logger"
    // );

    const fixNodeImportPlugin: Plugin = {
      name: "fix-node-import",
      setup(build) {
        build.onResolve({ filter: /^\.\/node\.js$/ }, (args) => {
          // Ensure the import comes from the correct module
          console.log("setup");
          console.log({ args: args.importer });
          if (
            args.importer.includes(
              "node_modules/.pnpm/@wdio+logger@8.38.0/node_modules/@wdio/logger/build/index.js"
            )
          ) {
            console.log("ifstatement");
            return {
              path: join(
                resolve(
                  process.cwd(),
                  "node_modules/.pnpm/@wdio+logger@8.38.0/node_modules/@wdio/logger"
                ),
                "node.js"
              ),
            };
          }

          // If not the targeted import, do nothing
          return null;
        });
      },
    };

    await build({
      ...this.defaultOptions,
      entryPoints: [filePath],
      outfile: outputPath,
      alias: {
        shortest: resolve(process.cwd(), "packages/shortest/src/index.ts"),
        "@shortest": "./packages",
        // "./node.js": join(loggerPackagePath, "node.js"),
      },
      resolveExtensions: [".ts", ".js", ".mjs"],
      inject: [
        resolve(
          process.cwd(),
          "packages/shortest/src/core/compiler/cjs-shim.ts"
        ),
      ],
      // plugins: [fixNodeImportPlugin],
    });

    return outputPath;
  }

  // loads config file
  async loadModule(filePath: string, cwd: string) {
    const absolutePath = resolve(cwd, filePath);

    if (!existsSync(absolutePath)) {
      throw new Error(`Config file not found: ${filePath}`);
    }

    try {
      const result = await build({
        ...this.defaultOptions,
        entryPoints: [absolutePath],
        write: false,
        external: ["shortest"],
      });

      const code = result.outputFiles[0].text;
      const tempFile = join(this.cacheDir, "config.mjs");
      writeFileSync(tempFile, code);
      return import(`file://${tempFile}`);
    } catch (error) {
      throw new Error(`Failed to load config from ${absolutePath}: ${error}`);
    }
  }
}
