"use client";

import { CommandIcon, FileIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import Anchor from "@/components/docs/anchor";
import { advanceSearch } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function Search() {
  const [searchedInput, setSearchedInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredResults = useMemo(
    () => advanceSearch(searchedInput.trim()),
    [searchedInput]
  );

  return (
    <div>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) setSearchedInput("");
          setIsOpen(open);
        }}
      >
        <DialogTrigger asChild>
          <div className="relative flex-1 max-w-md cursor-pointer">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500 dark:text-stone-400" />
            <Input
              className="md:w-full rounded-md dark:bg-background/95 bg-background border h-9 pl-10 pr-0 sm:pr-7 text-sm shadow-sm overflow-ellipsis"
              placeholder="Search documentation..."
              type="search"
            />
            <div className="sm:flex hidden absolute top-1/2 -translate-y-1/2 right-2 text-xs font-medium font-mono items-center gap-0.5 dark:bg-stone-900 bg-stone-200/65 p-1 rounded-sm">
              <CommandIcon className="w-3 h-3" />
              <span>k</span>
            </div>
          </div>
        </DialogTrigger>
        <DialogContent className="p-0 max-w-[650px] sm:top-[38%] top-[45%] !rounded-md">
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogHeader>
            <input
              value={searchedInput}
              onChange={(e) => setSearchedInput(e.target.value)}
              placeholder="Type something to search..."
              autoFocus
              className="h-14 px-6 bg-transparent border-b text-[14px] outline-none"
            />
          </DialogHeader>
          {filteredResults.length == 0 && searchedInput && (
            <p className="text-muted-foreground mx-auto mt-2 text-sm">
              No results found for{" "}
              <span className="text-primary">{`"${searchedInput}"`}</span>
            </p>
          )}
          <ScrollArea className="max-h-[400px] overflow-y-auto">
            <div className="flex flex-col items-start overflow-y-auto sm:px-2 px-1 pb-4">
              {filteredResults.map((item) => {
                const level = (item.href.split("/").slice(1).length -
                  1) as keyof typeof paddingMap;
                const paddingClass = paddingMap[level];

                return (
                  <DialogClose key={item.href} asChild>
                    <Anchor
                      className={cn(
                        "dark:hover:bg-stone-900 hover:bg-stone-100 w-full px-3 rounded-sm text-sm flex items-center gap-2.5",
                        paddingClass
                      )}
                      href={`/docs${item.href}`}
                    >
                      <div
                        className={cn(
                          "flex items-center w-fit h-full py-3 gap-1.5 px-2",
                          level > 1 && "border-l pl-4"
                        )}
                      >
                        <FileIcon className="h-[1.1rem] w-[1.1rem] mr-1" />{" "}
                        {item.title}
                      </div>
                    </Anchor>
                  </DialogClose>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const paddingMap = {
  1: "pl-2",
  2: "pl-4",
  3: "pl-10",
  // Add more levels if needed
} as const;
