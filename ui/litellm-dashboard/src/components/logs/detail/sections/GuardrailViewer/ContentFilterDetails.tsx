"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";

export interface ContentFilterDetection {
  type: "pattern" | "blocked_word" | "category_keyword";
  pattern_name?: string;
  // matched_text is intentionally excluded to avoid exposing sensitive content
  keyword?: string;
  category?: string;
  severity?: string;
  action: "BLOCK" | "MASK";
  description?: string;
}

interface ContentFilterDetailsProps {
  response: ContentFilterDetection[] | string | null | undefined;
}

const chip = (text: React.ReactNode, tone: "green" | "red" | "blue" | "slate" | "amber" = "slate") => {
  const map: Record<string, string> = {
    green: "bg-success/15 text-success",
    red: "bg-destructive/15 text-destructive",
    blue: "bg-info/10 text-info",
    slate: "bg-muted text-foreground",
    amber: "bg-warning/15 text-warning",
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-medium inline-block ${map[tone]}`}>{text}</span>;
};

interface SectionProps {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, count, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 bg-muted cursor-pointer hover:bg-accent"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center">
          <svg
            className={`w-5 h-5 mr-2 transition-transform ${open ? "transform rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h5 className="font-medium">
            {title} {typeof count === "number" && <span className="text-muted-foreground font-normal">({count})</span>}
          </h5>
        </div>
      </div>
      {open && <div className="p-3 border-t bg-card">{children}</div>}
    </div>
  );
};

interface KVProps {
  label: string;
  children?: React.ReactNode;
  mono?: boolean;
}

const KV: React.FC<KVProps> = ({ label, children, mono }) => (
  <div className="flex">
    <span className="font-medium w-1/3">{label}</span>
    <span className={mono ? "font-mono text-sm break-all" : ""}>{children}</span>
  </div>
);

const ContentFilterDetails: React.FC<ContentFilterDetailsProps> = ({ response }) => {
  const { t: uiT } = useDashboardLanguage();

  // Handle case where response is a string (error message) or null
  if (!response || typeof response === "string") {
    if (typeof response === "string" && response) {
      return (
        <div className="bg-card rounded-lg border border-destructive/20 p-4">
          <div className="text-destructive">
            <h5 className="font-medium mb-2">{uiT("ui.54a0e8c17ebb")}</h5>
            <p className="text-sm">{response}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Ensure response is an array
  const detections: ContentFilterDetection[] = Array.isArray(response) ? response : [];

  if (detections.length === 0) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="text-muted-foreground text-sm">{uiT("ui.2a78671613e8")}</div>
      </div>
    );
  }

  // Group detections by type
  const patterns = detections.filter((d) => d.type === "pattern");
  const blockedWords = detections.filter((d) => d.type === "blocked_word");
  const categoryKeywords = detections.filter((d) => d.type === "category_keyword");

  // Count actions
  const blockedCount = detections.filter((d) => d.action === "BLOCK").length;
  const maskedCount = detections.filter((d) => d.action === "MASK").length;

  // Summary stats
  const totalDetections = detections.length;

  return (
    <div className="space-y-3">
      {/* Summary Section */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <KV label={uiT("ui.c8a7dc507afa")}>
              <span className="font-semibold">{totalDetections}</span>
            </KV>
            <KV label={uiT("ui.bd5127e3c5ac")}>
              <div className="flex flex-wrap gap-2">
                {blockedCount > 0 && chip(`${blockedCount} blocked`, "red")}
                {maskedCount > 0 && chip(`${maskedCount} masked`, "blue")}
                {blockedCount === 0 && maskedCount === 0 && chip("passed", "green")}
              </div>
            </KV>
          </div>
          <div className="space-y-2">
            <KV label={uiT("ui.9bcc57767312")}>
              <div className="flex flex-wrap gap-2">
                {patterns.length > 0 && chip(`${patterns.length} patterns`, "slate")}
                {blockedWords.length > 0 && chip(`${blockedWords.length} keywords`, "slate")}
                {categoryKeywords.length > 0 && chip(`${categoryKeywords.length} categories`, "slate")}
              </div>
            </KV>
          </div>
        </div>
      </div>

      {/* Patterns Section */}
      {patterns.length > 0 && (
        <Section title={uiT("ui.7ab91d64627b")} count={patterns.length} defaultOpen={true}>
          <div className="space-y-2">
            {patterns.map((detection, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <KV label={uiT("ui.506256322089")}>{detection.pattern_name || "unknown"}</KV>
                  </div>
                  <div className="space-y-1">
                    <KV label={uiT("ui.7d9fda4ea853")}>
                      {chip(detection.action, detection.action === "BLOCK" ? "red" : "blue")}
                    </KV>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Blocked Words Section */}
      {blockedWords.length > 0 && (
        <Section title={uiT("ui.e01083b5ffd6")} count={blockedWords.length} defaultOpen={true}>
          <div className="space-y-2">
            {blockedWords.map((detection, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <KV label={uiT("ui.cc0d4aae087f")} mono>
                      {detection.keyword || "unknown"}
                    </KV>
                    {detection.description && <KV label={uiT("ui.0cf2814604b4")}>{detection.description}</KV>}
                  </div>
                  <div className="space-y-1">
                    <KV label={uiT("ui.7d9fda4ea853")}>
                      {chip(detection.action, detection.action === "BLOCK" ? "red" : "blue")}
                    </KV>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Category Keywords Section */}
      {categoryKeywords.length > 0 && (
        <Section title={uiT("ui.6ce6e35bbebf")} count={categoryKeywords.length} defaultOpen={true}>
          <div className="space-y-2">
            {categoryKeywords.map((detection, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <KV label={uiT("ui.b330d6701b55")}>{detection.category || "unknown"}</KV>
                    <KV label={uiT("ui.cc0d4aae087f")} mono>
                      {detection.keyword || "unknown"}
                    </KV>
                    {detection.severity && (
                      <KV label={uiT("ui.ce9bf63abbec")}>
                        {chip(
                          detection.severity,
                          detection.severity === "high" ? "red" : detection.severity === "medium" ? "amber" : "slate",
                        )}
                      </KV>
                    )}
                  </div>
                  <div className="space-y-1">
                    <KV label={uiT("ui.7d9fda4ea853")}>
                      {chip(detection.action, detection.action === "BLOCK" ? "red" : "blue")}
                    </KV>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Raw JSON (for debugging) */}
      <Section title={uiT("ui.c388689ffcc9")} defaultOpen={false}>
        <pre className="bg-muted rounded-sm p-3 text-xs overflow-x-auto">{JSON.stringify(detections, null, 2)}</pre>
      </Section>
    </div>
  );
};

export default ContentFilterDetails;
