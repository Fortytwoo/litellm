"use client";
import { LocalizedText } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";
import { projectReaderRoles } from "@/app/(dashboard)/hooks/projects/projectAccess";
import {
  Activity,
  Aperture,
  BarChart3,
  Bell,
  Blocks,
  Bot,
  BookOpen,
  Building2,
  Boxes,
  Code2,
  Database,
  FileText,
  FlaskConical,
  Folder,
  HeartPulse,
  House,
  KeyRound,
  LayoutGrid,
  Network,
  Palette,
  PiggyBank,
  PlayCircle,
  Route,
  ScrollText,
  Search,
  Server,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  Tags,
  Terminal,
  Trophy,
  User,
  Users,
  Wallet,
  Wrench,
  Workflow,
} from "lucide-react";
import { rolesWithCapability } from "../utils/capabilities";
import {
  all_admin_roles,
  internalUserRoles,
  rolesAllowedToViewWriteScopedPages,
  rolesWithWriteAccess,
} from "../utils/roles";
import BetaBadge from "./BetaBadge";
import { gatewayText } from "@/components/managed-gateway/locale";

const ICON = { strokeWidth: 1.75 } as const;

export interface MenuItem {
  key: string;
  page: string;
  route?: string;
  label: string | React.ReactNode;
  roles?: string[];
  children?: MenuItem[];
  icon?: React.ReactNode;
  external_url?: string;
}

export interface MenuGroup {
  groupLabel: string;
  items: MenuItem[];
  roles?: string[];
}

export const menuGroups: MenuGroup[] = [
  {
    get groupLabel() {
      return translateUi("ui.326e75f98f6d");
    },
    items: [
      {
        key: "home",
        page: "home",
        get label() {
          return translateUi("ui.3a78695388b3");
        },
        icon: <House {...ICON} />,
      },
      {
        key: "api-keys",
        page: "api-keys",
        get label() {
          return translateUi("ui.d1c0ad6c4bdd");
        },
        icon: <KeyRound {...ICON} />,
      },
      {
        key: "llm-playground",
        page: "llm-playground",
        route: "playground",
        get label() {
          return translateUi("ui.a6273fb551f2");
        },
        icon: <PlayCircle {...ICON} />,
        roles: rolesWithWriteAccess,
      },
      {
        key: "models",
        page: "models",
        route: "models-and-endpoints",
        get label() {
          return translateUi("ui.4e7cc82a7500");
        },
        icon: <Network {...ICON} />,
        roles: rolesAllowedToViewWriteScopedPages,
      },
      {
        key: "agentic",
        page: "agentic",
        get label() {
          return translateUi("ui.7b1f65c25801");
        },
        icon: <Bot {...ICON} />,
        children: [
          {
            key: "agents",
            page: "agents",
            get label() {
              return translateUi("ui.279b44d2ab4b");
            },
            icon: <Bot {...ICON} />,
            roles: rolesAllowedToViewWriteScopedPages,
          },
          {
            key: "workflows",
            page: "workflows",
            get label() {
              return translateUi("ui.a444842d2c72");
            },
            icon: <Workflow {...ICON} />,
            roles: rolesWithCapability("viewWorkflowRuns"),
          },
          {
            key: "memory",
            page: "memory",
            get label() {
              return translateUi("ui.c3963aedaac6");
            },
            icon: <Database {...ICON} />,
            roles: rolesWithCapability("viewMemory"),
          },
        ],
      },
      {
        key: "mcp-servers",
        page: "mcp-servers",
        get label() {
          return translateUi("ui.aab669a72882");
        },
        icon: <Server {...ICON} />,
      },
      {
        key: "skills",
        page: "skills",
        get label() {
          return translateUi("ui.66d0f523a379");
        },
        icon: <Blocks {...ICON} />,
        roles: all_admin_roles,
      },
      {
        key: "guardrails",
        page: "guardrails",
        get label() {
          return translateUi("ui.443f975eefe8");
        },
        icon: <Shield {...ICON} />,
      },
      {
        key: "policies",
        page: "policies",
        get label() {
          return translateUi("ui.d3ad1f1f8c9c");
        },
        icon: <ScrollText {...ICON} />,
        roles: rolesWithCapability("viewPolicies"),
      },
      {
        key: "tools",
        page: "tools",
        get label() {
          return translateUi("ui.ea93d6a262ec");
        },
        icon: <Wrench {...ICON} />,
        children: [
          {
            key: "search-tools",
            page: "search-tools",
            get label() {
              return translateUi("ui.fe89927555f6");
            },
            icon: <Search {...ICON} />,
          },
          {
            key: "vector-stores",
            page: "vector-stores",
            get label() {
              return translateUi("ui.a6110d660e9b");
            },
            icon: <Database {...ICON} />,
          },
          {
            key: "tool-policies",
            page: "tool-policies",
            get label() {
              return translateUi("ui.cc107f23e985");
            },
            icon: <ShieldCheck {...ICON} />,
            roles: rolesWithCapability("viewToolPolicies"),
          },
        ],
      },
    ],
  },
  {
    get groupLabel() {
      return translateUi("ui.c2fd58c653bb");
    },
    get items() {
      return [
        {
          key: "new_usage",
          page: "new_usage",
          route: "usage",
          icon: <BarChart3 {...ICON} />,
          roles: [...all_admin_roles, ...internalUserRoles],
          get label() {
            return translateUi("ui.8d59829c1e15");
          },
        },
        {
          key: "model-insights",
          page: "model-insights",
          icon: <Trophy {...ICON} />,
          roles: all_admin_roles,
          label: (
            <span className="flex items-center gap-2">
              <LocalizedText text={translateUi("ui.da4b87541cc2703b")} /> <BetaBadge />
            </span>
          ),
        },
        {
          key: "cost-optimization",
          page: "cost-optimization",
          icon: <PiggyBank {...ICON} />,
          roles: [...all_admin_roles, ...internalUserRoles],
          get label() {
            return translateUi("ui.b32e75776536");
          },
        },
        {
          key: "logs",
          page: "logs",
          get label() {
            return translateUi("ui.ea2100dc89ae");
          },
          icon: <Activity {...ICON} />,
        },
        {
          key: "lens",
          page: "lens",
          label: (
            <span className="flex items-center gap-2">
              Lens <BetaBadge />
            </span>
          ),
          icon: <Aperture {...ICON} />,
        },
        {
          key: "guardrails-monitor",
          page: "guardrails-monitor",
          get label() {
            return translateUi("ui.896cc56be8d7");
          },
          icon: <HeartPulse {...ICON} />,
          roles: rolesWithCapability("viewGuardrailUsage"),
        },
      ];
    },
  },
  {
    get groupLabel() {
      return translateUi("ui.cc552ea09227");
    },
    items: [
      {
        key: "teams",
        page: "teams",
        get label() {
          return translateUi("ui.1e1a1c078af2");
        },
        icon: <Users {...ICON} />,
      },
      {
        key: "projects",
        page: "projects",
        label: (
          <span className="flex items-center gap-2">
            <LocalizedText id="ui.04e2a9728af7" /> <BetaBadge />
          </span>
        ),
        icon: <Folder {...ICON} />,
        roles: [...projectReaderRoles],
      },
      {
        key: "users",
        page: "users",
        get label() {
          return translateUi("ui.0f1f49782746");
        },
        icon: <User {...ICON} />,
        roles: all_admin_roles,
      },
      {
        key: "organizations",
        page: "organizations",
        get label() {
          return translateUi("ui.2730183d6b77");
        },
        icon: <Building2 {...ICON} />,
        roles: all_admin_roles,
      },
      {
        key: "access-groups",
        page: "access-groups",
        get label() {
          return translateUi("ui.b0252ccc6e86");
        },
        icon: <Boxes {...ICON} />,
        roles: all_admin_roles,
      },
      {
        key: "budgets",
        page: "budgets",
        get label() {
          return translateUi("ui.a1a06e046b0b");
        },
        icon: <Wallet {...ICON} />,
        roles: all_admin_roles,
      },
    ],
  },
  {
    get groupLabel() {
      return translateUi("ui.7b4c40b08aef");
    },
    items: [
      {
        key: "api_ref",
        page: "api_ref",
        route: "api-reference",
        get label() {
          return translateUi("ui.0b40234a6136");
        },
        icon: <Code2 {...ICON} />,
      },
      {
        key: "model-hub-table",
        page: "model-hub-table",
        get label() {
          return translateUi("ui.dc459287898f");
        },
        icon: <LayoutGrid {...ICON} />,
      },
      {
        key: "learning-resources",
        page: "learning-resources",
        get label() {
          return translateUi("ui.abcc1ffcd57b");
        },
        icon: <BookOpen {...ICON} />,
        external_url: "https://models.litellm.ai/cookbook",
      },
      {
        key: "caching",
        page: "caching",
        get label() {
          return translateUi("ui.f98832fd0834");
        },
        icon: <Database {...ICON} />,
        roles: all_admin_roles,
      },
      {
        key: "experimental",
        page: "experimental",
        get label() {
          return translateUi("ui.3dc9f569422d");
        },
        icon: <FlaskConical {...ICON} />,
        children: [
          {
            key: "prompts",
            page: "prompts",
            get label() {
              return translateUi("ui.5f2e66e65397");
            },
            icon: <FileText {...ICON} />,
            roles: rolesWithCapability("viewPrompts"),
          },
          {
            key: "transform-request",
            page: "transform-request",
            get label() {
              return translateUi("ui.981cdf913246");
            },
            icon: <Terminal {...ICON} />,
            roles: [...all_admin_roles, ...internalUserRoles],
          },
          {
            key: "tag-management",
            page: "tag-management",
            get label() {
              return translateUi("ui.ffad9c9950e0");
            },
            icon: <Tags {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "4",
            page: "usage",
            route: "old-usage",
            get label() {
              return translateUi("ui.ccc365e314a5");
            },
            icon: <BarChart3 {...ICON} />,
            roles: rolesWithCapability("viewGlobalSpend"),
          },
        ],
      },
    ],
  },
  {
    get groupLabel() {
      return translateUi("ui.02f6ea12816a");
    },
    roles: all_admin_roles,
    items: [
      {
        key: "settings",
        page: "settings",
        get label() {
          return translateUi("ui.74a883a037bc");
        },
        icon: <SettingsIcon {...ICON} />,
        roles: all_admin_roles,
        children: [
          {
            key: "router-settings",
            page: "router-settings",
            get label() {
              return translateUi("ui.c4b306b8f296");
            },
            icon: <Route {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "logging-and-alerts",
            page: "logging-and-alerts",
            get label() {
              return translateUi("ui.44eb986e13c6");
            },
            icon: <Bell {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "admin-panel",
            page: "admin-panel",
            get label() {
              return translateUi("ui.bf478a0088e6");
            },
            icon: <SettingsIcon {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "cost-tracking",
            page: "cost-tracking",
            get label() {
              return translateUi("ui.121aef15682d");
            },
            icon: <BarChart3 {...ICON} />,
            roles: all_admin_roles,
          },
          {
            key: "ui-theme",
            page: "ui-theme",
            get label() {
              return translateUi("ui.aa7be2671448");
            },
            icon: <Palette {...ICON} />,
            roles: all_admin_roles,
          },
        ],
      },
    ],
  },
];

if (process.env.NEXT_PUBLIC_MANAGED_GATEWAY === "1") {
  menuGroups.push(
    {
      get groupLabel() {
        return gatewayText("mcp");
      },
      items: [
        {
          key: "gateway-services",
          page: "gateway-services",
          get label() {
            return gatewayText("services");
          },
          icon: <Server {...ICON} />,
        },
        {
          key: "gateway-tools",
          page: "gateway-tools",
          get label() {
            return gatewayText("tools");
          },
          icon: <Search {...ICON} />,
        },
        {
          key: "gateway-request-cache",
          page: "gateway-request-cache",
          get label() {
            return gatewayText("request-cache");
          },
          icon: <Database {...ICON} />,
        },
      ],
    },
    {
      get groupLabel() {
        return gatewayText("access");
      },
      items: [
        {
          key: "gateway-apis",
          page: "gateway-apis",
          get label() {
            return gatewayText("apis");
          },
          roles: all_admin_roles,
          icon: <KeyRound {...ICON} />,
        },
        {
          key: "gateway-grants",
          page: "gateway-grants",
          get label() {
            return gatewayText("grants");
          },
          roles: all_admin_roles,
          icon: <Users {...ICON} />,
        },
        {
          key: "gateway-members",
          page: "gateway-members",
          get label() {
            return gatewayText("members");
          },
          roles: all_admin_roles,
          icon: <Users {...ICON} />,
        },
        {
          key: "gateway-departments",
          page: "gateway-departments",
          get label() {
            return gatewayText("departments");
          },
          roles: all_admin_roles,
          icon: <Building2 {...ICON} />,
        },
        {
          key: "gateway-accounts",
          page: "gateway-accounts",
          get label() {
            return gatewayText("accounts");
          },
          icon: <Database {...ICON} />,
        },
        {
          key: "gateway-audit",
          page: "gateway-audit",
          get label() {
            return gatewayText("audit");
          },
          roles: all_admin_roles,
          icon: <ScrollText {...ICON} />,
        },
        {
          key: "gateway-overview",
          page: "gateway-overview",
          get label() {
            return gatewayText("overview");
          },
          icon: <House {...ICON} />,
        },
      ],
    },
  );
}
