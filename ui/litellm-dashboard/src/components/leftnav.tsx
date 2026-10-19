"use client";
import { menuGroups, type MenuItem, type MenuGroup } from "./NavigationItems";
export type { MenuItem, MenuGroup } from "./NavigationItems";

import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi, translateText } from "@/i18n";
import { canViewProjectsPage } from "@/app/(dashboard)/hooks/projects/projectAccess";
import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import useIsOrgAdmin from "@/app/(dashboard)/hooks/useIsOrgAdmin";
import { useHealthReadinessDetails } from "@/app/(dashboard)/hooks/healthReadiness/useHealthReadinessDetails";
import { useLogout } from "@/app/(dashboard)/hooks/useLogout";
import { getProxyBaseUrl } from "@/components/networking";
import { useTheme } from "@/contexts/ThemeContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
  sidebarMenuButtonVariants,
} from "@/components/shared/Sidebar";
import { ChevronRight, ExternalLink, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cva.config";

import { isAdminRole, isUserTeamAdminForAnyTeam } from "../utils/roles";

import SidebarAccountMenu from "./SidebarAccountMenu/SidebarAccountMenu";
import SidebarUsageCard from "./SidebarUsageCard";
import { routeSegmentForPathname, uiHref } from "@/utils/uiHref";

const LOGO_CLASS_NAME =
  "h-5 w-auto max-w-[150px] object-contain group-data-[collapsed=true]/sidebar:h-7 group-data-[collapsed=true]/sidebar:w-7";

function bundledLogoSrc(baseUrl: string, { dark, monogram }: { dark: boolean; monogram: boolean }): string {
  const query = [dark && "theme=dark", monogram && "variant=monogram"].filter(Boolean).join("&");
  return `${baseUrl}/get_image${query ? `?${query}` : ""}`;
}

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  enabledPagesInternalUsers?: string[] | null;
  enableProjectsUI?: boolean;
  disableAgentsForInternalUsers?: boolean;
  allowAgentsForTeamAdmins?: boolean;
  disableVectorStoresForInternalUsers?: boolean;
  allowVectorStoresForTeamAdmins?: boolean;
}

export interface MenuVisibilityContext {
  userRole: string;
  isViewOnly: boolean;
  isOrgAdmin: boolean;
  isTeamAdmin: boolean;
  enabledPagesInternalUsers?: string[] | null;
  enableProjectsUI?: boolean;
  disableAgentsForInternalUsers?: boolean;
  allowAgentsForTeamAdmins?: boolean;
  disableVectorStoresForInternalUsers?: boolean;
  allowVectorStoresForTeamAdmins?: boolean;
}

const adminPageVisibility = (item: MenuItem, context: MenuVisibilityContext, isAdmin: boolean): boolean | null => {
  if (item.key !== "organizations" && item.key !== "users") return null;
  const hasRoleAccess = !item.roles || item.roles.includes(context.userRole) || context.isOrgAdmin;
  if (!hasRoleAccess) return false;
  if (!isAdmin && context.enabledPagesInternalUsers != null) {
    return context.enabledPagesInternalUsers.includes(item.page);
  }
  return true;
};

const projectPageIsVisible = (item: MenuItem, context: MenuVisibilityContext): boolean => {
  if (item.key !== "projects") return true;
  if (!context.enableProjectsUI) return false;
  return canViewProjectsPage({
    userRole: context.userRole,
    isOrgAdmin: context.isOrgAdmin,
    isTeamAdmin: context.isTeamAdmin,
  });
};

const pageIsDisabledForInternalUsers = (
  item: MenuItem,
  pageKey: "agents" | "vector-stores",
  isAdmin: boolean,
  context: MenuVisibilityContext,
): boolean => {
  const isDisabled =
    pageKey === "agents" ? context.disableAgentsForInternalUsers : context.disableVectorStoresForInternalUsers;
  const allowedForTeamAdmins =
    pageKey === "agents" ? context.allowAgentsForTeamAdmins : context.allowVectorStoresForTeamAdmins;
  if (item.key !== pageKey || isAdmin || !isDisabled) return false;
  return !(allowedForTeamAdmins && context.isTeamAdmin);
};

const pageIsEnabledForInternalUser = (item: MenuItem, context: MenuVisibilityContext): boolean => {
  const enabledPages = context.enabledPagesInternalUsers;
  if (enabledPages == null) return true;
  if (item.children?.some((child) => enabledPages.includes(child.page))) return true;
  return enabledPages.includes(item.page);
};

const menuItemIsVisible = (item: MenuItem, context: MenuVisibilityContext, isAdmin: boolean): boolean => {
  if (item.children && item.children.length === 0) return false;
  if (item.key === "llm-playground" && context.isViewOnly) return false;
  const adminVisibility = adminPageVisibility(item, context, isAdmin);
  if (adminVisibility !== null) return adminVisibility;
  if (!projectPageIsVisible(item, context)) return false;
  if (pageIsDisabledForInternalUsers(item, "agents", isAdmin, context)) return false;
  if (pageIsDisabledForInternalUsers(item, "vector-stores", isAdmin, context)) return false;
  if (item.roles && !item.roles.includes(context.userRole)) return false;
  if (!isAdmin && context.enabledPagesInternalUsers != null) return pageIsEnabledForInternalUser(item, context);
  return true;
};

export const visibleMenuGroups = (groups: readonly MenuGroup[], context: MenuVisibilityContext): MenuGroup[] => {
  const isAdmin = isAdminRole(context.userRole);
  const filterItems = (items: MenuItem[]): MenuItem[] =>
    items
      .map((item) => ({ ...item, children: item.children ? filterItems(item.children) : undefined }))
      .filter((item) => menuItemIsVisible(item, context, isAdmin));

  return groups
    .filter((group) => !group.roles || group.roles.includes(context.userRole))
    .map((group) => ({ groupLabel: group.groupLabel, items: filterItems(group.items) }))
    .filter((group) => group.items.length > 0);
};

// Menu groups organized by category - defined outside component for export.
// Shape (key/page/label/roles/children) is consumed by page_utils.ts; only the
// icons changed to lucide as part of the sidebar redesign.

const HOME_ROUTE = "home";

export const routeOf = (item: MenuItem): string => item.route ?? item.page;

const routeForPathname = (pathname: string): string => routeSegmentForPathname(pathname) || HOME_ROUTE;

const findParentKey = (route: string): string | null => {
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (item.children?.some((c) => routeOf(c) === route)) return item.key;
    }
  }
  return null;
};

const findMenuItemKey = (route: string): string => {
  for (const group of menuGroups) {
    for (const item of group.items) {
      if (routeOf(item) === route) return item.key;
      const child = item.children?.find((c) => routeOf(c) === route);
      if (child) return child.key;
    }
  }
  return HOME_ROUTE;
};

const SECTION_DISPLAY: Record<string, string> = {
  get "AI GATEWAY"() {
    return translateUi("ui.47219de2f95b");
  },
  OBSERVABILITY: "Observability",
  "ACCESS CONTROL": "Access Control",
  "DEVELOPER TOOLS": "Developer Tools",
  SETTINGS: "Settings",
};

export const sectionText = (groupLabel: string): string => SECTION_DISPLAY[groupLabel] ?? groupLabel;

const prettify = (key: string): string =>
  key
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const labelText = (item: MenuItem): string => (typeof item.label === "string" ? item.label : prettify(item.key));

// Breadcrumb ("Section" / "Page") for the top bar, derived from the same nav config.
export const getBreadcrumb = (pathname: string): { section: string | null; title: string } => {
  const route = routeForPathname(pathname);
  for (const group of menuGroups) {
    for (const item of group.items) {
      const section = sectionText(group.groupLabel);
      if (routeOf(item) === route) return { section, title: labelText(item) };
      const child = item.children?.find((c) => routeOf(c) === route);
      if (child) return { section, title: labelText(child) };
    }
  }
  return { section: null, title: prettify(route) };
};

const Sidebar_: React.FC<SidebarProps> = ({
  collapsed = false,
  onToggleCollapsed,
  enabledPagesInternalUsers,
  enableProjectsUI,
  disableAgentsForInternalUsers,
  allowAgentsForTeamAdmins,
  disableVectorStoresForInternalUsers,
  allowVectorStoresForTeamAdmins,
}) => {
  const { t: uiT } = useDashboardLanguage();

  const { userId, accessToken, userRole, isViewOnly } = useAuthorized();
  const isOrgAdmin = useIsOrgAdmin();
  const { data: teams } = useTeams();
  const { logoUrl, logoUrlDark } = useTheme();
  const [erroredDarkLogo, setErroredDarkLogo] = useState<string | null>(null);
  const { data: healthData } = useHealthReadinessDetails(accessToken);
  const logout = useLogout(accessToken);

  const baseUrl = getProxyBaseUrl();
  const version = healthData?.litellm_version;
  const currentRoute = routeForPathname(usePathname());
  const selectedKey = findMenuItemKey(currentRoute);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const parent = findParentKey(currentRoute);
    return new Set(parent ? [parent] : []);
  });

  // Keep the active page's parent group expanded as the user navigates, using the
  // "adjust state during render" pattern rather than an effect (avoids a
  // setState-in-effect render cascade).
  const [prevRoute, setPrevRoute] = useState(currentRoute);
  if (currentRoute !== prevRoute) {
    setPrevRoute(currentRoute);
    const parent = findParentKey(currentRoute);
    if (parent && !openGroups.has(parent)) {
      setOpenGroups((prev) => new Set(prev).add(parent));
    }
  }

  const isTeamAdmin = useMemo(() => isUserTeamAdminForAnyTeam(teams ?? null, userId ?? ""), [teams, userId]);

  const visibleGroups = useMemo(() => {
    const context: MenuVisibilityContext = {
      userRole,
      isViewOnly,
      isOrgAdmin,
      isTeamAdmin,
      enabledPagesInternalUsers,
      enableProjectsUI,
      disableAgentsForInternalUsers,
      allowAgentsForTeamAdmins,
      disableVectorStoresForInternalUsers,
      allowVectorStoresForTeamAdmins,
    };
    return visibleMenuGroups(menuGroups, context);
  }, [
    allowAgentsForTeamAdmins,
    allowVectorStoresForTeamAdmins,
    disableAgentsForInternalUsers,
    disableVectorStoresForInternalUsers,
    enableProjectsUI,
    enabledPagesInternalUsers,
    isOrgAdmin,
    isTeamAdmin,
    isViewOnly,
    userRole,
  ]);

  const toggleGroup = (key: string) => {
    if (collapsed) {
      onToggleCollapsed?.();
      setOpenGroups((prev) => new Set(prev).add(key));
      return;
    }
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderLeaf = (item: MenuItem, isChild: boolean) => {
    const active = selectedKey === item.key;
    const size = isChild ? "sub" : "default";
    const label = (
      <span className="flex-1 truncate group-data-[collapsed=true]/sidebar:hidden">
        {typeof item.label === "string" ? translateText(item.label) : item.label}
      </span>
    );

    if (item.external_url) {
      return (
        <a
          key={item.key}
          href={item.external_url}
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? labelText(item) : undefined}
          data-active={active || undefined}
          className={cn(sidebarMenuButtonVariants({ isActive: active, size }))}
        >
          {item.icon}
          {label}
          <ExternalLink className="size-3.5 shrink-0 opacity-70 group-data-[collapsed=true]/sidebar:hidden" />
        </a>
      );
    }

    return (
      <Link
        key={item.key}
        href={uiHref(routeOf(item))}
        title={collapsed ? labelText(item) : undefined}
        data-active={active || undefined}
        className={cn(sidebarMenuButtonVariants({ isActive: active, size }))}
      >
        {item.icon}
        {label}
      </Link>
    );
  };

  const renderItem = (item: MenuItem) => {
    const isGroup = !!item.children && item.children.length > 0;
    if (!isGroup) {
      return <SidebarMenuItem key={item.key}>{renderLeaf(item, false)}</SidebarMenuItem>;
    }

    const active = selectedKey === item.key;
    const open = openGroups.has(item.key);
    return (
      <SidebarMenuItem key={item.key}>
        <SidebarMenuButton
          isActive={active}
          aria-expanded={open}
          onClick={() => toggleGroup(item.key)}
          title={collapsed ? labelText(item) : undefined}
        >
          {item.icon}
          <span className="flex-1 truncate group-data-[collapsed=true]/sidebar:hidden">
            {typeof item.label === "string" ? translateText(item.label) : item.label}
          </span>
          <ChevronRight
            className={cn(
              "size-4 shrink-0 transition-transform group-data-[collapsed=true]/sidebar:hidden",
              open && "rotate-90",
            )}
          />
        </SidebarMenuButton>
        {open && (
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <SidebarMenuItem key={child.key}>{renderLeaf(child, true)}</SidebarMenuItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  };

  const logoSrc = logoUrl || bundledLogoSrc(baseUrl, { dark: false, monogram: collapsed });
  const reachableDarkLogo = logoUrlDark === erroredDarkLogo ? null : logoUrlDark;
  const darkLogoSrc = reachableDarkLogo || logoUrl || bundledLogoSrc(baseUrl, { dark: true, monogram: collapsed });

  return (
    <Sidebar collapsed={collapsed}>
      <SidebarHeader className="h-14 border-b border-border group-data-[collapsed=true]/sidebar:h-auto">
        <div className="flex items-center justify-between gap-2 group-data-[collapsed=true]/sidebar:flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <Link href={uiHref("")} className="flex min-w-0 items-center" aria-label={uiT("ui.5e2960719425")}>
              <img src={logoSrc} alt="LiteLLM" className={cn(LOGO_CLASS_NAME, "dark:hidden")} />
              <img
                src={darkLogoSrc}
                alt=""
                aria-hidden
                onError={() => setErroredDarkLogo(logoUrlDark)}
                className={cn(LOGO_CLASS_NAME, "hidden dark:block")}
              />
            </Link>
            {version && (
              <Badge
                variant="outline"
                render={<a href="https://docs.litellm.ai/release_notes" target="_blank" rel="noopener noreferrer" />}
                className="px-1.5 py-0 font-mono text-[10px] font-medium text-muted-foreground group-data-[collapsed=true]/sidebar:hidden"
              >
                v{version}
              </Badge>
            )}
          </div>
          {onToggleCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? uiT("ui.37a5d6485e10") : uiT("ui.aab31cde23ba")}
              className="flex-none text-muted-foreground"
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
          )}
        </div>
      </SidebarHeader>

      <ScrollArea className="min-h-0 flex-1">
        <nav className="flex flex-col gap-0.5 px-3 pb-3">
          {visibleGroups.map((group, gi) => (
            <SidebarGroup key={group.groupLabel}>
              {gi > 0 && <SidebarSeparator className="hidden group-data-[collapsed=true]/sidebar:block" />}
              <SidebarGroupLabel>{translateText(group.groupLabel)}</SidebarGroupLabel>
              <SidebarMenu>{group.items.map((item) => renderItem(item))}</SidebarMenu>
            </SidebarGroup>
          ))}
        </nav>
      </ScrollArea>

      <SidebarFooter>
        {isAdminRole(userRole) && (
          <SidebarUsageCard
            accessToken={accessToken}
            collapsed={collapsed}
            onExpandRail={() => onToggleCollapsed?.()}
          />
        )}
        <SidebarAccountMenu onLogout={logout} collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
};

export default Sidebar_;

export { menuGroups };
