import { cn } from "@/lib/utils";
import clsx from "clsx";
import { PropsWithChildren } from "react";

type NoteProps = PropsWithChildren & {
  title?: string;
  type?: "note" | "danger" | "warning" | "success";
};

export default function Note({
  children,
  title = "Note",
  type = "note",
}: NoteProps) {
  const noteClassNames = clsx({
    "dark:bg-stone-950/25 bg-stone-50": type == "note",
    "dark:bg-red-950 bg-red-100 border-red-200 dark:border-red-900":
      type === "danger",
    "dark:bg-orange-950 bg-orange-100 border-orange-200 dark:border-orange-900":
      type === "warning",
    "dark:bg-green-950 bg-green-100 border-green-200 dark:border-green-900":
      type === "success",
  });

  return (
    <div
      className={cn(
        "border rounded-md px-5 pb-0.5 mt-5 mb-7 text-sm tracking-wide",
        noteClassNames
      )}
    >
      <p className="font-bold -mb-2.5">{title}:</p> {children}
    </div>
  );
}
