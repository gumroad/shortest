import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PullRequestItem } from './pull-request';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PullRequest, TestFile } from './types';
import { generateTestsResponseSchema } from "@/app/api/generate-tests/schema";

vi.mock('@/lib/github', () => ({
  getPullRequestInfo: vi.fn(),
  commitChangesToPullRequest: vi.fn(),
  getFailingTests: vi.fn(),
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
  });

  it('renders the pull request information correctly', () => {
    render(<PullRequestItem pullRequest={mockPullRequest} />);
    expect(screen.getByText('Test PR')).toBeInTheDocument();
    expect(screen.getByText('#123')).toBeInTheDocument();
    expect(screen.getByText('Build: success')).toBeInTheDocument();
  });

  it('handles "Write new tests" button click for successful build', async () => {
    const { getPullRequestInfo } = await import('@/lib/github');
    vi.mocked(getPullRequestInfo).mockResolvedValue({
      diff: 'mock diff',
      testFiles: [{ name: 'test.ts', content: 'test content' }],
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'generated_test.ts', content: 'generated content' }]),
    } as Response);

    render(<PullRequestItem pullRequest={{ ...mockPullRequest, buildStatus: 'success' }} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(screen.getByText('Analyzing PR diff...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('generated_test.ts')).toBeInTheDocument();
      expect(screen.getByTestId('react-diff-viewer')).toBeInTheDocument();
    });
  });

  it('handles "Update tests to fix" button click for failed build', async () => {
    const failedPR = { ...mockPullRequest, buildStatus: 'failure' };
    const { getPullRequestInfo, getFailingTests } = await import('@/lib/github');
    vi.mocked(getPullRequestInfo).mockResolvedValue({
      diff: 'mock diff',
      testFiles: [
        { name: 'test1.ts', content: 'test content 1' },
        { name: 'test2.ts', content: 'test content 2' },
      ],
    });
    vi.mocked(getFailingTests).mockResolvedValue([
      { name: 'test1.ts', content: 'failing test content' },
    ]);

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'test1.ts', content: 'fixed content' }]),
    } as Response);

    render(<PullRequestItem pullRequest={failedPR} />);
    const updateTestsButton = screen.getByText('Update tests to fix');
    fireEvent.click(updateTestsButton);

    await waitFor(() => {
      expect(screen.getByText('Analyzing PR diff...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('test1.ts')).toBeInTheDocument();
      expect(screen.queryByText('test2.ts')).not.toBeInTheDocument();
      expect(screen.getByTestId('react-diff-viewer')).toBeInTheDocument();
    });
  });

  it('handles errors when generating tests', async () => {
    const { getPullRequestInfo } = await import('@/lib/github');
    vi.mocked(getPullRequestInfo).mockResolvedValue({
      diff: 'mock diff',
      testFiles: [{ name: 'test.ts', content: 'test content' }],
    });

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to generate test files.')).toBeInTheDocument();
    });
  });

  it('handles committing changes', async () => {
    const { commitChangesToPullRequest } = await import('@/lib/github');
    vi.mocked(commitChangesToPullRequest).mockResolvedValue('https://github.com/commit/123');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'generated_test.ts', content: 'generated content' }]),
    } as Response);

    const { useToast } = await import('@/hooks/use-toast');
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });

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
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Changes committed successfully',
      }));
    });
  });

  it('handles canceling changes', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'generated_test.ts', content: 'generated content' }]),
    } as Response);

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(screen.getByText('generated_test.ts')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(screen.queryByText('generated_test.ts')).not.toBeInTheDocument();
  });

  it('handles file toggle', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'generated_test.ts', content: 'generated content' }]),
    } as Response);

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(screen.getByText('generated_test.ts')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
  });

  it('disables commit button when no files are selected', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'generated_test.ts', content: 'generated content' }]),
    } as Response);

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(screen.getByText('generated_test.ts')).toBeInTheDocument();
    });

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    const commitButton = screen.getByText('Commit changes');
    expect(commitButton).toBeDisabled();
  });

  it('handles errors when committing changes', async () => {
    const { commitChangesToPullRequest } = await import('@/lib/github');
    vi.mocked(commitChangesToPullRequest).mockRejectedValue(new Error('Commit failed'));

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'generated_test.ts', content: 'generated content' }]),
    } as Response);

    const { useToast } = await import('@/hooks/use-toast');
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(screen.getByText('generated_test.ts')).toBeInTheDocument();
    });

    const commitButton = screen.getByText('Commit changes');
    fireEvent.click(commitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to commit changes. Please try again.')).toBeInTheDocument();
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Error',
        description: 'Failed to commit changes. Please try again.',
        variant: 'destructive',
      }));
    });
  });

  it('displays pending build status', () => {
    const pendingPR = { ...mockPullRequest, buildStatus: 'pending' };
    render(<PullRequestItem pullRequest={pendingPR} />);
    expect(screen.getByText('Build: pending')).toBeInTheDocument();
  });

  it('disables buttons when loading', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => new Promise(resolve => setTimeout(() => resolve([]), 100)),
    } as Response);

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(writeTestsButton).toBeDisabled();
    });
  });

  it('handles committing changes with custom message', async () => {
    const { commitChangesToPullRequest } = await import('@/lib/github');
    vi.mocked(commitChangesToPullRequest).mockResolvedValue('https://github.com/commit/123');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ name: 'generated_test.ts', content: 'generated content' }]),
    } as Response);

    const { useToast } = await import('@/hooks/use-toast');
    const mockToast = vi.fn();
    vi.mocked(useToast).mockReturnValue({ toast: mockToast });

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    fireEvent.click(writeTestsButton);

    await waitFor(() => {
      expect(screen.getByText('generated_test.ts')).toBeInTheDocument();
    });

    const commitMessageInput = screen.getByPlaceholderText('Update test files');
    fireEvent.change(commitMessageInput, { target: { value: 'Custom commit message' } });

    const commitButton = screen.getByText('Commit changes');
    fireEvent.click(commitButton);

    await waitFor(() => {
      expect(commitChangesToPullRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'Custom commit message'
      );
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Changes committed successfully',
      }));
    });
  });
});