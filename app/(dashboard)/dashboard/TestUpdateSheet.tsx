import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import dynamic from "next/dynamic";

const ReactDiffViewer = dynamic(() => import("react-diff-viewer"), {
  ssr: false,
});

interface TestUpdateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  pullRequest: {
    title: string;
    number: number;
  };
  mode: "write" | "update";
}

interface TestFile {
  name: string;
  relative_path: string;
  isEntirelyNew: boolean;
  oldContent?: string;
  newContent?: string;
}

const TestUpdateSheet: React.FC<TestUpdateSheetProps> = ({
  isOpen,
  onClose,
  pullRequest,
  mode,
}) => {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(true);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedFiles, setExpandedFiles] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setAnalyzing(true);
      setTestFiles([]);
      setSelectedFiles({});
      setExpandedFiles({});

      let mockTestFiles: TestFile[];

      if (mode === "write") {
        mockTestFiles = [
          {
            name: "dashboard_controller_spec.rb",
            relative_path: "spec/controllers/dashboard_controller_spec.rb",
            isEntirelyNew: true,
            newContent: `
describe DashboardController do
  describe "GET #index" do
    it "returns a success response" do
      get :index
      expect(response).to be_successful
    end
  end

  describe "GET #show" do
    it "returns a success response" do
      dashboard = Dashboard.create!(valid_attributes)
      get :show, params: {id: dashboard.to_param}
      expect(response).to be_successful
    end
  end

  describe "PUT #update" do
    context "with valid params" do
      it "updates the requested dashboard" do
        dashboard = Dashboard.create!(valid_attributes)
        put :update, params: {id: dashboard.to_param, dashboard: new_attributes}
        dashboard.reload
        expect(dashboard.attributes).to include(new_attributes.stringify_keys)
      end
    end
  end
end
            `,
          },
          {
            name: "user_model_spec.rb",
            relative_path: "spec/models/user_model_spec.rb",
            isEntirelyNew: false,
            oldContent: `
describe User do
  it "is valid with valid attributes" do
    user = User.new(username: "testuser", email: "test@example.com", password: "password123")
    expect(user).to be_valid
  end
end
`,
            newContent: `
describe User do
  it "is valid with valid attributes" do
    user = User.new(username: "testuser", email: "test@example.com", password: "password123")
    expect(user).to be_valid
  end

  it "is not valid without a username" do
    user = User.new(email: "test@example.com", password: "password123")
    expect(user).to_not be_valid
  end
end
`,
          },
        ];
      } else {
        mockTestFiles = [
          {
            name: "login_controller_spec.rb",
            relative_path: "spec/controllers/login_controller_spec.rb",
            isEntirelyNew: false,
            oldContent: `
it 'returns success on valid login' do
  post :login, params: { username: 'valid_user', password: 'valid_password' }
  expect(response).to have_http_status(:success)
end
`,
            newContent: `
it 'redirects to dashboard on successful login' do
  post :login, params: { username: 'valid_user', password: 'valid_password' }
  expect(response).to redirect_to(dashboard_path)
  expect(response.body).to include('Dashboard')
end
`,
          },
          {
            name: "authentication_spec.rb",
            relative_path: "spec/models/authentication_spec.rb",
            isEntirelyNew: false,
            oldContent: `
it 'checks if token is expired' do
  token = create(:token)
  expect(token.expired?).to be false
end
`,
            newContent: `
it 'expires the token after the configured time' do
  token = create(:token, created_at: 2.hours.ago)
  expect(token.expired?).to be true
end
`,
          },
        ];
      }

      setTimeout(() => {
        setTestFiles(mockTestFiles);
        mockTestFiles.forEach((file) => {
          setExpandedFiles((prev) => ({ ...prev, [file.name]: true }));
          if (mode === "update") {
            setSelectedFiles((prev) => ({
              ...prev,
              [file.name]: true,
            }));
          }
        });
        setAnalyzing(false);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen, mode]);

  const handleFileToggle = (fileName: string) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
    setExpandedFiles((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  const handleConfirmChanges = () => {
    // TODO: Implement logic to push changes as a commit to the pull request branch
    console.log("Confirming changes:", selectedFiles);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    // Reset the state when closing the drawer
    setLoading(true);
    setAnalyzing(true);
    setTestFiles([]);
    setSelectedFiles({});
    setExpandedFiles({});
  };

  const isAnyFileSelected = Object.values(selectedFiles).some((value) => value);

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="h-[80vh] max-w-full">
        <SheetHeader>
          <SheetTitle>
            {mode === "write" ? "Write New Tests" : "Update Tests"}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 h-full overflow-y-auto">
          <h3 className="font-semibold mb-2">
            PR: {pullRequest.title} (#{pullRequest.number})
          </h3>
          <p className="mb-4">
            {mode === "write"
              ? "Analyzing PR diff in order to suggest new tests to write..."
              : "Analyzing PR diff and failing tests in order to suggest test edits..."}
          </p>
          <div className="bg-white p-4 rounded-lg border border-black">
            {analyzing ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {testFiles.map((file) => (
                  <div key={file.name}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Checkbox
                          id={file.name}
                          checked={selectedFiles[file.name]}
                          onCheckedChange={() => handleFileToggle(file.name)}
                        />
                        <label htmlFor={file.name} className="ml-2 font-medium">
                          {file.name}
                        </label>
                        {file.isEntirelyNew && (
                          <Badge variant="outline" className="ml-2">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    {expandedFiles[file.name] && (
                      <div className="mt-2">
                        <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                          <ReactDiffViewer
                            oldValue={file.oldContent || ""}
                            newValue={file.newContent || ""}
                            splitView={true}
                            showDiffOnly={false}
                            useDarkTheme={false}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  onClick={handleConfirmChanges}
                  className="w-full mb-6 mt-0"
                  disabled={!isAnyFileSelected}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {mode === "update" ? "Update Tests" : "Commit Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TestUpdateSheet;
