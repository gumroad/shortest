import { POST } from './route';
import { anthropic } from '@ai-sdk/anthropic';
import { streamObject } from 'ai';
import { createTestFileSchema } from './schema';

jest.mock('@ai-sdk/anthropic');
jest.mock('ai');

describe('POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process the request and return a streamed response', async () => {
    const mockFiles = [
      { path: 'src/component.tsx', content: 'component content' },
      { path: 'lib/util.ts', content: 'util content' }
    ];
    const mockRequest = {
      json: jest.fn().mockResolvedValue({ files: mockFiles })
    };

    const mockStreamObject = jest.fn().mockResolvedValue({
      toTextStreamResponse: jest.fn().mockReturnValue('mocked stream response')
    });
    (streamObject as jest.Mock).mockImplementation(mockStreamObject);

    const result = await POST(mockRequest as unknown as Request);

    expect(mockRequest.json).toHaveBeenCalled();
    expect(streamObject).toHaveBeenCalledWith({
      model: expect.any(Function),
      schema: expect.any(Object),
      prompt: expect.stringContaining('You are an expert software engineer')
    });
    expect(result).toBe('mocked stream response');

    // Verify that the schema is created correctly
    const schemaArg = mockStreamObject.mock.calls[0][0].schema;
    expect(schemaArg).toEqual(createTestFileSchema(mockFiles.length));

    // Verify that the anthropic function is called with the correct model
    const anthropicArg = mockStreamObject.mock.calls[0][0].model;
    expect(anthropicArg).toEqual(anthropic('claude-3-5-sonnet-20240620'));
  });

  it('should handle errors gracefully', async () => {
    const mockRequest = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
    };

    await expect(POST(mockRequest as unknown as Request)).rejects.toThrow('Invalid JSON');
  });
});
