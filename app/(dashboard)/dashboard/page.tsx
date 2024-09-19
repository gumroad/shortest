"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInButton } from "@clerk/nextjs";
import {
  GitBranch,
  CheckCircle,
  XCircle,
  Edit,
  PlusCircle,
  Plus,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function DashboardPage() {
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);

  // Placeholder data
  const repos = [
    {
      id: 1,
      name: "user/repo1",
      pullRequests: [
        {
          id: 101,
          title: "Feature: Add new login page",
          number: 42,
          state: "open",
          buildStatus: "success",
          isDraft: false,
        },
        {
          id: 102,
          title: "Fix: Resolve CSS issues",
          number: 43,
          state: "open",
          buildStatus: "failure",
          isDraft: true,
        },
      ],
    },
    {
      id: 2,
      name: "user/repo2",
      pullRequests: [
        {
          id: 201,
          title: "Refactor: Improve performance",
          number: 15,
          state: "open",
          buildStatus: "success",
          isDraft: false,
        },
      ],
    },
  ];

  const handleWriteNewTests = (pr: PullRequest) => {
    setSelectedPR(pr);
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
            <SignInButton mode="modal">
              <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white border border-orange-600 rounded-full text-lg px-8 py-4 inline-flex items-center justify-center">
                Connect GitHub repositories
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your GitHub Repositories and Pull Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Button className="w-full mb-6 bg-blue-500 hover:bg-blue-600 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add New GitHub Repository
          </Button>
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
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <h4 className="font-medium text-md mb-2">Pull Requests:</h4>
                {repo.pullRequests.length > 0 ? (
                  <ul className="space-y-4">
                    {repo.pullRequests.map((pr) => (
                      <li key={pr.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center">
                            <GitBranch className="mr-2 h-4 w-4" />
                            <span className="font-medium">{pr.title}</span>
                          </span>
                          <span className="text-sm text-gray-600">
                            #{pr.number} - {pr.state}
                            {pr.isDraft && (
                              <span className="ml-2 text-gray-500">
                                <FileText className="inline-block mr-1 h-4 w-4" />
                                Draft
                              </span>
                            )}
                          </span>
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
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                  onClick={() => handleWriteNewTests(pr)}
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Write new tests
                                </Button>
                              </SheetTrigger>
                              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                                <SheetHeader>
                                  <SheetTitle>Write New Tests</SheetTitle>
                                </SheetHeader>
                                {selectedPR && (
                                  <div className="mt-4">
                                    <h3 className="font-semibold mb-2">
                                      PR: {selectedPR.title} (#{selectedPR.number})
                                    </h3>
                                    <p className="mb-4">
                                      An expert software engineer will analyze the PR diff and suggest new specs to write.
                                    </p>
                                    <div className="bg-gray-100 p-4 rounded-lg">
                                      <p className="text-sm text-gray-600">
                                        Expert suggestions will appear here...
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </SheetContent>
                            </Sheet>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-yellow-500 hover:bg-yellow-600 text-white"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit tests to fix
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
        </CardContent>
      </Card>
    </div>
  );
}

interface PullRequest {
  id: number;
  title: string;
  number: number;
  state: string;
  buildStatus: string;
  isDraft: boolean;
}
