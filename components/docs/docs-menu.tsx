"use client";

import { ROUTES } from "@/lib/docs/routes-config"; 
import SubLink from "@/components/docs/sublink";
import { usePathname } from "next/navigation";

export default function DocsMenu({ isSheet = false }) {
  const pathname = usePathname();
  if (!pathname.startsWith("/docs")) return null;

  return (
    <div className="flex flex-col gap-3.5 mt-5 pr-2 pb-6">
      {ROUTES.map((item, index) => {
        const modifiedItems = {
          ...item,
          href: `/docs${item.href}`,
          level: 0,
          isSheet,
        };
        return <SubLink key={item.title + index} {...modifiedItems} />;
      })}
    </div>
  );
}
