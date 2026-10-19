"use client";
import { LocalizedText } from "@/contexts/LanguageContext";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import { t as translateUi } from "@/i18n";

import { ColumnDef } from "@tanstack/react-table";
import { Copy, Info, KeyRound, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { UserInfo } from "@/components/networking";
import { createSelectionColumn, DataTableSortHeader } from "@/components/shared/DataTable";
import { CellTooltip, DateCell, IdentityCell, MoneyCell, StatusBadge } from "@/components/shared/table_cells";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/cva.config";
import { copyToClipboard } from "@/utils/dataUtils";

const SSO_ID_HINT =
  "SSO ID is the ID of the user in the SSO provider. If the user is not using SSO, this will be null.";

const SCIM_INACTIVE_HINT = "Deactivated via SCIM (external identity provider). The user's virtual keys are blocked.";

function isScimInactive(user: UserInfo): boolean {
  return (user.metadata as Record<string, unknown> | null | undefined)?.scim_active === false;
}

interface UserRowActionsProps {
  user: UserInfo;
  onUserClick: (userId: string, openInEditMode?: boolean) => void;
  onDeleteUser: (user: UserInfo) => void;
  onResetPassword: (userId: string) => void;
}

function UserRowActions({ user, onUserClick, onDeleteUser, onResetPassword }: UserRowActionsProps) {
  const { t: uiT } = useDashboardLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={uiT("ui.3f22ddca77d7")}
        data-testid={`user-actions-${user.user_id}`}
        className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "text-muted-foreground")}
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onUserClick(user.user_id, true)} data-testid="user-action-edit">
          <Pencil />
          {uiT("ui.05b88d18fc0d")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onResetPassword(user.user_id)} data-testid="user-action-reset-password">
          <KeyRound />
          {uiT("ui.e0edfeb3a71a")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => void copyToClipboard(user.user_id, "User ID copied")}
          data-testid="user-action-copy"
        >
          <Copy />
          {uiT("ui.a43cb32a519a")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDeleteUser(user)} data-testid="user-action-delete">
          <Trash2 />
          {uiT("ui.58363fd94240")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export interface UsersTableColumnsDeps {
  possibleUIRoles: Record<string, Record<string, string>> | null;
  includeSelection: boolean;
  onUserClick: (userId: string, openInEditMode?: boolean) => void;
  onDeleteUser: (user: UserInfo) => void;
  onResetPassword: (userId: string) => void;
}

export const getUsersTableColumns = ({
  possibleUIRoles,
  includeSelection,
  onUserClick,
  onDeleteUser,
  onResetPassword,
}: UsersTableColumnsDeps): ColumnDef<UserInfo>[] => {
  const baseColumns: ColumnDef<UserInfo>[] = [
    {
      id: "user_id",
      accessorKey: "user_id",
      meta: {
        get title() {
          return translateUi("ui.7967e089a7b9");
        },
      },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translateUi("ui.7967e089a7b9")} variant="header-cycle" />
      ),
      size: 220,
      enableSorting: true,
      cell: ({ row }) => (
        <IdentityCell
          title={row.original.user_id}
          titleClassName="font-mono text-xs text-primary"
          onClick={() => onUserClick(row.original.user_id, false)}
        />
      ),
    },
    {
      id: "user_email",
      accessorKey: "user_email",
      meta: {
        get title() {
          return translateUi("ui.969ccbd3cf63");
        },
      },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translateUi("ui.969ccbd3cf63")} variant="header-cycle" />
      ),
      size: 220,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="block max-w-60 truncate text-sm" title={row.original.user_email ?? undefined}>
          {row.original.user_email || "-"}
        </span>
      ),
    },
    {
      id: "status",
      meta: {
        get title() {
          return translateUi("ui.920e413c7d41");
        },
        skeleton: "badge",
      },
      get header() {
        return translateUi("ui.920e413c7d41");
      },
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        if (isScimInactive(row.original)) {
          return (
            <StatusBadge
              tone="error"
              label={translateUi("ui.ac7c949f1211")}
              tooltip={SCIM_INACTIVE_HINT}
              dataTestId={`user-status-${row.original.user_id}`}
            />
          );
        }
        return (
          <StatusBadge
            tone="success"
            label={translateUi("ui.92340695899b")}
            dataTestId={`user-status-${row.original.user_id}`}
          />
        );
      },
    },
    {
      id: "user_role",
      accessorKey: "user_role",
      meta: {
        get title() {
          return translateUi("ui.1720a0bdf895");
        },
      },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translateUi("ui.1720a0bdf895")} variant="header-cycle" />
      ),
      size: 160,
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm">
          <LocalizedText
            text={(row.original.user_role && possibleUIRoles?.[row.original.user_role]?.ui_label) || "-"}
          />
        </span>
      ),
    },
    {
      id: "user_alias",
      accessorKey: "user_alias",
      meta: {
        get title() {
          return translateUi("ui.846f00988e00");
        },
      },
      get header() {
        return translateUi("ui.846f00988e00");
      },
      size: 150,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-40 truncate text-sm" title={row.original.user_alias ?? undefined}>
          {row.original.user_alias || "-"}
        </span>
      ),
    },
    {
      id: "spend",
      accessorKey: "spend",
      meta: {
        get title() {
          return translateUi("ui.d1b5ad72df63");
        },
        numeric: true,
      },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translateUi("ui.d1b5ad72df63")} variant="header-cycle" />
      ),
      size: 130,
      enableSorting: true,
      cell: ({ row }) => <MoneyCell value={row.original.spend} decimals={2} />,
    },
    {
      id: "max_budget",
      accessorKey: "max_budget",
      meta: {
        get title() {
          return translateUi("ui.e9b19e9155c8");
        },
        numeric: true,
      },
      get header() {
        return translateUi("ui.e9b19e9155c8");
      },
      size: 130,
      enableSorting: false,
      cell: ({ row }) => (
        <MoneyCell value={row.original.max_budget} decimals={2} emptyText={translateUi("ui.11dde17d6c3e")} showZero />
      ),
    },
    {
      id: "sso_user_id",
      accessorKey: "sso_user_id",
      meta: {
        get title() {
          return translateUi("ui.b76f39051ffc");
        },
      },
      header: () => (
        <span className="flex items-center gap-1.5">
          {translateUi("ui.b76f39051ffc")}
          <CellTooltip
            content={SSO_ID_HINT}
            trigger={
              <Info className="size-3.5 shrink-0 text-muted-foreground" aria-label={translateUi("ui.e30debe146d6")} />
            }
          />
        </span>
      ),
      size: 160,
      enableSorting: false,
      cell: ({ row }) => (
        <span className="block max-w-40 truncate font-mono text-xs" title={row.original.sso_user_id ?? undefined}>
          {row.original.sso_user_id ?? "-"}
        </span>
      ),
    },
    {
      id: "key_count",
      accessorKey: "key_count",
      meta: {
        get title() {
          return translateUi("ui.d1c0ad6c4bdd");
        },
        skeleton: "badge",
      },
      get header() {
        return translateUi("ui.d1c0ad6c4bdd");
      },
      size: 120,
      enableSorting: false,
      cell: ({ row }) => {
        const keyCount = row.original.key_count;
        if (keyCount > 0) {
          return (
            <Badge
              variant="outline"
              className="whitespace-nowrap border-indigo-200 bg-indigo-50 font-normal text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
            >
              {keyCount} {keyCount === 1 ? translateUi("ui.99a52df3ff3d") : translateUi("ui.f0d66a79c138")}
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="whitespace-nowrap border-border bg-muted font-normal text-muted-foreground"
          >
            {translateUi("ui.2b33d511be24")}
          </Badge>
        );
      },
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      meta: {
        get title() {
          return translateUi("ui.3d44337010bf");
        },
      },
      header: ({ column }) => (
        <DataTableSortHeader column={column} title={translateUi("ui.3d44337010bf")} variant="header-cycle" />
      ),
      size: 130,
      enableSorting: true,
      cell: ({ row }) => <DateCell value={row.original.created_at} precision="date" />,
    },
    {
      id: "updated_at",
      accessorKey: "updated_at",
      meta: {
        get title() {
          return translateUi("ui.e35c8e4f5cb5");
        },
      },
      get header() {
        return translateUi("ui.e35c8e4f5cb5");
      },
      size: 130,
      enableSorting: false,
      cell: ({ row }) => <DateCell value={row.original.updated_at} precision="date" />,
    },
    {
      id: "actions",
      meta: {
        get title() {
          return translateUi("ui.ff8059dc6752");
        },
        className: "text-right",
        headerClassName: "text-right",
      },
      header: () => <span className="sr-only">{translateUi("ui.ff8059dc6752")}</span>,
      size: 60,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <UserRowActions
            user={row.original}
            onUserClick={onUserClick}
            onDeleteUser={onDeleteUser}
            onResetPassword={onResetPassword}
          />
        </div>
      ),
    },
  ];

  if (!includeSelection) {
    return baseColumns;
  }

  return [
    createSelectionColumn<UserInfo>({
      rowAriaLabel: (row) => `Select ${row.original.user_email || row.original.user_id}`,
    }),
    ...baseColumns,
  ];
};
