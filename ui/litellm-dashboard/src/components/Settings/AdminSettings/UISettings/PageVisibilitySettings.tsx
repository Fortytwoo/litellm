"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { getAvailablePages } from "@/components/page_utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PageVisibilitySettingsProps {
  enabledPagesInternalUsers: string[] | null | undefined;
  enabledPagesPropertyDescription?: string;
  isUpdating: boolean;
  onUpdate: (settings: { enabled_ui_pages_internal_users: string[] | null }) => void;
}

export default function PageVisibilitySettings({
  enabledPagesInternalUsers,
  enabledPagesPropertyDescription,
  isUpdating,
  onUpdate,
}: PageVisibilitySettingsProps) {
  const { t: uiT } = useDashboardLanguage();

  const isPageVisibilitySet = enabledPagesInternalUsers !== null && enabledPagesInternalUsers !== undefined;
  const availablePages = useMemo(() => getAvailablePages(), []);
  const pagesByGroup = useMemo(() => {
    const grouped: Record<string, typeof availablePages> = {};
    availablePages.forEach((page) => {
      if (!grouped[page.group]) {
        grouped[page.group] = [];
      }
      grouped[page.group].push(page);
    });
    return grouped;
  }, [availablePages]);
  const [selectedPages, setSelectedPages] = useState<string[]>(enabledPagesInternalUsers || []);

  useMemo(() => {
    setSelectedPages(enabledPagesInternalUsers || []);
  }, [enabledPagesInternalUsers]);

  const togglePage = (page: string, checked: boolean) => {
    setSelectedPages((current) => (checked ? [...current, page] : current.filter((item) => item !== page)));
  };

  const handleSavePageVisibility = () => {
    onUpdate({ enabled_ui_pages_internal_users: selectedPages.length > 0 ? selectedPages : null });
  };

  const handleResetToDefault = () => {
    setSelectedPages([]);
    onUpdate({ enabled_ui_pages_internal_users: null });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{uiT("ui.d22de6446c62ec1c")}</p>
          <Badge variant={isPageVisibilitySet ? "secondary" : "outline"}>
            {isPageVisibilitySet
              ? uiT("ui.3c2076e6bcfa1213", {
                  v0: String(selectedPages.length),
                  v1: String(selectedPages.length !== 1 ? uiT("inflections.s") : ""),
                })
              : uiT("ui.81da18bb74ddffa8")}
          </Badge>
        </div>
        {enabledPagesPropertyDescription && (
          <p className="text-sm text-muted-foreground">{enabledPagesPropertyDescription}</p>
        )}
        <p className="text-xs italic text-muted-foreground">{uiT("ui.94b9765952fdcb3e")}</p>
        <p className="text-xs text-primary">{uiT("ui.a9b69c93b66773d6")}</p>
      </div>

      <Collapsible className="rounded-lg border border-border">
        <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">
          {uiT("ui.af13ae462104277c")}
          <ChevronDown className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border p-4">
          <div className="space-y-4">
            {Object.entries(pagesByGroup).map(([groupName, pages]) => (
              <fieldset key={groupName} className="space-y-2">
                <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {groupName}
                </legend>
                <div className="ml-4 space-y-2">
                  {pages.map((page) => {
                    const checkboxId = `page-visibility-${page.page}`;
                    return (
                      <label key={page.page} htmlFor={checkboxId} className="flex cursor-pointer items-start gap-2">
                        <Checkbox
                          id={checkboxId}
                          checked={selectedPages.includes(page.page)}
                          onCheckedChange={(checked) => togglePage(page.page, checked === true)}
                        />
                        <span className="space-y-0.5">
                          <span className="block text-sm text-foreground">{page.label}</span>
                          <span className="block text-xs text-muted-foreground">{page.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSavePageVisibility} disabled={isUpdating}>
                {uiT("ui.380d73cb877b1fe5")}
              </Button>
              {isPageVisibilitySet && (
                <Button type="button" variant="outline" onClick={handleResetToDefault} disabled={isUpdating}>
                  {uiT("ui.2e8b71b7d201a991")}
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
