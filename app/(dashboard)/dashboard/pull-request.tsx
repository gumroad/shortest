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
}

export function PullRequestItem({ pullRequest }: PullRequestItemProps) {
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
  const handleConfirmChanges = async () => {
    if (!selectedPR) return;

    setLoadingPR(selectedPR.id);
    try {
      const filesToCommit = testFiles.filter(
        (file) => selectedFiles[file.name]
      );
      // TODO: await commitChangesToPullRequest(selectedPR, filesToCommit);
      // Reset state after successful commit
      setSelectedPR(null);
      setTestFiles([]);
      setSelectedFiles({});
      setExpandedFiles({});
    } catch (error) {
      console.error("Error committing changes:", error);
      // Handle error (e.g., show an error message to the user)
    } finally {
      setLoadingPR(null);
    }
  };

  const handleCancelChanges = () => {
    setSelectedPR(null);
    setTestFiles([]);
    setSelectedFiles({});
    setExpandedFiles({});
  };

  const handleFileToggle = (fileName: string) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
    setExpandedFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

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
            onClick={handleCancelChanges}
            disabled={isLoading}
          >
            Cancel
          </Button>
        ) : pullRequest.buildStatus === "success" ? (
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => handleOpenTests(pullRequest, "write")}
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
            onClick={() => handleOpenTests(pullRequest, "update")}
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
                        onCheckedChange={() => handleFileToggle(file.name)}
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
                onClick={handleConfirmChanges}
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
