"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PullRequestTab } from "./pull-request-tab";
import { FileSelectTab } from "./file-select-tab";

export default function DashboardPage() {
  return (
    <Tabs defaultValue="pull-request" className="h-full">
      <div className="border-b px-6 py-2">
        <TabsList>
          <TabsTrigger value="pull-request">Pull Request</TabsTrigger>
          <TabsTrigger value="file-select">File Select</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="pull-request" className="h-[calc(100%-53px)]">
        <PullRequestTab />
      </TabsContent>
      <TabsContent value="file-select" className="h-[calc(100%-53px)]">
        <FileSelectTab />
      </TabsContent>
    </Tabs>
  );
}
