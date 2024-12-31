import { shortest } from "@antiwork/shortest";

shortest("run a request to /posts/1 and verify the post is created by user 1", {
  url: "https://jsonplaceholder.typicode.com",
});
