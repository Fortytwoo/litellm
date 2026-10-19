"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import PatternTable from "./PatternTable";
import KeywordTable from "./KeywordTable";
import CategoryTable from "./CategoryTable";

interface Pattern {
  id: string;
  type: "prebuilt" | "custom";
  name: string;
  display_name?: string;
  pattern?: string;
  action: "BLOCK" | "MASK";
}

interface BlockedWord {
  id: string;
  keyword: string;
  action: "BLOCK" | "MASK";
  description?: string;
}

interface ContentCategory {
  id: string;
  category: string;
  display_name: string;
  action: "BLOCK" | "MASK";
  severity_threshold: "high" | "medium" | "low";
}

interface ContentFilterDisplayProps {
  patterns: Pattern[];
  blockedWords: BlockedWord[];
  categories?: ContentCategory[];
  readOnly?: boolean;
  onPatternActionChange?: (id: string, action: "BLOCK" | "MASK") => void;
  onPatternRemove?: (id: string) => void;
  onBlockedWordUpdate?: (id: string, field: string, value: any) => void;
  onBlockedWordRemove?: (id: string) => void;
  onCategoryActionChange?: (id: string, action: "BLOCK" | "MASK") => void;
  onCategorySeverityChange?: (id: string, severity: "high" | "medium" | "low") => void;
  onCategoryRemove?: (id: string) => void;
}

const ContentFilterDisplay: React.FC<ContentFilterDisplayProps> = ({
  patterns,
  blockedWords,
  categories = [],
  readOnly = true,
  onPatternActionChange,
  onPatternRemove,
  onBlockedWordUpdate,
  onBlockedWordRemove,
  onCategoryActionChange,
  onCategorySeverityChange,
  onCategoryRemove,
}) => {
  const { t: uiT } = useDashboardLanguage();

  if (patterns.length === 0 && blockedWords.length === 0 && categories.length === 0) {
    return null;
  }

  // No-op handlers for read-only mode
  const noOp = () => {};

  return (
    <>
      {categories.length > 0 && (
        <Card className="mt-6">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">{uiT("ui.9f86bb49e94e67ee")}</p>
              <Badge variant="secondary">
                {categories.length} {uiT("ui.aa16083ef16d9bd7")}
              </Badge>
            </div>
            <CategoryTable
              categories={categories}
              onActionChange={readOnly ? undefined : onCategoryActionChange}
              onSeverityChange={readOnly ? undefined : onCategorySeverityChange}
              onRemove={readOnly ? undefined : onCategoryRemove}
              readOnly={readOnly}
            />
          </CardContent>
        </Card>
      )}

      {patterns.length > 0 && (
        <Card className="mt-6">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">{uiT("ui.150361a3fa9f8f75")}</p>
              <Badge variant="secondary">
                {patterns.length} {uiT("ui.42b2d421ad337f36")}
              </Badge>
            </div>
            <PatternTable
              patterns={patterns}
              onActionChange={readOnly ? noOp : onPatternActionChange || noOp}
              onRemove={readOnly ? noOp : onPatternRemove || noOp}
            />
          </CardContent>
        </Card>
      )}

      {blockedWords.length > 0 && (
        <Card className="mt-6">
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">{uiT("ui.161a9bd671ffa96e")}</p>
              <Badge variant="secondary">
                {blockedWords.length} {uiT("ui.2afb9284a98a32f4")}
              </Badge>
            </div>
            <KeywordTable
              keywords={blockedWords}
              onActionChange={readOnly ? noOp : onBlockedWordUpdate || noOp}
              onRemove={readOnly ? noOp : onBlockedWordRemove || noOp}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ContentFilterDisplay;
