"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import CopyButton from "@/components/shared/CopyButton";
import { buildCurlCommand, type CurlCommandInput } from "./lib/curlCommand";

interface CurlPreviewProps extends CurlCommandInput {
  errorCount?: number;
}

export default function CurlPreview({ errorCount = 0, ...input }: CurlPreviewProps) {
  const { t: uiT } = useDashboardLanguage();

  const command = buildCurlCommand(input);
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md border">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2 text-sm">
        <span className="font-medium">{uiT("ui.715206eced6f2769")}</span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {errorCount > 0 ? (
            <span role="alert" className="text-destructive">
              {uiT("ui.21f1595b614ffc31")} {errorCount}{" "}
              {errorCount === 1 ? uiT("ui.4a502846d070e208") : uiT("ui.02e3fe5aad80ca85")} {uiT("ui.858e0cf88d1de16a")}
            </span>
          ) : (
            <>
              <span>{uiT("ui.46241f5a6f525063")}</span>
              <CopyButton value={command} label={uiT("ui.3f3eb4db8737b301")} variant="action" />
            </>
          )}
        </div>
      </div>
      <pre
        aria-label="cURL request"
        className="m-0 min-h-0 flex-1 overflow-auto whitespace-pre-wrap wrap-anywhere px-3 py-3 font-mono text-xs leading-5"
      >
        {command}
      </pre>
    </div>
  );
}
