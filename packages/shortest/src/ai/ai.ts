import Anthropic from '@anthropic-ai/sdk';
import { AIConfig, AIResponse } from './types';
import { SYSTEM_PROMPT } from './prompts';

export class AIClient {
  private client: Anthropic;
  private model: string;

  constructor(config: AIConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.model = config.model || 'claude-3-sonnet-20240229';
  }

  async processTest(testPrompt: string): Promise<AIResponse> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: testPrompt
        }],
        system: SYSTEM_PROMPT,
        temperature: 0
      });

      // Extract JSON from markdown response
      const text = response.content[0].text;
      const jsonMatch = text.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      // Clean up the JSON string before parsing
      const jsonStr = jsonMatch[1]
        .replace(/\n/g, '')  // Remove newlines
        .replace(/\r/g, '')  // Remove carriage returns
        .trim();             // Remove extra whitespace

      return JSON.parse(jsonStr) as AIResponse;

    } catch (error) {
      throw new Error(`AI Processing failed: ${error}`);
    }
  }
}
