import { exec } from "child_process";

export class BashTool {
  public async execute(command: string): Promise<Record<string, any> | string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Command failed: ${stderr || error.message}`);
          return reject(error.message);
        }

        try {
          // parse if output is JSON
          resolve(JSON.parse(stdout));
        } catch {
          console.warn(`Non-JSON output returned: ${stdout.trim()}`);
          // otherwise return as is
          resolve(stdout.trim());
        }
      });
    });
  }
}
