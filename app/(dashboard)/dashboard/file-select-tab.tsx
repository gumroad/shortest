"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch, FileCode, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { getRepos, getBranches } from "@/lib/github";

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

export function FileSelectTab() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
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
                  onValueChange={setSelectedBranch}
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
              >
                Browse Files
              </Button>
            </div>
          </div>
          <div className="flex justify-end">
            <Button disabled={!selectedRepo || !selectedBranch}>
              Generate Tests
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
