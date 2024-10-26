import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PullRequestItem } from './pull-request'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { SWRConfig } from 'swr'

// Mock the hooks and functions
vi.mock('@/hooks/use-log-groups', () => ({
  useLogGroups: vi.fn(() => [])
}))

// Mock the entire @/lib/github module
vi.mock('@/lib/github', () => ({
  commitChangesToPullRequest: vi.fn(),
  getPullRequestInfo: vi.fn(),
  getFailingTests: vi.fn(),
  getLatestRunId: vi.fn(),
  fetchBuildStatus: vi.fn(),
  getWorkflowLogs: vi.fn()
}))

// Import the mocked functions
import { fetchBuildStatus, getLatestRunId, getWorkflowLogs } from '@/lib/github'

describe('PullRequestItem', () => {
  const mockPullRequest = {
    id: 1,
    title: 'Test PR',
    number: 123,
    repository: {
      id: 456,
      owner: {
        login: 'testOwner'
      },
      name: 'testRepo',
      full_name: 'testOwner/testRepo'
    },
    buildStatus: 'success',
    branchName: 'test-branch',
    isDraft: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the pull request information correctly', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem pullRequest={mockPullRequest} />
      </SWRConfig>
    )

    expect(screen.getByText('Test PR')).toBeInTheDocument()
    expect(screen.getByText('#123')).toBeInTheDocument()
  })

  it('displays running build status', async () => {
    const runningPR = { ...mockPullRequest, buildStatus: 'running' }
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem pullRequest={runningPR} />
      </SWRConfig>
    )

    expect(screen.getByText('Build: Running')).toBeInTheDocument()
  })

  it('disables buttons when build is running', async () => {
    const runningPR = { ...mockPullRequest, buildStatus: 'running' }
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem pullRequest={runningPR} />
      </SWRConfig>
    )

    expect(screen.getByText('Running...')).toBeDisabled()
  })

  it('updates build status periodically', async () => {
    const mockedFetchBuildStatus = vi.mocked(fetchBuildStatus)
    mockedFetchBuildStatus.mockResolvedValueOnce({ ...mockPullRequest, buildStatus: 'success' })
      .mockResolvedValueOnce({ ...mockPullRequest, buildStatus: 'failure' })

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem pullRequest={mockPullRequest} />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(mockedFetchBuildStatus).toHaveBeenCalledTimes(1)
    })
  })

  it('shows and hides logs when toggle is clicked', async () => {
    const mockedGetLatestRunId = vi.mocked(getLatestRunId)
    const mockedGetWorkflowLogs = vi.mocked(getWorkflowLogs)

    mockedGetLatestRunId.mockResolvedValue('123')
    mockedGetWorkflowLogs.mockResolvedValue('Test logs')

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem pullRequest={{ ...mockPullRequest, buildStatus: 'success', isDraft: false }} />
      </SWRConfig>
    )

    // Simulate clicking the "Show Logs" button
    const showLogsButton = await screen.findByText('Show Logs')
    fireEvent.click(showLogsButton)

    await waitFor(() => {
      expect(screen.getByText('Hide Logs')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Hide Logs'))
    expect(screen.getByText('Show Logs')).toBeInTheDocument()
  })

  it('sends the selected AI model to the backend', async () => {
    const mockGenerateTests = vi.fn().mockResolvedValue({ testFiles: [] });
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ testFiles: [] }),
    } as Response);

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem pullRequest={mockPullRequest} />
      </SWRConfig>
    );

    const selectElement = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(selectElement, { target: { value: 'gpt-4' } });

    const generateTestsButton = await screen.findByText('Generate Tests');
    fireEvent.click(generateTestsButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/generate-tests', expect.objectContaining({
        body: JSON.stringify({
          mode: 'write',
          pr_diff: '',
          test_files: [],
          test_logs: '',
          ai_model: 'gpt-4',
        }),
      }));
    });
  });
})
