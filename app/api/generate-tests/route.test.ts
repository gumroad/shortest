import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';

vi.mock('@ai-sdk/anthropic', () => ({
  anthropic: vi.fn(),
}));

vi.mock('ai', () => ({
  streamObject: vi.fn(),
}));

describe('POST /api/generate-tests', () => {
  it('should handle POST requests correctly', async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        mode: 'write',
        pr_diff: 'mock diff',
        test_files: [],
      }),
    };

    const mockStreamObject = {
      toTextStreamResponse: vi.fn().mockReturnValue(new Response()),
    };

    vi.mocked(streamObject).mockResolvedValue(mockStreamObject);

    const response = await POST(mockRequest as any);

    expect(anthropic).toHaveBeenCalledWith('claude-3-5-sonnet-20240620');
    expect(streamObject).toHaveBeenCalledWith(expect.objectContaining({
      model: expect.any(Function),
      output: 'object',
      schema: expect.any(Object),
      prompt: expect.stringContaining('You are an expert software engineer'),
    }));
    expect(mockStreamObject.toTextStreamResponse).toHaveBeenCalled();
    expect(response).toBeInstanceOf(Response);
  });

  it('should handle errors correctly', async () => {
    const mockRequest = {
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    };

    await expect(POST(mockRequest as any)).rejects.toThrow('Invalid JSON');
  });
});
