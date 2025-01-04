import pc from "picocolors";
import { AssertionError } from "../types";

export type TestStatus = "pending" | "running" | "passed" | "failed";

interface TokenMetrics {
  input: number;
  output: number;
}

interface TestResult {
  name: string;
  status: TestStatus;
  error?: Error;
  tokenUsage?: TokenMetrics;
}

export class Logger {
  private currentFile: string = "";
  private testResults: TestResult[] = [];
  private startTime: number = Date.now();

  // token pricing (Claude 3 Sonnet)
  private readonly COST_PER_1K_INPUT_TOKENS = 0.003;
  private readonly COST_PER_1K_OUTPUT_TOKENS = 0.015;

  startFile(file: string) {
    this.currentFile = file.split("/").pop() || file;
    console.log(pc.blue(`\n📄 ${pc.bold(this.currentFile)}`));
  }

  reportTest(
    name: string | undefined,
    status: "passed" | "failed",
    error?: Error,
    tokenUsage?: TokenMetrics,
  ) {
    const testName = name || "Unnamed Test";
    const symbol = status === "passed" ? "✓" : "✗";
    const color = status === "passed" ? pc.green : pc.red;

    console.log(`  ${color(symbol)} ${testName}`);

    if (tokenUsage) {
      const totalTokens = tokenUsage.input + tokenUsage.output;
      const cost = this.calculateCost(tokenUsage.input, tokenUsage.output);
      console.log(
        pc.dim(
          `    ↳ ${totalTokens.toLocaleString()} tokens ` +
            `(≈ $${cost.toFixed(2)})`,
        ),
      );
    }

    if (error) {
      console.log(pc.red(`    ${error.message}`));
    }

    this.testResults.push({ name: testName, status, error, tokenUsage });
  }

  private calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1000) * this.COST_PER_1K_INPUT_TOKENS;
    const outputCost = (outputTokens / 1000) * this.COST_PER_1K_OUTPUT_TOKENS;
    return Number((inputCost + outputCost).toFixed(3));
  }

  private calculateTotalTokenUsage(): {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
  } {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    this.testResults.forEach((result) => {
      if (result.tokenUsage) {
        totalInputTokens += result.tokenUsage.input;
        totalOutputTokens += result.tokenUsage.output;
      }
    });

    const totalCost = this.calculateCost(totalInputTokens, totalOutputTokens);

    return {
      totalInputTokens,
      totalOutputTokens,
      totalCost,
    };
  }

  private getStatusIcon(status: TestStatus): string {
    switch (status) {
      case "pending":
        return pc.yellow("○");
      case "running":
        return pc.blue("●");
      case "passed":
        return pc.green("✓");
      case "failed":
        return pc.red("✗");
    }
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const totalTests = this.testResults.length;
    const failedTests = this.testResults.filter(
      (t) => t.status === "failed",
    ).length;
    const passedTests = totalTests - failedTests;

    const { totalInputTokens, totalOutputTokens, totalCost } =
      this.calculateTotalTokenUsage();
    const totalTokens = totalInputTokens + totalOutputTokens;

    console.log(pc.dim("⎯".repeat(50)));

    console.log(
      pc.bold("\n Tests "),
      failedTests ? pc.red(`${failedTests} failed`) : "",
      failedTests && passedTests ? " | " : "",
      pc.green(`${passedTests} passed`),
      pc.dim(`(${totalTests})`),
    );

    console.log(pc.bold(" Duration  "), pc.dim(`${duration}s`));
    console.log(
      pc.bold(" Start at  "),
      pc.dim(new Date(this.startTime).toLocaleTimeString()),
    );
    console.log(
      pc.bold(" Tokens    "),
      pc.dim(
        `${totalTokens.toLocaleString()} tokens ` +
          `(≈ $${totalCost.toFixed(2)})`,
      ),
    );
    console.log(pc.dim("\n" + "⎯".repeat(50)));
  }

  allTestsPassed(): boolean {
    return !this.testResults.some((test) => test.status === "failed");
  }

  reportStatus(message: string) {
    console.log(pc.blue(`\n${message}`));
  }

  error(context: string, message: string) {
    console.error(pc.red(`\n${context} Error: ${message}`));
  }

  reportError(context: string, message: string) {
    console.error(pc.red(`\n${context} Error: ${message}`));
  }

  reportAssertion(
    step: string,
    status: "passed" | "failed",
    error?: AssertionError,
  ): void {
    const icon = status === "passed" ? "✓" : "✗";
    const color = status === "passed" ? "green" : "red";

    console.log(pc[color](`${icon} ${step}`));

    if (error && status === "failed") {
      console.log(pc.red(`  Expected: ${error.matcherResult?.expected}`));
      console.log(pc.red(`  Received: ${error.matcherResult?.actual}`));
      console.log(pc.red(`  Message: ${error.message}`));
    }
  }
}
