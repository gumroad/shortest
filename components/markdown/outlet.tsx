import { BaseMdxFrontmatter, getAllChilds } from "@/lib/docs/markdown";
import Link from "next/link";

export default async function Outlet({ path }: { path: string }) {
  if (!path) throw new Error("path not provided");
  const output = await getAllChilds(path);

  return (
    <div className="grid md:grid-cols-2 gap-5">
      {output.map((child) => (
        <ChildCard {...child} key={child.title} />
      ))}
    </div>
  );
}

type ChildCardProps = BaseMdxFrontmatter & { href: string };

function ChildCard({ description, href, title }: ChildCardProps) {
  return (
    <Link
      href={href}
      className="border rounded-md p-4 no-underline flex flex-col gap-0.5"
    >
      <h4 className="!my-0">{title}</h4>
      <p className="text-sm text-muted-foreground !my-0">{description}</p>
    </Link>
  );
}
