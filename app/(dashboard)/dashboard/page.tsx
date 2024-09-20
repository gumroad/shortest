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
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const ReactDiffViewer = dynamic(() => import("react-diff-viewer"), {
  ssr: false,
});

import { getGitHubRepos, getGitHubPullRequests } from "@/lib/github";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
  };
  isMonitoring?: boolean;
}

export default function DashboardPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchAndSetRepos = async () => {
      try {
        const data = await getGitHubRepos();
        if ("error" in data) {
          setError(data.error);
          setRepos([]);
        } else {
          setRepos(data);
          setError(null);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching repos:", error);
        setLoading(false);
        setError(
          "Failed to fetch repositories. Please reconnect your GitHub account."
        );
        setRepos([]);
      }
    };

    fetchAndSetRepos();
    const interval = setInterval(fetchAndSetRepos, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenTests = (pr: PullRequest, mode: "write" | "update") => {
    setSelectedPR(pr);
    setAnalyzing(true);
    setLoading(true);

    // Simulating API call to get test files
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
      setLoading(false);
    }, 1000);
  };

  const handleRemoveRepo = (repoId: number) => {
    setRepos((prevRepos) => prevRepos.filter((repo) => repo.id !== repoId));
  };

  const handleAddRepo = (repoName: string) => {
    setRepos((prevRepos) =>
      prevRepos.map((repo) =>
        repo.name === repoName ? { ...repo, isMonitoring: true } : repo
      )
    );
    setIsAddingRepo(false);
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

  const handleConfirmChanges = () => {
    // TODO: Implement logic to push changes as a commit to the pull request branch
    console.log("Confirming changes:", selectedFiles);
    setSelectedPR(null);
    setTestFiles([]);
    setSelectedFiles({});
    setExpandedFiles({});
  };

  const handleCancelChanges = () => {
    setSelectedPR(null);
    setTestFiles([]);
    setSelectedFiles({});
    setExpandedFiles({});
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
        {Array.isArray(repos) && repos.length > 0 ? (
          <ul className="space-y-8">
            {repos.map((repo) => (
              <li key={repo.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{repo.full_name}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    title="Remove repository"
                    onClick={() => handleRemoveRepo(repo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <PullRequestList
                  owner={repo.owner.login}
                  repoName={repo.name}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p>No repositories found. Try adding a new repository.</p>
        )}
        {isAddingRepo ? (
          <ComboboxComponent
            repos={Array.isArray(repos) ? repos : []}
            onSelect={handleAddRepo}
          />
        ) : (
          <Button
            className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => setIsAddingRepo(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add new GitHub repository
          </Button>
        )}
      </div>
    </div>
  );
}

interface PullRequest {
  id: number;
  title: string;
  number: number;
  buildStatus: string;
  isDraft: boolean;
}

interface TestFile {
  name: string;
  oldContent: string;
  newContent: string;
  isEntirelyNew: boolean;
}

function PullRequestList({
  owner,
  repoName,
}: {
  owner: string;
  repoName: string;
}) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>(
    {}
  );
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchPRs();
    const interval = setInterval(fetchPRs, 10000);
    return () => clearInterval(interval);
  }, [owner, repoName]);

  const fetchPRs = async () => {
    const prs = await getGitHubPullRequests(owner, repoName);
    setPullRequests(prs);
    setLoading(false);
  };

  const handleOpenTests = (pr: PullRequest, mode: "write" | "update") => {
    setSelectedPR(pr);
    setAnalyzing(true);
    setLoading(true);

    // Simulating API call to get test files
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
      setLoading(false);
    }, 1000);
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

  const handleConfirmChanges = () => {
    // TODO: Implement logic to push changes as a commit to the pull request branch
    console.log("Confirming changes:", selectedFiles);
    setSelectedPR(null);
    setTestFiles([]);
    setSelectedFiles({});
    setExpandedFiles({});
  };

  const handleCancelChanges = () => {
    setSelectedPR(null);
    setTestFiles([]);
    setSelectedFiles({});
    setExpandedFiles({});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-20">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {pullRequests.map((pr) => (
        <li key={pr.id} className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center">
              {pr.isDraft ? (
                <GitPullRequestDraft className="mr-2 h-4 w-4 text-gray-400" />
              ) : (
                <GitPullRequest className="mr-2 h-4 w-4" />
              )}
              <span className="font-medium">{pr.title}</span>
            </span>
            <Link
              href={`https://github.com/${owner}/${repoName}/pull/${pr.number}`}
              className="text-sm text-gray-600 underline"
            >
              #{pr.number}
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center">
              {pr.buildStatus === "success" ? (
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
              )}
              <Link
                href={`https://github.com/${owner}/${repoName}/actions/runs/placeholder-run-id`}
                className="text-sm underline text-gray-600"
              >
                Build: {pr.buildStatus}
              </Link>
            </span>
            {selectedPR && selectedPR.id === pr.id ? (
              <Button
                size="sm"
                className="bg-white hover:bg-gray-100 text-black border border-gray-200"
                onClick={handleCancelChanges}
              >
                Cancel
              </Button>
            ) : pr.buildStatus === "success" ? (
              <Button
                size="sm"
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleOpenTests(pr, "write")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Write new tests
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
                onClick={() => handleOpenTests(pr, "update")}
              >
                <Edit className="mr-2 h-4 w-4" />
                Update tests to fix
              </Button>
            )}
          </div>
          {selectedPR && selectedPR.id === pr.id && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Test Files</h4>
              {analyzing ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Analyzing PR diff...</span>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin" />
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
                    disabled={Object.values(selectedFiles).every(
                      (value) => !value
                    )}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Commit Changes
                  </Button>
                </div>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function ComboboxComponent({
  repos,
  onSelect,
}: {
  repos: Repo[];
  onSelect: (repoName: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  useEffect(() => {
    setOpen(true);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between mt-6"
        >
          {value
            ? repos.find((repo) => repo.name === value)?.name
            : "Select repository..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search repository..." />
          <CommandList>
            <CommandEmpty>No repository found.</CommandEmpty>
            <CommandGroup>
              {repos
                .filter((repo) => !repo.isMonitoring)
                .map((repo) => (
                  <CommandItem
                    key={repo.id}
                    value={repo.name}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      onSelect(currentValue);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === repo.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {repo.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
