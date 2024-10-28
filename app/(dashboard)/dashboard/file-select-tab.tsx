"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, FileCode, Loader2, FolderIcon, FileIcon, Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { getRepos, getBranches, getRepoFiles, getFileContent } from "@/lib/github";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FilePreviewCard } from "./file-preview-card";
import { experimental_useObject as useObject } from "ai/react";
import { TestFileSchemaLoose } from "@/app/api/generate-file-tests/schema";
import { useToast } from "@/hooks/use-toast";
import { GeneratedTestCard } from "./generated-test-card";
import { minimatch } from "minimatch";

interface Repository {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  private: boolean;
}

interface Branch {
  name: string;
  sha: string;
}

interface FileItem {
  path: string;
  type: 'blob' | 'tree';
}

export function FileSelectTab() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);  // renamed from selectedFile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileContents, setFileContents] = useState<Map<string, string>>(new Map());
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [owner, setOwner] = useState<string>("");
  const [repo, setRepo] = useState<string>("");
  const [generatedTests, setGeneratedTests] = useState<Array<{ name: string, content: string }>>([]);
  const [testFiles, setTestFiles] = useState<Map<string, string>>(new Map());
  const [loadingTestFiles, setLoadingTestFiles] = useState(false);
  const { toast } = useToast();

  const {
    object,
    submit,
    isLoading: isGenerating,
  } = useObject({
    api: "/api/generate-file-tests",
    schema: TestFileSchemaLoose,
    onFinish: (result) => {
      setGeneratedTests(result.object?.tests || []);
      setLoading(false);
    },
    onError: (error) => {
      console.error("Error generating test files:", error);
      setError("Failed to generate test files");
      setLoading(false);
    },
  });

  useEffect(() => {
    async function fetchRepositories() {
      try {
        const repos = await getRepos();
        setRepositories(repos);
        setError(null);
      } catch (err) {
        setError("Failed to fetch repositories");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRepositories();
  }, []);

  useEffect(() => {
    async function fetchBranches() {
      if (!selectedRepo) return;

      setLoading(true);
      try {
        const [owner, repo] = selectedRepo.split("/");
        const branchData = await getBranches(owner, repo);
        setBranches(branchData);
        setError(null);
      } catch (err) {
        setError("Failed to fetch branches");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBranches();
  }, [selectedRepo]);

  useEffect(() => {
    if (selectedRepo) {
      const [ownerPart, repoPart] = selectedRepo.split('/');
      setOwner(ownerPart);
      setRepo(repoPart);
    }
  }, [selectedRepo]);

  const handleBrowseFiles = async () => {
    if (!selectedRepo || !selectedBranch) return;

    setLoading(true);
    try {
      const [owner, repo] = selectedRepo.split("/");
      const allFiles = await getRepoFiles(owner, repo, selectedBranch);
      
      // Split files into test files and regular files
      const testFilePatterns = [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx'
      ];
      
      const testFiles = allFiles
        .filter(file => 
          testFilePatterns.some(pattern => 
            minimatch(file.path, pattern, { matchBase: true })
          )
        )
        .slice(0, 5); // Only keep first 5 test files

      // Get content for test files
      const testContents = new Map();
      for (const file of testFiles) {
        const content = await getFileContent(owner, repo, file.path, selectedBranch);
        testContents.set(file.path, content);
      }
      setTestFiles(testContents);

      // Store regular files for file browser
      setFiles(allFiles);
      setIsDialogOpen(true);
      setError(null);
    } catch (err) {
      setError("Failed to fetch files");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter((file) =>
    file.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    selectedFiles.forEach(async (path) => {
      if (!fileContents.has(path) && !loadingFiles.has(path)) {
        setLoadingFiles(prev => new Set(prev).add(path));
        try {
          const content = await getFileContent(owner, repo, path, selectedBranch);
          setFileContents(prev => new Map(prev).set(path, content));
        } finally {
          setLoadingFiles(prev => {
            const next = new Set(prev);
            next.delete(path);
            return next;
          });
        }
      }
    });

    // Cleanup deselected files
    setFileContents(prev => {
      const next = new Map(prev);
      for (const path of prev.keys()) {
        if (!selectedFiles.includes(path)) {
          next.delete(path);
        }
      }
      return next;
    });
  }, [selectedFiles, owner, repo, selectedBranch]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error Generating Tests",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  const handleGenerateTests = async () => {
    setLoading(true);
    try {
      const files = Array.from(fileContents.entries()).map(([path, content]) => ({
        path,
        content,
      }));

      // Check if we have content for all files
      const missingContent = selectedFiles.filter(path => !fileContents.has(path));
      if (missingContent.length > 0) {
        throw new Error(`Still loading content for: ${missingContent.join(", ")}`);
      }

      // Include test files in the submission
      const test_files = Array.from(testFiles.entries()).map(([name, content]) => ({
        name,
        content,
      }));

      submit({ 
        files,
        test_files 
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate tests";
      setError(message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRepo && selectedBranch) {
      fetchTestFiles();
    }
  }, [selectedRepo, selectedBranch]);

  const fetchTestFiles = async () => {
    if (!owner || !repo || !selectedBranch) return;
    
    setLoadingTestFiles(true);
    try {
      // Get all files that match test patterns
      const allFiles = await getRepoFiles(owner, repo, selectedBranch);
      const testFilePatterns = [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx'
      ];
      
      const matchingTestFiles = allFiles.filter(file => 
        testFilePatterns.some(pattern => 
          minimatch(file.path, pattern, { matchBase: true })
        )
      ).slice(0, 5); // Only get first 5 test files

      // Fetch content for each test file
      const testContents = new Map();
      for (const file of matchingTestFiles) {
        const content = await getFileContent(owner, repo, file.path, selectedBranch);
        testContents.set(file.path, content);
      }
      
      setTestFiles(testContents);
    } catch (err) {
      console.error('Error fetching test files:', err);
    } finally {
      setLoadingTestFiles(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Files for Test Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Select Repository and Branch
                  </span>
                </div>
                <Select
                  value={selectedRepo}
                  onValueChange={(value) => {
                    setSelectedRepo(value);
                    setSelectedBranch("");
                    setSelectedFiles([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a repository" />
                  </SelectTrigger>
                  <SelectContent>
                    {repositories.map((repo) => (
                      <SelectItem key={repo.id} value={repo.fullName}>
                        {repo.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedRepo && (
                  <Select
                    value={selectedBranch}
                    onValueChange={(value) => {
                      setSelectedBranch(value);
                      setSelectedFiles([]);
                    }}
                    disabled={!selectedRepo || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.sha} value={branch.name}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  <span className="text-sm font-medium">Select Files</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!selectedRepo || !selectedBranch}
                  onClick={handleBrowseFiles}
                >
                  {selectedFiles.length 
                    ? `${selectedFiles.length} files selected` 
                    : "Browse Files"}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                disabled={!selectedRepo || !selectedBranch || selectedFiles.length === 0 || isGenerating}
                onClick={handleGenerateTests}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Tests'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Selected Files</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedFiles.map((path) => (
                <FilePreviewCard
                  key={path}
                  path={path}
                  content={fileContents.get(path) ?? 'Loading...'}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Browse Repository Files</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2">
            <Command className="rounded-lg border shadow-md">
              <CommandInput
                placeholder="Search files..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>No files found.</CommandEmpty>
                <CommandGroup>
                  {filteredFiles.map((file) => (
                    <CommandItem
                      key={file.path}
                      onSelect={() => {
                        setSelectedFiles(prev => 
                          prev.includes(file.path) 
                            ? prev.filter(f => f !== file.path)
                            : [...prev, file.path]
                        );
                      }}
                    >
                      <FileIcon className="mr-2 h-4 w-4" />
                      {file.path}
                      {selectedFiles.includes(file.path) && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {generatedTests.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Generated Test Files</h3>
          <div className="space-y-6">
            {generatedTests.map((test) => (
              <GeneratedTestCard
                key={test.name}
                name={test.name}
                content={test.content}
                owner={owner}
                repo={repo}
                branch={selectedBranch}
                onDismiss={(name) => {
                  setGeneratedTests(prev => 
                    prev.filter(t => t.name !== name)
                  );
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
