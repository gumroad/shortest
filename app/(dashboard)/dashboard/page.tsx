"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  GitPullRequestDraft,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Edit,
  PlusCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const ReactDiffViewer = dynamic(() => import("react-diff-viewer"), {
  ssr: false,
});

import {
  getAssignedPullRequests,
  commitChangesToPullRequest,
} from "@/lib/github";

interface PullRequest {
  id: number;
  title: string;
  number: number;
  buildStatus: string;
  isDraft: boolean;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
}

export default function DashboardPage() {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingPR, setLoadingPR] = useState<number | null>(null);

  useEffect(() => {
    const fetchAndSetPullRequests = async () => {
      try {
        const data = await getAssignedPullRequests();
        if ("error" in data) {
          setError(data.error as string);
          setPullRequests([]);
        } else {
          setPullRequests(
            data.map((pr) => ({
              ...pr,
              repository: {
                id: parseInt(pr.repoId, 10),
                name: pr.repo,
                full_name: `${pr.owner}/${pr.repo}`,
                owner: {
                  login: pr.owner,
                },
              },
            }))
          );
          setError(null);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching pull requests:", error);
        setLoading(false);
        setError(
          "Failed to fetch pull requests. Please reconnect your GitHub account."
        );
        setPullRequests([]);
      }
    };

    fetchAndSetPullRequests();
  }, []);

  const handleOpenTests = (pr: PullRequest, mode: "write" | "update") => {
    setSelectedPR(pr);
    setAnalyzing(true);
    setLoadingPR(pr.id);

    // Simulating API call to get test files
    // TODO: update this to dynamically generate based on the PR diff and spec file directory
    setTimeout(() => {
      const mockTestFiles: TestFile[] = [];

      if (mode === "write") {
        mockTestFiles.push({
          name: "signup_spec.rb",
          oldContent: "",
          newContent:
            "describe 'Signup' do\n  it 'allows new user to sign up' do\n    # Test code here\n  end\nend",
          isEntirelyNew: true,
        });

        mockTestFiles.push({
          name: "login_spec.rb",
          oldContent:
            "describe 'Login' do\n  it 'allows existing user to log in' do\n    visit '/login'\n    fill_in 'Email', with: 'user@example.com'\n    fill_in 'Password', with: 'password123'\n    click_button 'Log In'\n    expect(page).to have_content('Welcome back!')\n  end\nend",
          newContent:
            "describe 'Login' do\n  it 'allows existing user to log in' do\n    visit '/login'\n    fill_in 'Email', with: 'user@example.com'\n    fill_in 'Password', with: 'password123'\n    click_button 'Log In'\n    expect(page).to have_content('Welcome back!')\n  end\n\n\n  it 'shows error message for invalid credentials' do\n    visit '/login'\n    fill_in 'Email', with: 'user@example.com'\n    fill_in 'Password', with: 'wrongpassword'\n    click_button 'Log In'\n    expect(page).to have_content('Invalid email or password')\n  end\nend",
          isEntirelyNew: false,
        });
      } else if (mode === "update") {
        mockTestFiles.push({
          name: "logic_spec.rb",
          oldContent:
            "describe 'BusinessLogic' do\n  it 'calculates total correctly' do\n    expect(calculate_total(10, 5)).to eq(15)\n  end\n\n  it 'applies discount' do\n    expect(apply_discount(100, 0.1)).to eq(90)\n  end\nend",
          newContent:
            "describe 'BusinessLogic' do\n  it 'calculates total correctly' do\n    expect(calculate_total(10, 5)).to eq(15)\n  end\n\n  it 'applies percentage discount' do\n    expect(apply_percentage_discount(100, 10)).to eq(90)\n  end\n\n  it 'applies flat discount' do\n    expect(apply_flat_discount(100, 10)).to eq(90)\n  end\nend",
          isEntirelyNew: false,
        });
      }

      setTestFiles(mockTestFiles);
      const newSelectedFiles: Record<string, boolean> = {};
      const newExpandedFiles: Record<string, boolean> = {};
      mockTestFiles.forEach((file) => {
        newExpandedFiles[file.name] = true;
        if (mode === "update") {
          newSelectedFiles[file.name] = true;
        }
      });
      setSelectedFiles(newSelectedFiles);
      setExpandedFiles(newExpandedFiles);
      setAnalyzing(false);
      setLoadingPR(null);
    }, 1000);
  };

  const handleReconnectGitHub = async () => {
    try {
      // Redirect to GitHub OAuth flow to get new permissions
      // Make sure NEXT_PUBLIC_GITHUB_CLIENT_ID is properly set in your environment variables
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
      if (!clientId) {
        throw new Error("GitHub Client ID is not set");
      }
      if (!baseUrl) {
        throw new Error("Base URL is not set");
      }
      const redirectUri = `${baseUrl}/api/github/callback`;
      const encodedRedirectUri = encodeURIComponent(redirectUri);
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=repo,user`;
    } catch (error) {
      console.error("Error redirecting to GitHub:", error);
      setError("Failed to redirect to GitHub. Please try again.");
    }
  };

  const handleConfirmChanges = async () => {
    if (!selectedPR) return;

    setLoadingPR(selectedPR.id);
    try {
      const filesToCommit = testFiles.filter(
        (file) => selectedFiles[file.name]
      );
      await commitChangesToPullRequest(selectedPR, filesToCommit);
      // Reset state after successful commit
      setSelectedPR(null);
      setTestFiles([]);
      setSelectedFiles({});
      setExpandedFiles({});
    } catch (error) {
      console.error("Error committing changes:", error);
      setError("Failed to commit changes. Please try again.");
    } finally {
      setLoadingPR(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg mb-4">{error}</p>
        <Button onClick={handleReconnectGitHub}>
          Reconnect GitHub account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6">
        {pullRequests.length > 0 ? (
          <ul className="space-y-8">
            {pullRequests.map((pr) => (
              <li key={pr.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">
                    {pr.repository.full_name}
                  </h3>
                </div>
                <PullRequestItem
                  pullRequest={pr}
                  onOpenTests={handleOpenTests}
                  selectedPR={selectedPR}
                  testFiles={testFiles}
                  selectedFiles={selectedFiles}
                  expandedFiles={expandedFiles}
                  analyzing={analyzing}
                  onFileToggle={(fileName) => {
                    setSelectedFiles((prev) => ({
                      ...prev,
                      [fileName]: !prev[fileName],
                    }));
                    setExpandedFiles((prev) => ({
                      ...prev,
                      [fileName]: !prev[fileName],
                    }));
                  }}
                  onConfirmChanges={handleConfirmChanges}
                  onCancelChanges={() => {
                    setSelectedPR(null);
                    setTestFiles([]);
                    setSelectedFiles({});
                    setExpandedFiles({});
                  }}
                  loadingPR={loadingPR}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No pull requests found.</p>
        )}
      </div>
    </div>
  );
}

interface TestFile {
  name: string;
  oldContent: string;
  newContent: string;
  isEntirelyNew: boolean;
}

function PullRequestItem({
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
}: {
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
}) {
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
            href={`https://github.com/${pullRequest.repository.full_name}/actions/runs/placeholder-run-id`}
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
