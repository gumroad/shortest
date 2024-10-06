"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { searchIssues } from "@/lib/linear";
import { useClerk } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import type { Issue } from "./types";

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

function IssueModal({
  isOpen,
  onClose,
  setIssue,
}: {
  isOpen: boolean;
  onClose: () => void;
  setIssue: (issue: Issue) => void;
}) {
  const { openUserProfile, user } = useClerk();

  const isConnectedToLinear = user?.externalAccounts?.some(
    (account) => account.provider === "linear"
  );

  const [issues, setIssues] = useState<Issue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSelectIssue = (issue: Issue) => {
    setIssue({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
    });
    onClose();
  };

  const handleSearch = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);

    if (term.length > 2) {
      setLoading(true);
      setIssues([]);
      try {
        const fetchedIssues = (await searchIssues(term)) as Issue[];
        setIssues(fetchedIssues);
      } catch (error) {
        console.error("Error fetching issues:", error);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    } else {
      setIssues([]);
    }
  };

  const debouncedSearch = useCallback(debounce(handleSearch, 500), []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] p-6 bg-gray-50 rounded-lg shadow-lg overflow-y-auto flex flex-col flex-nowrap">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Connect an issue
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Provide more context for your changes
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col max-w-full">
          {isConnectedToLinear ? (
            <>
              <form className="w-full relative">
                <input
                  type="text"
                  placeholder="Search issue by title (e.g. 'Add login feature')"
                  className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={debouncedSearch}
                />
              </form>
              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center mt-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                </div>
              )}
              {/* No results message */}
              {searchTerm && !loading && issues.length === 0 && (
                <div className="mt-4 text-center text-gray-500">
                  No results found.
                </div>
              )}
              {/* Results list */}
              {searchTerm && !loading && issues.length > 0 && (
                <div className="flex flex-col mt-2 max-h-60 overflow-y-auto">
                  <ul className="rounded-md shadow-lg">
                    {issues.map((issue: Issue) => (
                      <li
                        key={issue.id}
                        className="p-2 rounded hover:bg-gray-200 cursor-pointer transition duration-200"
                        onClick={() => handleSelectIssue(issue)}
                      >
                        <div className="flex flex-col max-w-full">
                          <p className="font-medium text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
                            {issue.identifier}: {issue.title}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <Button
              onClick={() => {
                openUserProfile();
                onClose();
              }}
              type="button"
              className="bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-md px-4 py-2 transition duration-200"
            >
              Connect Linear
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default IssueModal;
