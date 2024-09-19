import { auth } from "@clerk/nextjs";

export default async function DashboardPage() {
  const { userId } = auth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </div>
  );
}
