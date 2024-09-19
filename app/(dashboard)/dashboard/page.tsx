"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GitPullRequestDraft,
  GitPullRequest,
  CheckCircle,
  XCircle,
  Edit,
  PlusCircle,
  Plus,
  Trash2,
} from "lucide-react";
import TestUpdateSheet from "./TestUpdateSheet";
import Link from "next/link";

export default function DashboardPage() {
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sheetMode, setSheetMode] = useState<"write" | "update">("write");

  // Placeholder data
  const [repos, setRepos] = useState([
    {
      id: 1,
      name: "gumroad/shortest",
      pullRequests: [
        {
          id: 101,
          title: "Feature: Add new login page",
          number: 42,
          buildStatus: "success",
          isDraft: false,
        },
        {
          id: 102,
          title: "Fix: Resolve CSS issues",
          number: 43,
          buildStatus: "failure",
          isDraft: true,
        },
      ],
    },
    {
      id: 2,
      name: "gumroad/flexile",
      pullRequests: [
        {
          id: 201,
          title: "Refactor: Improve performance",
          number: 15,
          buildStatus: "success",
          isDraft: false,
        },
      ],
    },
  ]);

  const handleOpenSheet = (pr: PullRequest, mode: "write" | "update") => {
    setSelectedPR(pr);
    setSheetMode(mode);
    setIsSheetOpen(true);
  };

  const handleRemoveRepo = (repoId: number) => {
    setRepos(repos.filter((repo) => repo.id !== repoId));
  };

  if (repos.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your GitHub Repositories and Pull Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              No repositories connected. Please connect your GitHub account to
              view your repositories and pull requests.
            </p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center">
              Connect GitHub repositories
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Your GitHub Repositories and Pull Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-8">
            {repos.map((repo) => (
              <li key={repo.id}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">{repo.name}</h3>
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
                {repo.pullRequests.length > 0 ? (
                  <ul className="space-y-4">
                    {repo.pullRequests.map((pr) => (
                      <li key={pr.id} className="bg-gray-50 p-4 rounded-lg">
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
                            href={`https://github.com/${repo.name}/pull/${pr.number}`}
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
                            <span className="text-sm">
                              Build: {pr.buildStatus}
                            </span>
                          </span>
                          {pr.buildStatus === "success" ? (
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white"
                              onClick={() => handleOpenSheet(pr, "write")}
                            >
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Write new tests
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                              onClick={() => handleOpenSheet(pr, "update")}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Update tests to fix
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">No open pull requests</p>
                )}
              </li>
            ))}
          </ul>
          <Button className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add New GitHub Repository
          </Button>
        </CardContent>
      </Card>
      {selectedPR && (
        <TestUpdateSheet
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          pullRequest={selectedPR}
          mode={sheetMode}
        />
      )}
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
