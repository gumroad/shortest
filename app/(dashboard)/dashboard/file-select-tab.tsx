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
import { getRepos, getBranches, getRepoFiles } from "@/lib/github";
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

  const handleBrowseFiles = async () => {
    if (!selectedRepo || !selectedBranch) return;

    setLoading(true);
    try {
      const [owner, repo] = selectedRepo.split("/");
      const fileData = await getRepoFiles(owner, repo, selectedBranch);
      setFiles(fileData);
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
      <div className="p-6 h-full">
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
              <Button disabled={!selectedRepo || !selectedBranch || selectedFiles.length === 0}>
                Generate Tests
              </Button>
            </div>
          </CardContent>
        </Card>
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
    </>
  );
}
