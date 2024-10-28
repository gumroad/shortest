import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, FileCode, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { commitChangesToFile } from "@/lib/github";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GeneratedTestCardProps {
  name: string;
  content: string;
  owner: string;
  repo: string;
  branch: string;
  onDismiss: (name: string) => void;
}

export function GeneratedTestCard({ 
  name, 
  content, 
  owner, 
  repo, 
  branch,
  onDismiss 
}: GeneratedTestCardProps) {
  const [isCommitting, setIsCommitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const handleCommit = async () => {
    setIsCommitting(true);
    try {
      await commitChangesToFile(owner, repo, branch, name, content);
      toast({
        title: "Test committed",
        description: `Successfully committed ${name} to ${branch}`,
      });
      onDismiss(name);
    } catch (error) {
      toast({
        title: "Error committing test",
        description: error instanceof Error ? error.message : "Failed to commit test file",
        variant: "destructive",
      });
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="transition-all duration-200 ease-in-out hover:-translate-y-0.5">
      <Card 
        className="border-2 shadow-lg cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardHeader className="p-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="h-5 w-5 text-primary" />
              <span className="text-base font-medium">{name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Generated Test</Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className={cn(
            "relative overflow-hidden transition-all duration-200",
            !isExpanded && "max-h-[400px]"
          )}>
            <pre className="text-sm bg-muted/50 p-4 rounded-lg overflow-x-auto font-mono leading-relaxed border">
              {content}
            </pre>
            {!isExpanded && (
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            )}
          </div>
        </CardContent>
        <CardFooter className="p-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss(name);
            }}
            disabled={isCommitting}
            className="transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
          >
            <X className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleCommit();
            }}
            disabled={isCommitting}
            className="transition-colors"
          >
            {isCommitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Commit Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 