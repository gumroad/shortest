import { describe, it, expect, vi } from 'vitest';
import { headers } from 'next/headers';

vi.mock("server-only", () => ({}));
import { baseUrl } from './utils-server';

vi.mock('next/headers', () => ({
  headers: vi.fn(),
}));

describe('baseUrl', () => {
  it('should return the correct base URL for development environment', () => {
    vi.mocked(headers).mockReturnValue({
      get: vi.fn().mockReturnValue('localhost:3000'),
    } as any);

    vi.stubEnv('NODE_ENV', 'development');

    expect(baseUrl()).toBe('http://localhost:3000');
  });

  it('should return the correct base URL for production environment', () => {
    vi.mocked(headers).mockReturnValue({
      get: vi.fn().mockReturnValue('example.com'),
    } as any);

    vi.stubEnv('NODE_ENV', 'production');

    expect(baseUrl()).toBe('https://example.com');
  });
});
