export interface PullRequest {
  id: number;
  title: string;
  number: number;
  buildStatus: string;
  isDraft: boolean;
  branchName: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
    };
  };
}

export interface TestFile {
  name: string;
  content: string;
  oldContent?: string;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description: string;
}
