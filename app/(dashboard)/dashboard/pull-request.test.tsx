import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PullRequestItem } from './pull-request'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { SWRConfig } from 'swr'

// Mock the hooks and functions
vi.mock('@/hooks/use-log-groups', () => ({
  useLogGroups: vi.fn(() => [])
}))

vi.mock('@/lib/github', () => ({
  commitChangesToPullRequest: vi.fn(),
  getPullRequestInfo: vi.fn(),
  getFailingTests: vi.fn(),
  getLatestRunId: vi.fn(),
  fetchBuildStatus: vi.fn(),
  getWorkflowLogs: vi.fn()
}))

describe('PullRequestItem', () => {
  const mockPullRequest = {
    id: 1,
    title: 'Test PR',
    number: 123,
    repository: {
      owner: {
        login: 'testOwner'
      },
      name: 'testRepo'
    },
    buildStatus: 'success'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the pull request information correctly', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem initialPullRequest={mockPullRequest} />
      </SWRConfig>
    )

    expect(screen.getByText('Test PR')).toBeInTheDocument()
    expect(screen.getByText('#123')).toBeInTheDocument()
  })

  it('displays running build status', async () => {
    const runningPR = { ...mockPullRequest, buildStatus: 'running' }
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem initialPullRequest={runningPR} />
      </SWRConfig>
    )

    expect(screen.getByText('Running')).toBeInTheDocument()
  })

  it('disables buttons when build is running', async () => {
    const runningPR = { ...mockPullRequest, buildStatus: 'running' }
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem initialPullRequest={runningPR} />
      </SWRConfig>
    )

    expect(screen.getByText('Update Tests')).toBeDisabled()
    expect(screen.getByText('Write Tests')).toBeDisabled()
  })

  it('updates build status periodically', async () => {
    const { fetchBuildStatus } = require('@/lib/github')
    fetchBuildStatus.mockResolvedValueOnce('success').mockResolvedValueOnce('failure')

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem initialPullRequest={mockPullRequest} />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(fetchBuildStatus).toHaveBeenCalledTimes(2)
    })
  })

  it('triggers revalidation after committing changes', async () => {
    const { commitChangesToPullRequest } = require('@/lib/github')
    commitChangesToPullRequest.mockResolvedValue('Success')

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem initialPullRequest={mockPullRequest} />
      </SWRConfig>
    )

    fireEvent.click(screen.getByText('Update Tests'))
    await waitFor(() => {
      expect(commitChangesToPullRequest).toHaveBeenCalled()
    })
  })

  it('shows and hides logs when toggle is clicked', async () => {
    const { getLatestRunId, getWorkflowLogs } = require('@/lib/github')
    getLatestRunId.mockResolvedValue('123')
    getWorkflowLogs.mockResolvedValue('Test logs')

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PullRequestItem initialPullRequest={mockPullRequest} />
      </SWRConfig>
    )

    const toggleButton = screen.getByText('Show Logs')
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(screen.getByText('Hide Logs')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Hide Logs'))
    expect(screen.getByText('Show Logs')).toBeInTheDocument()
  })
})