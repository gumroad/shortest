import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  GitPullRequestDraft,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Edit,
  PlusCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";
import { PullRequest, TestFile } from "./types";

const ReactDiffViewer = dynamic(() => import("react-diff-viewer"), {
  ssr: false,
});

interface PullRequestItemProps {
  pullRequest: PullRequest;
  onOpenTests: (pr: PullRequest, mode: "write" | "update") => void;
  selectedPR: PullRequest | null;
  testFiles: TestFile[];
  selectedFiles: Record<string, boolean>;
  expandedFiles: Record<string, boolean>;
  analyzing: boolean;
  onFileToggle: (fileName: string) => void;
  onConfirmChanges: () => void;
  onCancelChanges: () => void;
  loadingPR: number | null;
}

export function PullRequestItem({
  pullRequest,
  onOpenTests,
  selectedPR,
  testFiles,
  selectedFiles,
  expandedFiles,
  analyzing,
  onFileToggle,
  onConfirmChanges,
  onCancelChanges,
  loadingPR,
}: PullRequestItemProps) {
  const isLoading = loadingPR === pullRequest.id;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center">
          {pullRequest.isDraft ? (
            <GitPullRequestDraft className="mr-2 h-4 w-4 text-gray-400" />
          ) : (
            <GitPullRequest className="mr-2 h-4 w-4" />
          )}
          <span className="font-medium">{pullRequest.title}</span>
        </span>
        <Link
          href={`https://github.com/${pullRequest.repository.full_name}/pull/${pullRequest.number}`}
          className="text-sm text-gray-600 underline"
        >
          #{pullRequest.number}
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <span className="flex items-center">
          {pullRequest.buildStatus === "success" ? (
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="mr-2 h-4 w-4 text-red-500" />
          )}
          <Link
            href={`https://github.com/${pullRequest.repository.full_name}/pull/${pullRequest.number}/checks`}
            className="text-sm underline text-gray-600"
          >
            Build: {pullRequest.buildStatus}
          </Link>
        </span>
        {selectedPR && selectedPR.id === pullRequest.id ? (
          <Button
            size="sm"
            className="bg-white hover:bg-gray-100 text-black border border-gray-200"
            onClick={onCancelChanges}
            disabled={isLoading}
          >
            Cancel
          </Button>
        ) : pullRequest.buildStatus === "success" ? (
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => onOpenTests(pullRequest, "write")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PlusCircle className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Loading..." : "Write new tests"}
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
            onClick={() => onOpenTests(pullRequest, "update")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Edit className="mr-2 h-4 w-4" />
            )}
            {isLoading ? "Loading..." : "Update tests to fix"}
          </Button>
        )}
      </div>
      {selectedPR && selectedPR.id === pullRequest.id && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Test Files</h4>
          {analyzing ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Analyzing PR diff...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {testFiles.map((file) => (
                <div key={file.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Checkbox
                        id={file.name}
                        checked={selectedFiles[file.name]}
                        onCheckedChange={() => onFileToggle(file.name)}
                      />
                      <label
                        htmlFor={file.name}
                        className="ml-2 font-medium cursor-pointer"
                      >
                        {file.name}
                      </label>
                      {file.isEntirelyNew && (
                        <Badge variant="outline" className="ml-2">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  {expandedFiles[file.name] && (
                    <div className="mt-2">
                      <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                        <ReactDiffViewer
                          oldValue={file.oldContent || ""}
                          newValue={file.newContent || ""}
                          splitView={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Button
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={onConfirmChanges}
                disabled={
                  Object.values(selectedFiles).every((value) => !value) ||
                  isLoading
                }
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Committing Changes..." : "Commit Changes"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
