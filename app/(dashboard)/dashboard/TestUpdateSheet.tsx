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
  test_file?: string;
  tests?: {
    name: string;
    content: string;
    starting_line_number: number;
    changes?: {
      added: string[];
      removed: string[];
    };
  }[];
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
  const [selectedTests, setSelectedTests] = useState<{
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
      setSelectedTests({});
      setExpandedFiles({});

      let mockTestFiles: TestFile[];

      if (mode === "write") {
        mockTestFiles = [
          {
            name: "dashboard_controller_spec.rb",
            relative_path: "spec/controllers/dashboard_controller_spec.rb",
            isEntirelyNew: true,
            test_file: `
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
            tests: [
              {
                name: "is valid with valid attributes",
                starting_line_number: 1,
                content: `
it "is valid with valid attributes" do
  user = User.new(username: "testuser", email: "test@example.com", password: "password123")
  expect(user).to be_valid
end
                `,
              },
              {
                name: "is not valid without a username",
                starting_line_number: 99,
                content: `
it "is not valid without a username" do
  user = User.new(email: "test@example.com", password: "password123")
  expect(user).to_not be_valid
end
                `,
              },
            ],
          },
        ];
      } else {
        mockTestFiles = [
          {
            name: "login_controller_spec.rb",
            relative_path: "spec/controllers/login_controller_spec.rb",
            isEntirelyNew: false,
            tests: [
              {
                name: "test_login_with_valid_credentials",
                content: "",
                starting_line_number: 1,
                changes: {
                  added: [
                    "it 'redirects to dashboard on successful login' do",
                    "  post :login, params: { username: 'valid_user', password: 'valid_password' }",
                    "  expect(response).to redirect_to(dashboard_path)",
                    "  expect(response.body).to include('Dashboard')",
                    "end",
                  ],
                  removed: [
                    "it 'returns success on valid login' do",
                    "  post :login, params: { username: 'valid_user', password: 'valid_password' }",
                    "  expect(response).to have_http_status(:success)",
                    "end",
                  ],
                },
              },
            ],
          },
          {
            name: "authentication_spec.rb",
            relative_path: "spec/models/authentication_spec.rb",
            isEntirelyNew: false,
            tests: [
              {
                name: "test_token_expiration",
                content: "",
                starting_line_number: 1,
                changes: {
                  added: [
                    "it 'expires the token after the configured time' do",
                    "  token = create(:token, created_at: 2.hours.ago)",
                    "  expect(token.expired?).to be true",
                    "end",
                  ],
                  removed: [
                    "it 'checks if token is expired' do",
                    "  token = create(:token)",
                    "  expect(token.expired?).to be false",
                    "end",
                  ],
                },
              },
            ],
          },
        ];
      }

      setTimeout(() => {
        setTestFiles(mockTestFiles);
        mockTestFiles.forEach((file) => {
          setExpandedFiles((prev) => ({ ...prev, [file.name]: true }));
          if (mode === "update") {
            if (file.tests) {
              file.tests.forEach((test) => {
                setSelectedTests((prev) => ({
                  ...prev,
                  [`${file.name}-${test.name}`]: true,
                }));
              });
            }
          }
        });
        setAnalyzing(false);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen, mode]);

  const handleTestToggle = (fileName: string, testName: string) => {
    const key = `${fileName}-${testName}`;
    setSelectedTests((prev) => {
      const newSelectedTests = { ...prev, [key]: !prev[key] };
      if (testName === "whole-file") {
        setExpandedFiles((prev) => ({
          ...prev,
          [fileName]: !newSelectedTests[key],
        }));
      }
      return newSelectedTests;
    });
  };

  const handleConfirmChanges = () => {
    // TODO: Implement logic to push changes as a commit to the pull request branch
    console.log("Confirming changes:", selectedTests);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    // Reset the state when closing the drawer
    setLoading(true);
    setAnalyzing(true);
    setTestFiles([]);
    setSelectedTests({});
    setExpandedFiles({});
  };

  const isAnyTestSelected = Object.values(selectedTests).some((value) => value);

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
          <div className="bg-gray-100 p-4 rounded-lg">
            {analyzing ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {testFiles.map((file) => (
                  <div key={file.name} className="bg-white p-3 rounded-md">
                    <div className="flex items-center justify-between">
                      {file.isEntirelyNew ? (
                        <div className="flex items-center">
                          <Checkbox
                            id={`${file.name}-whole-file`}
                            checked={
                              selectedTests[`${file.name}-whole-file`] ||
                              mode === "update"
                            }
                            onCheckedChange={() =>
                              handleTestToggle(file.name, "whole-file")
                            }
                          />
                          <label
                            htmlFor={`${file.name}-whole-file`}
                            className="ml-2 font-medium"
                          >
                            {file.name}
                          </label>
                          <Badge variant="outline" className="ml-2">
                            New
                          </Badge>
                        </div>
                      ) : (
                        <h4 className="font-medium">{file.name}</h4>
                      )}
                    </div>
                    {(file.isEntirelyNew ? expandedFiles[file.name] : true) && (
                      <div className="mt-2">
                        {mode === "write" &&
                          file.isEntirelyNew &&
                          file.test_file && (
                            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4">
                              <pre className="text-sm">
                                <code>
                                  {file.test_file
                                    .split("\n")
                                    .map((line, lineIndex) => {
                                      const globalLineIndex = lineIndex;
                                      return (
                                        <span
                                          key={globalLineIndex}
                                          className="block"
                                        >
                                          <span className="text-gray-500 mr-2">
                                            {globalLineIndex + 1}
                                          </span>
                                          <span className="text-green-600">
                                            + {line}
                                          </span>
                                        </span>
                                      );
                                    })}
                                </code>
                              </pre>
                            </div>
                          )}
                        {file.tests && (
                          <ul className="space-y-2">
                            {file.tests.map((test) => (
                              <li key={test.name} className="flex flex-col">
                                <div className="flex items-center">
                                  <Checkbox
                                    id={`${file.name}-${test.name}`}
                                    checked={
                                      selectedTests[`${file.name}-${test.name}`]
                                    }
                                    onCheckedChange={() =>
                                      handleTestToggle(file.name, test.name)
                                    }
                                  />
                                  <label
                                    htmlFor={`${file.name}-${test.name}`}
                                    className="ml-2 text-sm"
                                  >
                                    {test.name}
                                  </label>
                                </div>
                                <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto mt-2">
                                  <pre className="text-sm">
                                    <code>
                                      {mode === "write" ? (
                                        test.content
                                          .split("\n")
                                          .map((line, index) => (
                                            <span key={index} className="block">
                                              <span className="text-gray-500 mr-2">
                                                {test.starting_line_number +
                                                  index}
                                              </span>
                                              <span className="text-green-600">
                                                + {line}
                                              </span>
                                            </span>
                                          ))
                                      ) : (
                                        <>
                                          {test.changes?.removed?.map(
                                            (line, index) => (
                                              <div
                                                key={`removed-${index}`}
                                                className="bg-red-100"
                                              >
                                                <span className="text-gray-500 mr-2">
                                                  {test.starting_line_number +
                                                    index}
                                                </span>
                                                <span className="text-red-600">
                                                  - {line}
                                                </span>
                                              </div>
                                            )
                                          )}
                                          {test.changes?.added?.map(
                                            (line, index) => (
                                              <div
                                                key={`added-${index}`}
                                                className="bg-green-100"
                                              >
                                                <span className="text-gray-500 mr-2">
                                                  {test.starting_line_number +
                                                    index}
                                                </span>
                                                <span className="text-green-600">
                                                  + {line}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </>
                                      )}
                                    </code>
                                  </pre>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  onClick={handleConfirmChanges}
                  className="w-full mb-6"
                  disabled={!isAnyTestSelected && mode !== "update"}
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
