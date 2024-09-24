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
  oldContent: string;
  newContent: string;
  isEntirelyNew: boolean;
}
