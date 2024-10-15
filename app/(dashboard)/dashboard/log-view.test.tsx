import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LogView } from './log-view'
import { getWorkflowLogs } from '@/lib/github'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { SWRConfig } from 'swr'

vi.mock('@/lib/github', () => ({
  getWorkflowLogs: vi.fn(),
}))

const mockLogs = `
2023-05-01T12:00:00.000Z File: test/file1.txt
Line 1 of file 1
Line 2 of file 1
2023-05-01T12:01:00.000Z File: test/file2.txt
Line 1 of file 2
Line 2 of file 2
2023-05-01T12:02:00.000Z Some other log
`

describe('LogView', () => {
  const defaultProps = {
    owner: 'testOwner',
    repo: 'testRepo',
    runId: '123',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    render(<LogView {...defaultProps} />)
    expect(screen.getByText('Loading logs...')).toBeInTheDocument()
  })

  it('renders error state', async () => {
    vi.mocked(getWorkflowLogs).mockRejectedValue(new Error('Test error'))

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <LogView {...defaultProps} />
      </SWRConfig>
    )

    await waitFor(() => {
      expect(screen.getByText('Error loading logs: Test error')).toBeInTheDocument()
    })
  })

  it('renders logs and groups correctly', async () => {
    vi.mocked(getWorkflowLogs).mockResolvedValue(mockLogs)

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <LogView {...defaultProps} />
      </SWRConfig>
    )

    await waitFor(() => {
      const testElements = screen.getAllByText('test')
      expect(testElements.length).toBeGreaterThan(0)
      expect(screen.getByText('Other')).toBeInTheDocument()
    })
  })

  it('expands and collapses log groups', async () => {
    vi.mocked(getWorkflowLogs).mockResolvedValue(mockLogs)

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <LogView {...defaultProps} />
      </SWRConfig>
    )

    await waitFor(() => {
      const testElements = screen.getAllByText('test')
      expect(testElements.length).toBeGreaterThan(0)
    })

    // Expand the first group
    const testButtons = screen.getAllByText('test')
    fireEvent.click(testButtons[0])

    expect(screen.getByText(/1 \| Line 1 of file 1/)).toBeInTheDocument()
    expect(screen.getByText(/2 \| Line 2 of file 1/)).toBeInTheDocument()

    // Collapse the first group
    fireEvent.click(testButtons[0])

    expect(screen.queryByText(/1 \| Line 1 of file 1/)).not.toBeInTheDocument()
    expect(screen.queryByText(/2 \| Line 2 of file 1/)).not.toBeInTheDocument()
  })

  it('does not fetch logs when runId is null', () => {
    render(<LogView owner="testOwner" repo="testRepo" runId={null} />)
    expect(getWorkflowLogs).not.toHaveBeenCalled()
  })
})
