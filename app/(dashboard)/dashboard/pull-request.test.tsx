import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PullRequestItem } from './pull-request';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PullRequest } from './types';
import useSWR from 'swr';
import { fetchBuildStatus } from '@/lib/github';
import { experimental_useObject as useObject } from 'ai/react';

vi.mock('@/lib/github', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    getPullRequestInfo: vi.fn(),
    commitChangesToPullRequest: vi.fn(),
    getFailingTests: vi.fn(),
    fetchBuildStatus: vi.fn(),
  };
});

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

vi.mock('ai/react', () => ({
  experimental_useObject: vi.fn(),
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
      error: undefined,
      isValidating: false,
      isLoading: false,
    });
    vi.mocked(useObject).mockReturnValue({
      object: null,
      submit: vi.fn(),
      isLoading: false,
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
      error: undefined,
      isValidating: false,
      isLoading: false,
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
      error: undefined,
      isValidating: false,
      isLoading: false,
    });
    render(<PullRequestItem pullRequest={runningPR} />);
    expect(screen.getByText('Running...')).toBeDisabled();
  });

  it('updates build status periodically', async () => {
    const mutate = vi.fn();
    const fetchBuildStatusMock = vi.fn().mockResolvedValue(mockPullRequest);
    vi.mocked(fetchBuildStatus).mockImplementation(fetchBuildStatusMock);
    
    vi.mocked(useSWR).mockImplementation((key, fetcher, options) => {
      // Call the fetcher function to simulate SWR behavior
      fetcher();
      return {
        data: mockPullRequest,
        mutate,
        error: undefined,
        isValidating: false,
        isLoading: false,
      };
    });

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    
    await waitFor(() => {
      expect(useSWR).toHaveBeenCalledWith(
        `pullRequest-${mockPullRequest.id}`,
        expect.any(Function),
        expect.objectContaining({
          fallbackData: mockPullRequest,
          refreshInterval: expect.any(Number),
          onSuccess: expect.any(Function),
        })
      );
    });

    // Verify that fetchBuildStatus is called with the correct parameters
    expect(fetchBuildStatusMock).toHaveBeenCalledWith(
      mockPullRequest.repository.owner.login,
      mockPullRequest.repository.name,
      mockPullRequest.number
    );
  });

  it('triggers test generation when clicking Write new tests button', async () => {
    const submitMock = vi.fn();
    vi.mocked(useObject).mockReturnValue({
      object: null,
      submit: submitMock,
      isLoading: false,
    });

    render(<PullRequestItem pullRequest={mockPullRequest} />);
    const writeTestsButton = screen.getByText('Write new tests');
    
    await act(async () => {
      fireEvent.click(writeTestsButton);
    });

    expect(submitMock).toHaveBeenCalledWith(expect.objectContaining({
      mode: 'write',
      pr_id: mockPullRequest.id,
      pr_diff: expect.any(String),
      test_files: expect.any(Array),
    }));
  });

  it('updates test files when useObject returns new tests', async () => {
    const mockTests = [
      { name: 'test1.ts', content: 'test content 1' },
      { name: 'test2.ts', content: 'test content 2' },
    ];

    vi.mocked(useObject).mockReturnValue({
      object: { tests: mockTests },
      submit: vi.fn(),
      isLoading: false,
    });

    render(<PullRequestItem pullRequest={mockPullRequest} />);

    await waitFor(() => {
      expect(screen.getByText('test1.ts')).toBeInTheDocument();
      expect(screen.getByText('test2.ts')).toBeInTheDocument();
    });
  });

  it('handles commit changes correctly', async () => {
    const commitChangesToPullRequestMock = vi.fn().mockResolvedValue('https://github.com/commit/123');
    vi.mocked(commitChangesToPullRequest).mockImplementation(commitChangesToPullRequestMock);

    const mutateMock = vi.fn();
    vi.mocked(useSWR).mockReturnValue({
      data: mockPullRequest,
      mutate: mutateMock,
      error: undefined,
      isValidating: false,
      isLoading: false,
    });

    vi.mocked(useObject).mockReturnValue({
      object: { tests: [{ name: 'test1.ts', content: 'test content 1' }] },
      submit: vi.fn(),
      isLoading: false,
    });

    render(<PullRequestItem pullRequest={mockPullRequest} />);

    const commitMessageInput = screen.getByPlaceholderText('Update test files');
    fireEvent.change(commitMessageInput, { target: { value: 'Update tests' } });

    const commitButton = screen.getByText('Commit changes');
    await act(async () => {
      fireEvent.click(commitButton);
    });

    expect(commitChangesToPullRequestMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      'Update tests',
      [{ name: 'test1.ts', content: 'test content 1' }]
    );
    expect(mutateMock).toHaveBeenCalled();
  });
});