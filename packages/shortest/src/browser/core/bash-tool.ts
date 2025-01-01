import { exec } from "child_process";

export class BashTool {
  public async execute(command: string): Promise<Record<string, any> | string> {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, _stderr) => {
        if (error) {
          reject(error.message);
        }

        try {
          // parse if output is JSON
          resolve(JSON.parse(stdout));
        } catch (error: any) {
          console.error(`Error parsing JSON: ${error.message}`);
          // otherwise return as is
          return stdout;
        }
      });
    });
  }
}
