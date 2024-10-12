import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PullRequestItem } from './pull-request';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PullRequest } from './types';
import useSWR from 'swr';

vi.mock('@/lib/github', () => ({
  getPullRequestInfo: vi.fn(),
  commitChangesToPullRequest: vi.fn(),
  getFailingTests: vi.fn(),
  fetchBuildStatus: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('react-diff-viewer', () => ({
  default: () => <div data-testid="react-diff-viewer">Mocked Diff Viewer</div>,
}));

vi.mock('swr', () => ({
  default: vi.fn(),
}));

describe('PullRequestItem', () => {
  const mockPullRequest: PullRequest = {
    id: 1,
    title: 'Test PR',
    number: 123,
    buildStatus: 'success',
    isDraft: false,
    branchName: 'feature-branch',
    repository: {
      id: 1,
      name: 'test-repo',
      full_name: 'owner/test-repo',
      owner: {
        login: 'owner',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    vi.mocked(useSWR).mockReturnValue({
      data: mockPullRequest,
      mutate: vi.fn(),
    });
  });

  it('renders the pull request information correctly', () => {
    render(<PullRequestItem pullRequest={mockPullRequest} />);
    expect(screen.getByText('Test PR')).toBeInTheDocument();
    expect(screen.getByText('#123')).toBeInTheDocument();
    expect(screen.getByText('Build: success')).toBeInTheDocument();
  });

  it('displays running build status', () => {
    const runningPR = { ...mockPullRequest, buildStatus: 'running' };
    vi.mocked(useSWR).mockReturnValue({
      data: runningPR,
      mutate: vi.fn(),
    });
    render(<PullRequestItem pullRequest={runningPR} />);
    expect(screen.getByText('Build: Running')).toBeInTheDocument();
    expect(screen.getByText('Running...')).toBeInTheDocument();
  });

  it('disables buttons when build is running', () => {
    const runningPR = { ...mockPullRequest, buildStatus: 'running' };
    vi.mocked(useSWR).mockReturnValue({
      data: runningPR,
      mutate: vi.fn(),
    });
    render(<PullRequestItem pullRequest={runningPR} />);
    expect(screen.getByText('Write new tests')).toBeDisabled();
  });

  it('updates build status periodically', async () => {
    const mutate = vi.fn();
    vi.mocked(useSWR).mockReturnValue({
      data: mockPullRequest,
      mutate,
    });
    render(<PullRequestItem pullRequest={mockPullRequest} />);
    
    await waitFor(() => {
      expect(useSWR).toHaveBeenCalledWith(
        `pullRequest-${mockPullRequest.id}`,
        expect.any(Function),
        expect.objectContaining({
          fallbackData: mockPullRequest,
          refreshInterval: 10000,
        })
      );
    });
  });

  it('triggers revalidation after committing changes', async () => {
    const { commitChangesToPullRequest } = await import('@/lib/github');
    vi.mocked(commitChangesToPullRequest).mockResolvedValue('https://github.com/commit/123');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'generated_test.ts', content: 'generated content' }]),
    } as Response);

    const mutate = vi.fn();
    vi.mocked(useSWR).mockReturnValue({
      data: mockPullRequest,
      mutate,
    });

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(screen.getByText('generated_test.ts')).toBeInTheDocument();
    });

    const commitButton = screen.getByText('Commit changes');
    fireEvent.click(commitButton);

    await waitFor(() => {
      expect(commitChangesToPullRequest).toHaveBeenCalled();
      expect(mutate).toHaveBeenCalled();
    });
  });

  // Include all other existing tests here...
});
