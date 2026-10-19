"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { Code, CircleAlert, CirclePlay, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/shared/Alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ModelSelector from "@/components/common_components/ModelSelector";
import { TestResult } from "./semanticFilterTestUtils";

interface MCPSemanticFilterTestPanelProps {
  accessToken: string | null;
  testQuery: string;
  setTestQuery: (value: string) => void;
  testModel: string | null;
  setTestModel: (value: string | null) => void;
  isTesting: boolean;
  onTest: () => void;
  filterEnabled: boolean;
  testResult: TestResult | null;
  testError: string | null;
  curlCommand: string;
}

export default function MCPSemanticFilterTestPanel({
  accessToken,
  testQuery,
  setTestQuery,
  testModel,
  setTestModel,
  isTesting,
  onTest,
  filterEnabled,
  testResult,
  testError,
  curlCommand,
}: MCPSemanticFilterTestPanelProps) {
  const { t: uiT } = useDashboardLanguage();

  const canRunTest = testQuery && testModel && filterEnabled;
  const testDisabled = isTesting || !canRunTest;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{uiT("ui.6135706d1f477a64")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="test">
          <TabsList>
            <TabsTrigger value="test" className="flex-none">
              {uiT("ui.532eaabd9574880d")}
            </TabsTrigger>
            <TabsTrigger value="api" className="flex-none">
              {uiT("ui.ab70b7ebd732a14c")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <div className="flex w-full flex-col gap-6">
              <div>
                <p className="mb-2 flex items-center gap-1.5 font-medium">
                  <CirclePlay className="size-4" /> {uiT("ui.3d717d326a9b7715")}
                </p>
                <Textarea
                  className="field-sizing-fixed"
                  placeholder={uiT("ui.926f2a978070b11c")}
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  rows={4}
                  disabled={isTesting}
                />
              </div>

              <div>
                <ModelSelector
                  accessToken={accessToken || ""}
                  value={testModel}
                  onChange={setTestModel}
                  disabled={isTesting}
                  showLabel={true}
                  labelText="Select Model"
                />
              </div>

              <Button className="w-full" onClick={onTest} disabled={testDisabled}>
                <CirclePlay />
                {uiT("ui.0029e9b270d697d2")}
              </Button>

              {!filterEnabled && (
                <Alert>
                  <Info />
                  <AlertTitle>{uiT("ui.9c6da2211b4bf170")}</AlertTitle>
                  <AlertDescription>{uiT("ui.6e45a81dbc63be21")}</AlertDescription>
                </Alert>
              )}

              {testError && (
                <Alert variant="destructive" className="mb-4">
                  <CircleAlert />
                  <AlertTitle>{uiT("ui.a149e7c27ac65992")}</AlertTitle>
                  <AlertDescription>{testError}</AlertDescription>
                </Alert>
              )}

              {testResult && (
                <div>
                  <h5 className="mb-2 text-base font-medium">{uiT("ui.219c4a6c86a716e9")}</h5>
                  <Alert className="mb-4">
                    <Info />
                    <AlertTitle>
                      {testResult.selectedTools} {uiT("ui.28391d3bc64ec15c")} {testResult.totalTools}{" "}
                      {uiT("ui.f57e3e0261a3aa4d")}
                    </AlertTitle>
                    <AlertDescription>
                      {testResult.totalTools - testResult.selectedTools} {uiT("ui.04eaa3e661c663a4")}
                    </AlertDescription>
                  </Alert>
                  <div>
                    <p className="mb-2 block font-medium">{uiT("ui.bc5ad0fbb8776158")}</p>
                    <ul className="m-0 list-disc pl-5">
                      {testResult.tools.map((tool, index) => (
                        <li key={index} className="mb-1">
                          <span>{tool}</span>
                        </li>
                      ))}
                    </ul>
                    {testResult.selectedTools > testResult.tools.length && (
                      <p className="mt-2 block text-sm text-muted-foreground">
                        +{testResult.selectedTools - testResult.tools.length} {uiT("ui.8f602b23ee2b0dfe")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="api">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Code className="size-4" />
                <p className="font-medium">{uiT("ui.ab70b7ebd732a14c")}</p>
              </div>
              <p className="mb-2 block text-sm text-muted-foreground">{uiT("ui.2274414da846ac1f")}</p>
              <p className="mb-2 block font-medium">{uiT("ui.4698d86c97ef7dff")}</p>
              <ul className="mt-0 mr-0 mb-3 ml-0 list-disc pl-5">
                <li>
                  <span>{uiT("ui.431f9ad1c4ed66f6")}</span>
                  <span className="block text-sm text-muted-foreground">{uiT("ui.c87086c0286ea6a8")}</span>
                </li>
                <li>
                  <span>{uiT("ui.bc46450d2ba13a5b")}</span>
                  <span className="block text-sm text-muted-foreground">{uiT("ui.44e947c4e54f418f")}</span>
                </li>
              </ul>
              <pre className="m-0 overflow-auto rounded-sm bg-muted p-3 text-xs">{curlCommand}</pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
