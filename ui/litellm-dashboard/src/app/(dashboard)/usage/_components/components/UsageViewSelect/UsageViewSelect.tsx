"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { BarChart3, Bot, Building2, Globe, LineChart, ShoppingCart, Tags, User, Users } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasCapability, type Capability } from "@/utils/capabilities";
import { all_admin_roles } from "@/utils/roles";
export type UsageOption =
  | "global"
  | "my-usage"
  | "organization"
  | "team"
  | "customer"
  | "tag"
  | "agent"
  | "user"
  | "user-agent-activity";
export interface UsageViewSelectProps {
  value: UsageOption;
  onChange: (value: UsageOption) => void;
  userRole: string | null;
  canViewTagUsage?: boolean;
  isOrgAdmin?: boolean;
  title?: string;
  description?: string;
  "data-id"?: string;
}
interface OptionConfig {
  value: UsageOption;
  label: string;
  description: string;
  icon: React.ReactNode;
  capability?: Capability;
  adminOnly?: boolean;
  showForAdmin?: string;
  showForNonAdmin?: string;
  descriptionForAdmin?: string;
  descriptionForNonAdmin?: string;
  badgeText?: string;
}
const OPTIONS: OptionConfig[] = [
  {
    value: "global",
    get label() {
      return translateUi("ui.14f27c673e3ee58d");
    },
    showForAdmin: "Global Usage",
    showForNonAdmin: "Your Usage",
    get description() {
      return translateUi("ui.1cee5cd479cf22a1");
    },
    descriptionForAdmin: "View usage across all resources",
    descriptionForNonAdmin: "View your usage",
    icon: <Globe className="size-4" />,
  },
  {
    value: "my-usage",
    get label() {
      return translateUi("ui.d95886b19fe9423d");
    },
    get description() {
      return translateUi("ui.d56e9d199448833d");
    },
    icon: <User className="size-4" />,
    adminOnly: true,
  },
  {
    value: "organization",
    get label() {
      return translateUi("ui.6d72b0ca2ae8cce8");
    },
    get description() {
      return translateUi("ui.8a3447cea40d4ee4");
    },
    icon: <Building2 className="size-4" />,
    capability: "viewOrganizationUsage",
  },
  {
    value: "team",
    get label() {
      return translateUi("ui.f9989642a5c6e674");
    },
    get description() {
      return translateUi("ui.eac5e2363930e82d");
    },
    icon: <Users className="size-4" />,
  },
  {
    value: "customer",
    get label() {
      return translateUi("ui.7f0b3f8aa696bdff");
    },
    get description() {
      return translateUi("ui.c67d4ae1a18592ec");
    },
    icon: <ShoppingCart className="size-4" />,
    adminOnly: true,
  },
  {
    value: "tag",
    get label() {
      return translateUi("ui.ed09f955510a0342");
    },
    get description() {
      return translateUi("ui.fca8bfc489a2af3f");
    },
    icon: <Tags className="size-4" />,
    adminOnly: true,
  },
  {
    value: "agent",
    get label() {
      return translateUi("ui.610f974291f8a496");
    },
    get description() {
      return translateUi("ui.ea2cef77da674a97");
    },
    icon: <Bot className="size-4" />,
    capability: "viewAgentUsage",
  },
  {
    value: "user",
    get label() {
      return translateUi("ui.04f6c8591b42ba29");
    },
    get description() {
      return translateUi("ui.43847c21df35bb7a");
    },
    icon: <User className="size-4" />,
    adminOnly: true,
  },
  {
    value: "user-agent-activity",
    get label() {
      return translateUi("ui.279564c6a6a7007c");
    },
    get description() {
      return translateUi("ui.1fdbd175372c7dad");
    },
    icon: <LineChart className="size-4" />,
    adminOnly: true,
  },
];
export const UsageViewSelect: React.FC<UsageViewSelectProps> = ({
  value,
  onChange,
  userRole,
  canViewTagUsage = false,
  isOrgAdmin = false,
  title = translateUi("ui.8d59829c1e15"),
  description = translateUi("ui.6378e9856f0d817e"),
  "data-id": dataId,
}) => {
  useDashboardLanguage();

  const isAdmin = all_admin_roles.includes(userRole ?? "");
  const getFilteredOptions = () => {
    return OPTIONS.filter((option) => {
      if (option.capability) {
        return hasCapability(userRole, option.capability, isOrgAdmin);
      }
      if (option.value === "tag" && canViewTagUsage) {
        return true;
      }
      if (option.adminOnly && !isAdmin) {
        return false;
      }
      return true;
    }).map((option) => {
      let label = option.label;
      let desc = option.description;
      if (option.showForAdmin && option.showForNonAdmin) {
        label = isAdmin ? option.showForAdmin : option.showForNonAdmin;
      }
      if (option.descriptionForAdmin && option.descriptionForNonAdmin) {
        desc = isAdmin ? option.descriptionForAdmin : option.descriptionForNonAdmin;
      }
      return {
        value: option.value,
        label,
        description: desc,
        icon: option.icon,
        badgeText: option.badgeText,
      };
    });
  };
  const filteredOptions = getFilteredOptions();
  const selectedOption = filteredOptions.find((option) => option.value === value);
  return (
    <div className="flex items-center gap-3" data-id={dataId}>
      <h1 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <BarChart3 aria-hidden="true" className="size-4" strokeWidth={2} />
        {title}
      </h1>
      <Select
        value={value}
        onValueChange={(next: UsageOption | null) => {
          if (next) onChange(next);
        }}
      >
        <SelectTrigger aria-label={description} className="h-8 w-52">
          <SelectValue>
            {selectedOption && (
              <span className="flex items-center gap-2">
                {selectedOption.icon}
                <span className="text-sm">{selectedOption.label}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        {/* Sized to its content rather than the narrow trigger, so descriptions never clip. */}
        <SelectContent align="start" className="w-auto min-w-72 p-1">
          {filteredOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="rounded-md py-2 pr-8 pl-2">
              <span className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 text-muted-foreground">{option.icon}</span>
                <span className="min-w-0">
                  <span className="block text-sm leading-5 text-foreground">{option.label}</span>
                  <span className="block text-xs leading-4 text-muted-foreground">{option.description}</span>
                </span>
                {option.badgeText && <Badge>{option.badgeText}</Badge>}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
