"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import React, { useState } from "react";
import { CodeIcon, CopyIcon } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/esm/styles/prism";

import { useSyntaxTheme } from "@/hooks/useSyntaxTheme";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGUAGE_ITEMS = [
  {
    value: "curl",
    get label() {
      return translateUi("ui.addc90cfd45b0f45");
    },
  },
  {
    value: "python",
    get label() {
      return translateUi("ui.87d0227ecd5dabf7");
    },
  },
  {
    value: "javascript",
    get label() {
      return translateUi("ui.3175f6ca5e81de96");
    },
  },
] as const;
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PromptCodeSnippetsProps {
  promptId: string;
  model: string;
  promptVariables?: Record<string, string>;
  accessToken: string | null;
  version?: string;
  environment?: string;
  proxySettings?: {
    PROXY_BASE_URL?: string;
    LITELLM_UI_API_DOC_BASE_URL?: string | null;
  };
}

const PromptCodeSnippets: React.FC<PromptCodeSnippetsProps> = ({
  promptId,
  model,
  promptVariables = {},
  accessToken,
  version = "1",
  environment,
  proxySettings,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const syntaxTheme = useSyntaxTheme(coy);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"curl" | "python" | "javascript">("curl");
  const [selectedTab, setSelectedTab] = useState("basic");
  const [generatedCode, setGeneratedCode] = useState("");

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Determine base URL with priority: LITELLM_UI_API_DOC_BASE_URL > PROXY_BASE_URL > window.location.origin
  let apiBase = window.location.origin;
  const customDocBaseUrl = proxySettings?.LITELLM_UI_API_DOC_BASE_URL;
  if (customDocBaseUrl && customDocBaseUrl.trim()) {
    apiBase = customDocBaseUrl;
  } else if (proxySettings?.PROXY_BASE_URL) {
    apiBase = proxySettings.PROXY_BASE_URL;
  }

  const effectiveApiKey = accessToken || "<your-master-key>";

  // Generate code based on selected language and tab
  const generateCode = () => {
    const hasVariables = Object.keys(promptVariables).length > 0;
    const curlEnvironment = environment ? `,\n    "prompt_environment": "${environment}"` : "";
    const pythonEnvironment = environment ? `,\n        "prompt_environment": "${environment}"` : "";
    const jsEnvironment = environment ? `,\n        prompt_environment: "${environment}"` : "";

    if (selectedLanguage === "curl") {
      if (selectedTab === "basic") {
        return `curl -X POST '${apiBase}/chat/completions' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${effectiveApiKey}' \\
  -d '{
    "model": "${model}",
    "prompt_id": "${promptId}"${curlEnvironment}${
      hasVariables
        ? `,
    "prompt_variables": ${JSON.stringify(promptVariables, null, 6).replace(/\n/g, "\n    ")}`
        : ""
    }
  }' | jq`;
      } else if (selectedTab === "messages") {
        return `curl -X POST '${apiBase}/chat/completions' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${effectiveApiKey}' \\
  -d '{
    "model": "${model}",
    "prompt_id": "${promptId}"${curlEnvironment}${
      hasVariables
        ? `,
    "prompt_variables": ${JSON.stringify(promptVariables, null, 6).replace(/\n/g, "\n    ")}`
        : ""
    },
    "messages": [
      {
        "role": "user",
        "content": "hi"
      }
    ]
  }' | jq`;
      } else {
        return `curl -X POST '${apiBase}/chat/completions' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer ${effectiveApiKey}' \\
  -d '{
    "model": "${model}",
    "prompt_id": "${promptId}"${curlEnvironment},
    "prompt_version": ${version},
    "messages": [
      {
        "role": "user",
        "content": "Who are u"
      }
    ]
  }' | jq`;
      }
    } else if (selectedLanguage === "python") {
      const importCode = `import openai

client = openai.OpenAI(
    api_key="${effectiveApiKey}",
    base_url="${apiBase}"
)
`;
      if (selectedTab === "basic") {
        return `${importCode}
response = client.chat.completions.create(
    model="${model}",
    extra_body={
        "prompt_id": "${promptId}"${pythonEnvironment}${
          hasVariables
            ? `,
        "prompt_variables": ${JSON.stringify(promptVariables, null, 8).replace(/\n/g, "\n        ")}`
            : ""
        }
    }
)

print(response)`;
      } else if (selectedTab === "messages") {
        return `${importCode}
response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "user", "content": "hi"}
    ],
    extra_body={
        "prompt_id": "${promptId}"${pythonEnvironment}${
          hasVariables
            ? `,
        "prompt_variables": ${JSON.stringify(promptVariables, null, 8).replace(/\n/g, "\n        ")}`
            : ""
        }
    }
)

print(response)`;
      } else {
        return `${importCode}
response = client.chat.completions.create(
    model="${model}",
    messages=[
        {"role": "user", "content": "Who are u"}
    ],
    extra_body={
        "prompt_id": "${promptId}"${pythonEnvironment},
        "prompt_version": ${version}
    }
)

print(response)`;
      }
    } else {
      // JavaScript/Node.js
      const importCode = `import OpenAI from 'openai';

const client = new OpenAI({
    apiKey: "${effectiveApiKey}",
    baseURL: "${apiBase}"
});
`;
      if (selectedTab === "basic") {
        return `${importCode}
async function main() {
    const response = await client.chat.completions.create({
        model: "${model}",
        ${
          hasVariables
            ? `prompt_id: "${promptId}"${jsEnvironment},
        prompt_variables: ${JSON.stringify(promptVariables, null, 8).replace(/\n/g, "\n        ")}`
            : `prompt_id: "${promptId}"${jsEnvironment}`
        }
    });
    
    console.log(response);
}

main();`;
      } else if (selectedTab === "messages") {
        return `${importCode}
async function main() {
    const response = await client.chat.completions.create({
        model: "${model}",
        messages: [
            { role: "user", content: "hi" }
        ],
        ${
          hasVariables
            ? `prompt_id: "${promptId}"${jsEnvironment},
        prompt_variables: ${JSON.stringify(promptVariables, null, 8).replace(/\n/g, "\n        ")}`
            : `prompt_id: "${promptId}"${jsEnvironment}`
        }
    });
    
    console.log(response);
}

main();`;
      } else {
        return `${importCode}
async function main() {
    const response = await client.chat.completions.create({
        model: "${model}",
        messages: [
            { role: "user", content: "Who are u" }
        ],
        prompt_id: "${promptId}"${jsEnvironment},
        prompt_version: ${version}
    });
    
    console.log(response);
}

main();`;
      }
    }
  };

  // Update generated code when language, tab or props change
  React.useEffect(() => {
    if (isModalVisible) {
      setGeneratedCode(generateCode());
    }
  }, [isModalVisible, selectedLanguage, selectedTab, promptId, model, promptVariables, version, environment]);

  return (
    <>
      <Button variant="outline" onClick={showModal}>
        <CodeIcon />
        {uiT("ui.0e5a9bae4baaa90b")}
      </Button>

      <Dialog open={isModalVisible} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{uiT("ui.2b30133421f8727b")}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-between items-center mb-4">
            <div>
              <label htmlFor="prompt-code-language" className="font-medium block mb-1 text-foreground">
                {uiT("ui.a4fe65264ef7dbb3")}
              </label>
              <Select
                items={LANGUAGE_ITEMS}
                value={selectedLanguage}
                onValueChange={(value) => setSelectedLanguage(value as "curl" | "python" | "javascript")}
              >
                <SelectTrigger id="prompt-code-language" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                toast.success(translateUi("ui.916fa4a51e4d90e0"));
              }}
            >
              <CopyIcon />
              {uiT("ui.fa8f2b6c07fb514c")}
            </Button>
          </div>

          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(String(value))}>
            <TabsList aria-label={uiT("ui.7bd28d987680e719")}>
              <TabsTrigger value="basic">{uiT("ui.0e35f6e9742e074d")}</TabsTrigger>
              <TabsTrigger value="messages">{uiT("ui.8be4102ef3ba45fc")}</TabsTrigger>
              <TabsTrigger value="version">{uiT("ui.2d0326c1283ef519")}</TabsTrigger>
            </TabsList>
          </Tabs>

          <SyntaxHighlighter
            language={selectedLanguage === "curl" ? "bash" : selectedLanguage === "python" ? "python" : "javascript"}
            style={syntaxTheme}
            wrapLines={true}
            wrapLongLines={true}
            className="rounded-md mt-0"
            customStyle={{
              maxHeight: "60vh",
              overflowY: "auto",
              marginTop: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            }}
          >
            {generatedCode}
          </SyntaxHighlighter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PromptCodeSnippets;
