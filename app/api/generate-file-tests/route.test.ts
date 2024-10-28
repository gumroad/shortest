import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from './route';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { createTestFileSchema } from './schema';

vi.mock('@ai-sdk/anthropic');
vi.mock('ai');

describe('POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle errors gracefully', async () => {
    const mockRequest = {
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
    };

    await expect(POST(mockRequest as unknown as Request)).rejects.toThrow('Invalid JSON');
  });
});
