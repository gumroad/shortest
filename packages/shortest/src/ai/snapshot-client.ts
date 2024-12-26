import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AIClient, IAIClient } from './client';
import { BrowserTool } from '../browser/core/browser-tool';
import { ActionInput } from '../types/browser';
import { TestContext } from '../types/test';
import Anthropic from '@anthropic-ai/sdk';
import { sleep } from '@anthropic-ai/sdk/core';
import pc from 'picocolors';
import { JUGDEMENT_SYSTEM_PROMPT } from './prompts';


export class SnapshotAIClient implements IAIClient {
  private client: Anthropic;
  private aiClient: AIClient;
  private snapshotDir: string;

  constructor(aiClient: AIClient) {
    this.aiClient = aiClient;
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    });
    this.snapshotDir = join(process.cwd(), '.shortest', 'snapshots');
  }

  async processAction(prompt: string, browserTool: BrowserTool): Promise<{
    finalResponse: Anthropic.Beta.Messages.BetaMessage;
    messages: Anthropic.Beta.Messages.BetaMessageParam[];
  } | null> {
    // Try to get test context and name
    const testContext = (browserTool as any).testContext as TestContext;
    const testName = testContext?.currentTest?.name;

    if (!testName) {
      return this.aiClient.processAction(prompt, browserTool) as any;
    }

    const snapshotPath = join(this.snapshotDir, `${testName}.test.snapshot.jsonl`);

    if (!existsSync(snapshotPath)) {
      return this.aiClient.processAction(prompt, browserTool) as any;
    }

    try {
      // Read and parse the snapshot file
      const actions = readFileSync(snapshotPath, 'utf-8')
        .split('\n')
        .filter(Boolean)
        .map(line => JSON.parse(line) as ActionInput);

      console.log(pc.cyan('\n📼 Replaying recorded actions...'));
      
      // Execute each recorded action
      for (const action of actions) {
        if (action.action === 'screenshot') {
          continue;
        }
        await browserTool.execute(action);
        await sleep(500);
      }

      // Get final state
      const finalState = await browserTool.execute({ action: 'screenshot' });
      
      // Prepare judgment prompt
      const judgmentPrompt = [
        `Test: "${testName}"`,
        prompt ? `Original Instructions: ${prompt}` : '',
        '\nFinal Page State:',
        `URL: ${finalState.metadata?.window_info?.url || 'unknown'}`,
        `Title: ${finalState.metadata?.window_info?.title || 'unknown'}`,
        '\nPlease evaluate if the test passed or failed.'
      ].filter(Boolean).join('\n');

      // Get judgment from Claude
      const response = await this.client.beta.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: judgmentPrompt
        }],
        system: JUGDEMENT_SYSTEM_PROMPT
      });

      return {
        messages: [response],
        finalResponse: response
      };

    } catch (error) {
      console.warn(`Failed to replay snapshot for ${testName}, falling back to AI:`, error);
      return this.aiClient.processAction(prompt, browserTool) as any;
    }
  }
} 