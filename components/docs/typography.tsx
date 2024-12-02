import { PropsWithChildren } from "react";

export function Typography({ children }: PropsWithChildren) {
  return (
    <div className="prose prose-zinc dark:prose-invert prose-code:font-normal prose-code:font-code dark:prose-code:bg-stone-900/25 prose-code:bg-stone-50 prose-pre:bg-background prose-headings:scroll-m-20 w-[85vw] sm:w-full sm:mx-auto prose-code:text-sm prose-code:leading-6 dark:prose-code:text-white prose-code:text-stone-800 prose-code:p-[0.085rem]  prose-code:rounded-md prose-code:border pt-2 !min-w-full prose-img:rounded-md prose-img:border prose-code:before:content-none prose-code:after:content-none prose-code:px-1.5 prose-code:overflow-x-auto !max-w-[500px] prose-img:my-3 prose-h2:my-4 prose-h2:mt-8">
      {children}
    </div>
  );
}
