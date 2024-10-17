'use client'

import { useRef, useMemo, useState } from 'react'
import { Loader2, ChevronRight, ChevronDown } from 'lucide-react'
import { getWorkflowLogs } from '@/lib/github'
import useSWR from 'swr'
import { LogViewProps, LogGroup } from './types'


export function LogView({ owner, repo, runId }: LogViewProps) {
  const logContainerRef = useRef<HTMLDivElement>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const { data: logs, error, isLoading } = useSWR(
    runId ? ['workflowLogs', owner, repo, runId] : null,
    () => getWorkflowLogs(owner, repo, runId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const parsedLogs = useMemo(() => {
    if (!logs) return [];

    const groups: LogGroup[] = [];
    let currentGroup: LogGroup | null = null;
    const lines = logs.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/, '');
      if (line.startsWith('File:')) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          id: `group-${groups.length}`,
          name: line.trim(),
          logs: []
        };
      } else if (currentGroup) {
        currentGroup.logs.push(line);
      } else {
        if (!groups.length || groups[groups.length - 1].name !== 'Other') {
          groups.push({ id: `group-${groups.length}`, name: 'Other', logs: [] });
        }
        groups[groups.length - 1].logs.push(line);
      }
    }

    if (currentGroup) {
      groups.push(currentGroup);
    }

    // Add line numbers and trim group names
    return groups.map(group => ({
      ...group,
      name: group.name
        .replace(/^File:\s*/, '')
        .replace(/^.*?_/, '')
        .replace(/\.txt$/, '')
        .split('/')[0],
      logs: group.logs.map((log, index) => `${(index + 1).toString().padStart(4, ' ')} | ${log}`)
    }));
  }, [logs]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Loading logs...</span>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-500">Error loading logs: {error.message}</div>
  }

  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-2 bg-gray-800">
        <h3 className="text-sm font-semibold">Logs</h3>
      </div>
      <div ref={logContainerRef} className="h-96 overflow-y-auto p-4 font-mono text-sm">
        {parsedLogs.map((group) => (
          <div key={group.id} className="mb-4">
            <button
              onClick={() => toggleGroup(group.id)}
              className="flex items-center text-left w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded"
            >
              {expandedGroups[group.id] ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              <span className="font-semibold">{group.name}</span>
            </button>
            {expandedGroups[group.id] && (
              <pre className="whitespace-pre-wrap mt-2 pl-6 border-l-2 border-gray-700">
                {group.logs.join('\n')}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
