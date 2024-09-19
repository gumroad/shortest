import { GitHubRepos } from './github-repos';
import { PullRequests } from './pull-requests';

export default async function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <GitHubRepos />
      <PullRequests />
    </div>
  );
}
